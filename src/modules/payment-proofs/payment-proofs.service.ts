import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoinTransactionService } from '../coin/services/coin-transaction.service';
import {
  CreatePaymentProofDto,
  ApprovePaymentProofDto,
  RejectPaymentProofDto,
} from './dto';
import {
  PaymentProofStatus,
  ScheduleStatus,
  TicketStatus,
  BookingSource,
  UserRole,
  CoinTransactionReason,
} from '@prisma/client';

@Injectable()
export class PaymentProofsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coinTransactionService: CoinTransactionService,
  ) {}

  /**
   * Generate unique payment proof number
   * Format: PAY-YYYYMMDD-XXXXX
   */
  private async generateProofNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await this.prisma.paymentProof.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = String(count + 1).padStart(5, '0');
    return `PAY-${dateStr}-${sequence}`;
  }

  /**
   * Generate unique ticket number
   * Format: TKT-YYYYMMDD-XXXXX
   */
  private async generateTicketNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await this.prisma.ticket.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = String(count + 1).padStart(5, '0');
    return `TKT-${dateStr}-${sequence}`;
  }

  /**
   * Customer uploads payment proof
   */
  async create(
    createDto: CreatePaymentProofDto,
    paymentProofUrl: string,
    userId: string,
  ) {
    // Get customer profile
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    // Validate schedule exists and is bookable
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: createDto.scheduleId },
      include: {
        route: true,
        vehicle: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    if (schedule.status !== ScheduleStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot book ticket for schedule with status: ${schedule.status}`,
      );
    }

    // Validate schedule is in the future
    if (schedule.departureTime < new Date()) {
      throw new BadRequestException('Cannot book ticket for past schedules');
    }

    const passengerCount = createDto.passengers.length;

    // Check if schedule has enough available seats
    if (schedule.availableSeats < passengerCount) {
      throw new BadRequestException(
        `Not enough seats available. Requested: ${passengerCount}, Available: ${schedule.availableSeats}`,
      );
    }

    // Validate seat numbers if provided (no duplicates within this booking)
    const seatNumbers = createDto.passengers
      .map((p) => p.seatNumber)
      .filter((s) => s);

    if (seatNumbers.length > 0) {
      const uniqueSeats = new Set(seatNumbers);
      if (uniqueSeats.size !== seatNumbers.length) {
        throw new BadRequestException(
          'Duplicate seat numbers are not allowed within the same booking',
        );
      }

      // Check if seats are already taken by other confirmed/pending tickets
      const existingTickets = await this.prisma.ticket.findMany({
        where: {
          scheduleId: createDto.scheduleId,
          status: {
            in: [TicketStatus.PENDING_APPROVAL, TicketStatus.CONFIRMED],
          },
        },
        include: {
          passengers: true,
        },
      });

      const takenSeats = existingTickets.flatMap((ticket) =>
        ticket.passengers
          .map((p) => p.seatNumber)
          .filter((s) => s),
      );

      const conflictingSeats = seatNumbers.filter((seat) =>
        seat ? takenSeats.includes(seat) : false,
      );

      if (conflictingSeats.length > 0) {
        throw new BadRequestException(
          `The following seats are already taken: ${conflictingSeats.join(', ')}`,
        );
      }

      // Also check pending payment proofs
      const existingProofs = await this.prisma.paymentProof.findMany({
        where: {
          scheduleId: createDto.scheduleId,
          status: PaymentProofStatus.PENDING,
        },
        include: {
          passengers: true,
        },
      });

      const takenSeatsInProofs = existingProofs.flatMap((proof) =>
        proof.passengers
          .map((p) => p.seatNumber)
          .filter((s) => s),
      );

      const conflictingSeatsInProofs = seatNumbers.filter((seat) =>
        seat ? takenSeatsInProofs.includes(seat) : false,
      );

      if (conflictingSeatsInProofs.length > 0) {
        throw new BadRequestException(
          `The following seats are already being requested: ${conflictingSeatsInProofs.join(', ')}`,
        );
      }
    }

    // Calculate total price
    const totalPrice = schedule.price * passengerCount;

    // Generate proof number
    const proofNumber = await this.generateProofNumber();

    // Create payment proof with passengers
    const paymentProof = await this.prisma.paymentProof.create({
      data: {
        proofNumber,
        scheduleId: createDto.scheduleId,
        customerId: customer.id,
        bookerPhone: createDto.bookerPhone,
        pickupAddress: createDto.pickupAddress,
        dropoffAddress: createDto.dropoffAddress,
        totalPassengers: passengerCount,
        totalPrice,
        paymentProofUrl,
        notes: createDto.notes,
        passengers: {
          create: createDto.passengers,
        },
      },
      include: {
        passengers: true,
        schedule: {
          include: {
            route: true,
            vehicle: true,
          },
        },
        customer: true,
      },
    });

    return paymentProof;
  }

  /**
   * Get all payment proofs (admin only)
   */
  async findAll(status?: PaymentProofStatus) {
    return this.prisma.paymentProof.findMany({
      where: status ? { status } : undefined,
      include: {
        passengers: true,
        schedule: {
          include: {
            route: true,
            vehicle: true,
          },
        },
        customer: true,
        ticket: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get payment proofs for a customer
   */
  async findByCustomer(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return this.prisma.paymentProof.findMany({
      where: { customerId: customer.id },
      include: {
        passengers: true,
        schedule: {
          include: {
            route: true,
            vehicle: true,
          },
        },
        ticket: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get payment proof by ID
   */
  async findOne(id: string, userId: string, userRole: UserRole) {
    const paymentProof = await this.prisma.paymentProof.findUnique({
      where: { id },
      include: {
        passengers: true,
        schedule: {
          include: {
            route: true,
            vehicle: true,
          },
        },
        customer: true,
        ticket: {
          include: {
            passengers: true,
          },
        },
      },
    });

    if (!paymentProof) {
      throw new NotFoundException('Payment proof not found');
    }

    // Check permissions
    if (userRole === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
      });

      if (customer?.id !== paymentProof.customerId) {
        throw new ForbiddenException(
          'You can only view your own payment proofs',
        );
      }
    }

    return paymentProof;
  }

  /**
   * Admin approves payment proof and creates ticket
   */
  async approve(
    id: string,
    approveDto: ApprovePaymentProofDto,
    adminUserId: string,
  ) {
    const paymentProof = await this.prisma.paymentProof.findUnique({
      where: { id },
      include: {
        passengers: true,
        schedule: true,
      },
    });

    if (!paymentProof) {
      throw new NotFoundException('Payment proof not found');
    }

    if (paymentProof.status !== PaymentProofStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve payment proof with status: ${paymentProof.status}`,
      );
    }

    // Get admin profile
    const admin = await this.prisma.admin.findUnique({
      where: { userId: adminUserId },
    });

    if (!admin) {
      throw new NotFoundException('Admin profile not found');
    }

    // Check schedule still has enough seats
    const schedule = paymentProof.schedule;
    if (schedule.availableSeats < paymentProof.totalPassengers) {
      throw new BadRequestException(
        'Not enough seats available in schedule',
      );
    }

    if (schedule.status !== ScheduleStatus.SCHEDULED) {
      throw new BadRequestException(
        `Cannot approve booking for schedule with status: ${schedule.status}`,
      );
    }

    if (schedule.departureTime < new Date()) {
      throw new BadRequestException(
        'Cannot approve booking for past schedules',
      );
    }

    // Calculate coin cost for admin
    const coinCost = paymentProof.totalPassengers * 10000;

    // Check admin coin balance
    if (admin.coinBalance < coinCost) {
      throw new BadRequestException(
        `Insufficient coin balance. Required: ${coinCost}, Available: ${admin.coinBalance}`,
      );
    }

    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber();

    // Create ticket and update payment proof in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          scheduleId: paymentProof.scheduleId,
          customerId: paymentProof.customerId,
          adminId: admin.id,
          bookingSource: BookingSource.CUSTOMER_APP,
          bookerPhone: paymentProof.bookerPhone,
          pickupAddress: paymentProof.pickupAddress,
          dropoffAddress: paymentProof.dropoffAddress,
          totalPassengers: paymentProof.totalPassengers,
          totalPrice: paymentProof.totalPrice,
          status: TicketStatus.CONFIRMED,
          paymentDate: new Date(),
          notes: approveDto.notes || paymentProof.notes,
          passengers: {
            create: paymentProof.passengers.map((p) => ({
              name: p.name,
              identityNumber: p.identityNumber,
              phone: p.phone,
              seatNumber: p.seatNumber,
            })),
          },
        },
        include: {
          passengers: true,
        },
      });

      // Update schedule available seats
      await tx.schedule.update({
        where: { id: paymentProof.scheduleId },
        data: {
          availableSeats: {
            decrement: paymentProof.totalPassengers,
          },
        },
      });

      // Deduct coins from admin
      await this.coinTransactionService.deductCoins(
        admin.id,
        coinCost,
        CoinTransactionReason.TICKET_BOOKING,
        {
          referenceId: ticket.id,
          referenceType: 'ticket',
          createdBy: adminUserId,
          prismaClient: tx,
        },
      );

      // Update payment proof
      const updatedProof = await tx.paymentProof.update({
        where: { id },
        data: {
          status: PaymentProofStatus.APPROVED,
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
          ticketId: ticket.id,
        },
        include: {
          passengers: true,
          schedule: {
            include: {
              route: true,
              vehicle: true,
            },
          },
          customer: true,
          ticket: {
            include: {
              passengers: true,
            },
          },
        },
      });

      return { paymentProof: updatedProof, ticket };
    });

    return result;
  }

  /**
   * Admin rejects payment proof
   */
  async reject(
    id: string,
    rejectDto: RejectPaymentProofDto,
    adminUserId: string,
  ) {
    const paymentProof = await this.prisma.paymentProof.findUnique({
      where: { id },
      include: {
        passengers: true,
        schedule: {
          include: {
            route: true,
            vehicle: true,
          },
        },
        customer: true,
      },
    });

    if (!paymentProof) {
      throw new NotFoundException('Payment proof not found');
    }

    if (paymentProof.status !== PaymentProofStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject payment proof with status: ${paymentProof.status}`,
      );
    }

    const updatedProof = await this.prisma.paymentProof.update({
      where: { id },
      data: {
        status: PaymentProofStatus.REJECTED,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
        rejectionReason: rejectDto.rejectionReason,
      },
      include: {
        passengers: true,
        schedule: {
          include: {
            route: true,
            vehicle: true,
          },
        },
        customer: true,
      },
    });

    return updatedProof;
  }

  /**
   * Delete payment proof (only if not approved)
   */
  async remove(id: string, userId: string, userRole: UserRole) {
    const paymentProof = await this.prisma.paymentProof.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!paymentProof) {
      throw new NotFoundException('Payment proof not found');
    }

    // Check permissions
    if (userRole === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
      });

      if (customer?.id !== paymentProof.customerId) {
        throw new ForbiddenException(
          'You can only delete your own payment proofs',
        );
      }
    }

    if (paymentProof.status === PaymentProofStatus.APPROVED) {
      throw new BadRequestException(
        'Cannot delete approved payment proof. Please cancel the ticket instead.',
      );
    }

    await this.prisma.paymentProof.delete({
      where: { id },
    });

    return { message: 'Payment proof deleted successfully' };
  }
}
