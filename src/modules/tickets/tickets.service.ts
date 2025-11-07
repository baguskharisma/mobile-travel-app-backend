import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoinTransactionService } from '../coin/services/coin-transaction.service';
import { WebsocketGateway } from '../../websocket/websocket.gateway';
import { CreateTicketDto, QueryTicketsDto } from './dto';
import {
  TicketStatus,
  BookingSource,
  ScheduleStatus,
  CoinTransactionReason,
  UserRole,
} from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coinTransactionService: CoinTransactionService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Generate unique ticket number
   * Format: TKT-YYYYMMDD-XXXXX
   */
  private async generateTicketNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    // Get count of tickets created today
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
   * Calculate total price based on schedule price and number of passengers
   */
  private calculateTotalPrice(schedulePrice: number, passengerCount: number): number {
    return schedulePrice * passengerCount;
  }

  /**
   * Calculate coin cost (10,000 per passenger)
   */
  private calculateCoinCost(passengerCount: number): number {
    return passengerCount * 10000;
  }

  async create(createTicketDto: CreateTicketDto, userId: string, userRole: UserRole) {
    // Validate schedule exists and is bookable
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: createTicketDto.scheduleId },
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

    // Validate passenger count matches passengers array
    const passengerCount = createTicketDto.passengers.length;

    // Check if schedule has enough available seats
    if (schedule.availableSeats < passengerCount) {
      throw new BadRequestException(
        `Not enough seats available. Requested: ${passengerCount}, Available: ${schedule.availableSeats}`,
      );
    }

    // Validate seat numbers if provided (no duplicates within this booking)
    const seatNumbers = createTicketDto.passengers
      .map((p) => p.seatNumber)
      .filter((s) => s);
    if (seatNumbers.length > 0) {
      const uniqueSeats = new Set(seatNumbers);
      if (uniqueSeats.size !== seatNumbers.length) {
        throw new BadRequestException('Duplicate seat numbers in passenger list');
      }

      // Check if seats are already taken
      const takenSeats = await this.prisma.passenger.findMany({
        where: {
          seatNumber: { in: seatNumbers as string[] },
          ticket: {
            scheduleId: createTicketDto.scheduleId,
            status: { in: [TicketStatus.PENDING_PAYMENT, TicketStatus.PENDING_APPROVAL, TicketStatus.CONFIRMED] },
          },
        },
        select: { seatNumber: true },
      });

      if (takenSeats.length > 0) {
        throw new BadRequestException(
          `Seat(s) already taken: ${takenSeats.map((s) => s.seatNumber).join(', ')}`,
        );
      }
    }

    // Calculate pricing
    const totalPrice = this.calculateTotalPrice(schedule.price, passengerCount);
    const coinCost = this.calculateCoinCost(passengerCount);

    // Determine admin ID and customer ID based on booking source
    let adminId: string | null = null;
    let customerId: string | null = null;

    if (createTicketDto.bookingSource === BookingSource.ADMIN_PANEL) {
      // Get admin from user
      const admin = await this.prisma.admin.findUnique({
        where: { userId },
      });

      if (!admin) {
        throw new BadRequestException('Admin profile not found');
      }

      adminId = admin.id;
      customerId = createTicketDto.customerId || null;

      // Validate coin balance for admin
      const hasBalance = await this.coinTransactionService.validateBalance(
        adminId,
        coinCost,
      );

      if (!hasBalance) {
        throw new BadRequestException(
          `Insufficient coin balance. Required: ${coinCost}, Current: ${(await this.coinTransactionService.getBalance(adminId)).coinBalance}`,
        );
      }
    } else {
      // Customer booking
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
      });

      if (!customer) {
        throw new BadRequestException('Customer profile not found');
      }

      customerId = customer.id;
    }

    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber();

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (prisma) => {
      // Create ticket
      const ticket = await prisma.ticket.create({
        data: {
          ticketNumber,
          scheduleId: createTicketDto.scheduleId,
          customerId,
          adminId,
          bookingSource: createTicketDto.bookingSource,
          bookerPhone: createTicketDto.bookerPhone,
          pickupAddress: createTicketDto.pickupAddress,
          dropoffAddress: createTicketDto.dropoffAddress,
          totalPassengers: passengerCount,
          totalPrice,
          notes: createTicketDto.notes,
          status: TicketStatus.CONFIRMED, // Admin bookings are auto-confirmed
        },
        include: {
          schedule: {
            include: {
              route: true,
              vehicle: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      // Create passengers
      const passengers = await Promise.all(
        createTicketDto.passengers.map((passenger) =>
          prisma.passenger.create({
            data: {
              ticketId: ticket.id,
              name: passenger.name,
              identityNumber: passenger.identityNumber,
              phone: passenger.phone,
              seatNumber: passenger.seatNumber,
            },
          }),
        ),
      );

      // Update schedule available seats
      await prisma.schedule.update({
        where: { id: createTicketDto.scheduleId },
        data: {
          availableSeats: {
            decrement: passengerCount,
          },
        },
      });

      // Deduct coins if admin booking
      if (adminId) {
        await this.coinTransactionService.deductCoins(
          adminId,
          coinCost,
          CoinTransactionReason.TICKET_BOOKING,
          {
            referenceId: ticket.id,
            referenceType: 'ticket',
            notes: `Ticket booking: ${passengerCount} passenger(s) - ${ticketNumber}`,
            createdBy: userId,
            prismaClient: prisma,
          },
        );
      }

      return {
        ...ticket,
        passengers,
      };
    });
  }

  async findAll(query: QueryTicketsDto, userId?: string, userRole?: UserRole) {
    const {
      page = 1,
      limit = 10,
      scheduleId,
      customerId,
      adminId,
      status,
      bookingSource,
      search,
      dateFrom,
      dateTo,
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Role-based filtering
    if (userId && userRole === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
      });
      if (customer) {
        where.customerId = customer.id;
      }
    } else if (userId && userRole === UserRole.ADMIN) {
      // Admin can see tickets they created
      const admin = await this.prisma.admin.findUnique({
        where: { userId },
      });
      if (admin) {
        where.adminId = admin.id;
      }
    }
    // Super admin can see all tickets (no filter added)

    if (scheduleId) {
      where.scheduleId = scheduleId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (status) {
      where.status = status;
    }

    if (bookingSource) {
      where.bookingSource = bookingSource;
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        {
          passengers: {
            some: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    if (dateFrom || dateTo) {
      where.bookingDate = {};
      if (dateFrom) {
        where.bookingDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.bookingDate.lte = new Date(dateTo);
      }
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          bookingDate: 'desc',
        },
        include: {
          schedule: {
            include: {
              route: {
                select: {
                  id: true,
                  routeCode: true,
                  origin: true,
                  destination: true,
                },
              },
              vehicle: {
                select: {
                  id: true,
                  vehicleNumber: true,
                  type: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          _count: {
            select: {
              passengers: true,
            },
          },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string, userRole?: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        schedule: {
          include: {
            route: true,
            vehicle: true,
            driver: {
              select: {
                id: true,
                name: true,
                phone: true,
                licenseNumber: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        passengers: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check access permissions
    if (userId && userRole === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
      });
      if (customer && ticket.customerId !== customer.id) {
        throw new ForbiddenException('You can only view your own tickets');
      }
    } else if (userId && userRole === UserRole.ADMIN) {
      const admin = await this.prisma.admin.findUnique({
        where: { userId },
      });
      if (admin && ticket.adminId !== admin.id) {
        throw new ForbiddenException('You can only view tickets you created');
      }
    }

    return ticket;
  }

  async confirm(id: string, userId: string, userRole: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        admin: true,
        customer: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status !== TicketStatus.PENDING_PAYMENT && ticket.status !== TicketStatus.PENDING_APPROVAL) {
      throw new BadRequestException(
        `Cannot confirm ticket with status: ${ticket.status}`,
      );
    }

    // Check permissions
    if (userRole === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
      });
      if (customer && ticket.customerId !== customer.id) {
        throw new ForbiddenException('You can only confirm your own tickets');
      }
    } else if (userRole === UserRole.ADMIN) {
      const admin = await this.prisma.admin.findUnique({
        where: { userId },
      });
      if (admin && ticket.adminId !== admin.id) {
        throw new ForbiddenException('You can only confirm tickets you created');
      }
    }
    // Super admin can confirm any ticket (no check needed)

    const confirmedTicket = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.CONFIRMED,
        paymentDate: new Date(),
      },
      include: {
        schedule: {
          include: {
            route: true,
            vehicle: true,
          },
        },
        passengers: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Notify customer of ticket confirmation
    if (confirmedTicket.customer && confirmedTicket.customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: confirmedTicket.customerId },
        select: { userId: true },
      });

      if (customer) {
        this.websocketGateway.broadcastTicketUpdate(customer.userId, {
          ticketId: confirmedTicket.id,
          ticketNumber: confirmedTicket.ticketNumber,
          status: TicketStatus.CONFIRMED,
          schedule: confirmedTicket.schedule,
          message: 'Your ticket has been confirmed',
        });
      }
    }

    return confirmedTicket;
  }

  async cancel(id: string, userId: string, userRole: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        schedule: true,
        admin: true,
        customer: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status === TicketStatus.CANCELLED || ticket.status === TicketStatus.REFUNDED) {
      throw new BadRequestException(
        `Ticket is already ${ticket.status.toLowerCase()}`,
      );
    }

    if (ticket.status === TicketStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed ticket');
    }

    // Check permissions
    if (userRole === UserRole.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { userId },
      });
      if (customer && ticket.customerId !== customer.id) {
        throw new ForbiddenException('You can only cancel your own tickets');
      }
    } else if (userRole === UserRole.ADMIN) {
      const admin = await this.prisma.admin.findUnique({
        where: { userId },
      });
      if (admin && ticket.adminId !== admin.id) {
        throw new ForbiddenException('You can only cancel tickets you created');
      }
    }
    // Super admin can cancel any ticket (no check needed)

    // Check if schedule hasn't departed yet
    if (ticket.schedule.status !== ScheduleStatus.SCHEDULED) {
      throw new BadRequestException(
        'Cannot cancel ticket for schedule that has departed or completed',
      );
    }

    const coinRefund = this.calculateCoinCost(ticket.totalPassengers);

    // Use transaction for atomicity
    return this.prisma.$transaction(async (prisma) => {
      // Update ticket status
      const cancelledTicket = await prisma.ticket.update({
        where: { id },
        data: {
          status: ticket.adminId ? TicketStatus.REFUNDED : TicketStatus.CANCELLED,
        },
        include: {
          schedule: {
            include: {
              route: true,
            },
          },
          passengers: true,
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      // Restore schedule available seats
      await prisma.schedule.update({
        where: { id: ticket.scheduleId },
        data: {
          availableSeats: {
            increment: ticket.totalPassengers,
          },
        },
      });

      // Refund coins if admin booking
      if (ticket.adminId) {
        await this.coinTransactionService.refundCoins(
          ticket.adminId,
          coinRefund,
          CoinTransactionReason.TICKET_CANCELLATION,
          {
            referenceId: ticket.id,
            referenceType: 'ticket',
            notes: `Ticket cancellation refund: ${ticket.totalPassengers} passenger(s) - ${ticket.ticketNumber}`,
            createdBy: userId,
          },
        );
      }

      return cancelledTicket;
    });
  }

  async remove(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Only allow deletion of cancelled tickets
    if (ticket.status !== TicketStatus.CANCELLED && ticket.status !== TicketStatus.REFUNDED) {
      throw new BadRequestException(
        'Can only delete cancelled or refunded tickets',
      );
    }

    await this.prisma.ticket.delete({
      where: { id },
    });

    return {
      message: 'Ticket deleted successfully',
    };
  }
}
