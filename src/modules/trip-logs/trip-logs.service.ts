import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTripLogDto, QueryTripLogsDto } from './dto';
import { ScheduleStatus } from '@prisma/client';

@Injectable()
export class TripLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateTripLogDto, driverId: string) {
    // Validate schedule exists
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: createDto.scheduleId },
      include: { route: true },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Validate driver is assigned to this schedule
    if (schedule.driverId !== driverId) {
      throw new BadRequestException('You are not assigned to this schedule');
    }

    // Create trip log
    const tripLog = await this.prisma.tripLog.create({
      data: {
        scheduleId: createDto.scheduleId,
        driverId,
        status: createDto.status,
        location: createDto.location,
        latitude: createDto.latitude,
        longitude: createDto.longitude,
        notes: createDto.notes,
      },
      include: {
        schedule: {
          include: {
            route: {
              select: {
                routeCode: true,
                origin: true,
                destination: true,
              },
            },
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    // Update schedule status based on trip status
    const statusMapping: Record<string, ScheduleStatus | null> = {
      ASSIGNED: null,
      READY: null,
      DEPARTED: ScheduleStatus.DEPARTED,
      IN_TRANSIT: ScheduleStatus.DEPARTED,
      REST_STOP: ScheduleStatus.DEPARTED,
      ARRIVED: ScheduleStatus.ARRIVED,
      COMPLETED: ScheduleStatus.ARRIVED,
      CANCELLED: ScheduleStatus.CANCELLED,
    };

    const newScheduleStatus = statusMapping[createDto.status];
    if (newScheduleStatus) {
      await this.prisma.schedule.update({
        where: { id: createDto.scheduleId },
        data: { status: newScheduleStatus },
      });
    }

    return tripLog;
  }

  async findAll(query: QueryTripLogsDto) {
    const { page = 1, limit = 10, scheduleId, driverId, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (scheduleId) {
      where.scheduleId = scheduleId;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (status) {
      where.status = status;
    }

    const [logs, total] = await Promise.all([
      this.prisma.tripLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          timestamp: 'desc',
        },
        include: {
          schedule: {
            include: {
              route: {
                select: {
                  routeCode: true,
                  origin: true,
                  destination: true,
                },
              },
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.tripLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySchedule(scheduleId: string) {
    const logs = await this.prisma.tripLog.findMany({
      where: { scheduleId },
      orderBy: {
        timestamp: 'asc',
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return {
      data: logs,
      total: logs.length,
    };
  }

  async generateTripReport(scheduleId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        tripLogs: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Calculate trip duration
    const departedLog = schedule.tripLogs.find((log) => log.status === 'DEPARTED');
    const arrivedLog = schedule.tripLogs.find((log) => log.status === 'ARRIVED');

    let duration: number | null = null;
    if (departedLog && arrivedLog) {
      duration = arrivedLog.timestamp.getTime() - departedLog.timestamp.getTime();
      duration = Math.floor(duration / (1000 * 60)); // Convert to minutes
    }

    return {
      schedule: {
        id: schedule.id,
        routeCode: schedule.route.routeCode,
        origin: schedule.route.origin,
        destination: schedule.route.destination,
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        status: schedule.status,
      },
      vehicle: {
        vehicleNumber: schedule.vehicle.vehicleNumber,
        type: schedule.vehicle.type,
      },
      driver: schedule.driver
        ? {
            name: schedule.driver.name,
            phone: schedule.driver.phone,
          }
        : null,
      tripLogs: schedule.tripLogs.map((log) => ({
        status: log.status,
        location: log.location,
        latitude: log.latitude,
        longitude: log.longitude,
        notes: log.notes,
        timestamp: log.timestamp,
      })),
      summary: {
        totalLogs: schedule.tripLogs.length,
        duration: duration ? `${duration} minutes` : 'N/A',
        departedAt: departedLog?.timestamp || null,
        arrivedAt: arrivedLog?.timestamp || null,
      },
    };
  }
}
