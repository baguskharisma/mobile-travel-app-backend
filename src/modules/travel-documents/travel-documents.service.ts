import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CoinTransactionService } from '../coin/services/coin-transaction.service';
import { CreateTravelDocumentDto, QueryTravelDocumentsDto } from './dto';
import {
  TravelDocumentStatus,
  ScheduleStatus,
  CoinTransactionReason,
  UserRole,
} from '@prisma/client';

@Injectable()
export class TravelDocumentsService {
  private readonly COIN_COST_PER_DOCUMENT = 10000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly coinTransactionService: CoinTransactionService,
  ) {}

  /**
   * Generate unique document number
   * Format: SJ-YYYYMMDD-XXXXX
   */
  private async generateDocumentNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');

    // Get count of documents created today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await this.prisma.travelDocument.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = String(count + 1).padStart(5, '0');
    return `SJ-${dateStr}-${sequence}`;
  }

  async create(createDto: CreateTravelDocumentDto, userId: string) {
    // Get admin from user
    const admin = await this.prisma.admin.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!admin) {
      throw new BadRequestException('Admin profile not found');
    }

    // Validate schedule exists
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: createDto.scheduleId },
      include: {
        route: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Validate schedule status (should be SCHEDULED or DEPARTED)
    if (
      schedule.status !== ScheduleStatus.SCHEDULED &&
      schedule.status !== ScheduleStatus.DEPARTED
    ) {
      throw new BadRequestException(
        `Cannot create travel document for schedule with status: ${schedule.status}`,
      );
    }

    // Validate vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: createDto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Validate departure date
    const departureDate = new Date(createDto.departureDate);
    if (isNaN(departureDate.getTime())) {
      throw new BadRequestException('Invalid departure date');
    }

    // Validate total passengers doesn't exceed vehicle capacity
    if (createDto.totalPassengers > vehicle.capacity) {
      throw new BadRequestException(
        `Total passengers (${createDto.totalPassengers}) exceeds vehicle capacity (${vehicle.capacity})`,
      );
    }

    // Generate document number
    const documentNumber = await this.generateDocumentNumber();

    // Create document as DRAFT (not issued yet)
    const document = await this.prisma.travelDocument.create({
      data: {
        documentNumber,
        scheduleId: createDto.scheduleId,
        vehicleId: createDto.vehicleId,
        adminId: admin.id,
        driverName: createDto.driverName,
        driverPhone: createDto.driverPhone,
        totalPassengers: createDto.totalPassengers,
        departureDate,
        notes: createDto.notes,
        status: TravelDocumentStatus.DRAFT,
      },
      include: {
        schedule: {
          include: {
            route: true,
            vehicle: true,
          },
        },
        vehicle: true,
        admin: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return document;
  }

  async findAll(query: QueryTravelDocumentsDto, userId?: string, userRole?: UserRole) {
    const {
      page = 1,
      limit = 10,
      scheduleId,
      vehicleId,
      adminId,
      status,
      search,
      dateFrom,
      dateTo,
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Role-based filtering
    if (userId && userRole === UserRole.ADMIN) {
      const admin = await this.prisma.admin.findUnique({
        where: { userId },
      });
      if (admin) {
        where.adminId = admin.id;
      }
    }
    // Super admin can see all documents

    if (scheduleId) {
      where.scheduleId = scheduleId;
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.documentNumber = { contains: search, mode: 'insensitive' };
    }

    if (dateFrom || dateTo) {
      where.departureDate = {};
      if (dateFrom) {
        where.departureDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.departureDate.lte = new Date(dateTo);
      }
    }

    const [documents, total] = await Promise.all([
      this.prisma.travelDocument.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
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
            },
          },
          vehicle: {
            select: {
              id: true,
              vehicleNumber: true,
              type: true,
              brand: true,
              model: true,
              capacity: true,
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
      }),
      this.prisma.travelDocument.count({ where }),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId?: string, userRole?: UserRole) {
    const document = await this.prisma.travelDocument.findUnique({
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
        vehicle: true,
        admin: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Travel document not found');
    }

    // Check access permissions
    if (userId && userRole === UserRole.ADMIN) {
      const admin = await this.prisma.admin.findUnique({
        where: { userId },
      });
      if (admin && document.adminId !== admin.id) {
        throw new ForbiddenException(
          'You can only view travel documents you created',
        );
      }
    }

    return document;
  }

  async issue(id: string, userId: string) {
    const document = await this.prisma.travelDocument.findUnique({
      where: { id },
      include: {
        admin: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Travel document not found');
    }

    if (document.status !== TravelDocumentStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot issue document with status: ${document.status}`,
      );
    }

    // Verify user is the admin who created it or super admin
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { admin: true },
    });

    if (!currentUser?.admin) {
      throw new BadRequestException('Admin profile not found');
    }

    if (
      currentUser.admin.id !== document.adminId &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You can only issue travel documents you created',
      );
    }

    // Validate coin balance
    const hasBalance = await this.coinTransactionService.validateBalance(
      document.adminId,
      this.COIN_COST_PER_DOCUMENT,
    );

    if (!hasBalance) {
      const balance = await this.coinTransactionService.getBalance(document.adminId);
      throw new BadRequestException(
        `Insufficient coin balance. Required: ${this.COIN_COST_PER_DOCUMENT}, Current: ${balance.coinBalance}`,
      );
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (prisma) => {
      // Update document status
      const issuedDocument = await prisma.travelDocument.update({
        where: { id },
        data: {
          status: TravelDocumentStatus.ISSUED,
          issuedAt: new Date(),
        },
        include: {
          schedule: {
            include: {
              route: true,
            },
          },
          vehicle: true,
          admin: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      // Deduct coins
      await this.coinTransactionService.deductCoins(
        document.adminId,
        this.COIN_COST_PER_DOCUMENT,
        CoinTransactionReason.TRAVEL_DOCUMENT,
        {
          referenceId: document.id,
          referenceType: 'travel_document',
          notes: `Travel document issued: ${document.documentNumber}`,
          createdBy: userId,
          prismaClient: prisma,
        },
      );

      return issuedDocument;
    });
  }

  async cancel(id: string, userId: string, userRole: UserRole) {
    const document = await this.prisma.travelDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Travel document not found');
    }

    if (document.status === TravelDocumentStatus.CANCELLED) {
      throw new BadRequestException('Document is already cancelled');
    }

    // Only DRAFT documents can be cancelled (no coin refund since not issued)
    if (document.status === TravelDocumentStatus.ISSUED) {
      throw new BadRequestException(
        'Cannot cancel issued document. Issued documents are final.',
      );
    }

    // Check permissions
    if (userRole === UserRole.ADMIN) {
      const admin = await this.prisma.admin.findUnique({
        where: { userId },
      });
      if (admin && document.adminId !== admin.id) {
        throw new ForbiddenException(
          'You can only cancel travel documents you created',
        );
      }
    }

    const cancelledDocument = await this.prisma.travelDocument.update({
      where: { id },
      data: {
        status: TravelDocumentStatus.CANCELLED,
      },
      include: {
        schedule: {
          include: {
            route: true,
          },
        },
        vehicle: true,
        admin: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return {
      message: 'Travel document cancelled successfully',
      data: cancelledDocument,
    };
  }

  async remove(id: string) {
    const document = await this.prisma.travelDocument.findUnique({
      where: { id },
    });

    if (!document) {
      throw new NotFoundException('Travel document not found');
    }

    // Only allow deletion of DRAFT or CANCELLED documents
    if (
      document.status !== TravelDocumentStatus.DRAFT &&
      document.status !== TravelDocumentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Can only delete draft or cancelled travel documents',
      );
    }

    await this.prisma.travelDocument.delete({
      where: { id },
    });

    return {
      message: 'Travel document deleted successfully',
    };
  }
}
