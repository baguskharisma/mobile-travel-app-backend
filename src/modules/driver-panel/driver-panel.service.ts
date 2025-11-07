import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TripLogsService } from '../trip-logs/trip-logs.service';
import { UpdateTripStatusDto } from './dto';
import { ScheduleStatus } from '@prisma/client';

@Injectable()
export class DriverPanelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tripLogsService: TripLogsService,
  ) {}

  async getProfile(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            schedules: true,
            tripLogs: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return driver;
  }

  async getAssignedTrips(userId: string, status?: ScheduleStatus) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const where: any = {
      driverId: driver.id,
    };

    if (status) {
      where.status = status;
    } else {
      // By default, show active trips (not arrived or cancelled)
      where.status = {
        in: [ScheduleStatus.SCHEDULED, ScheduleStatus.DEPARTED],
      };
    }

    const trips = await this.prisma.schedule.findMany({
      where,
      orderBy: {
        departureTime: 'asc',
      },
      include: {
        route: true,
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
        _count: {
          select: {
            tickets: true,
            tripLogs: true,
          },
        },
      },
    });

    return {
      data: trips,
      total: trips.length,
    };
  }

  async getTripDetail(userId: string, scheduleId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
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
        tickets: {
          where: {
            status: {
              in: ['CONFIRMED', 'COMPLETED'],
            },
          },
          select: {
            id: true,
            ticketNumber: true,
            totalPassengers: true,
            status: true,
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        tripLogs: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            tickets: true,
            tripLogs: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Verify driver is assigned to this schedule
    if (schedule.driverId !== driver.id) {
      throw new BadRequestException('You are not assigned to this schedule');
    }

    return schedule;
  }

  async getPassengerList(userId: string, scheduleId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        route: {
          select: {
            routeCode: true,
            origin: true,
            destination: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Verify driver is assigned to this schedule
    if (schedule.driverId !== driver.id) {
      throw new BadRequestException('You are not assigned to this schedule');
    }

    // Get all confirmed tickets with passengers
    const tickets = await this.prisma.ticket.findMany({
      where: {
        scheduleId,
        status: {
          in: ['CONFIRMED', 'COMPLETED'],
        },
      },
      include: {
        passengers: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        bookingDate: 'asc',
      },
    });

    // Flatten passengers with ticket info
    const passengerList = tickets.flatMap((ticket) =>
      ticket.passengers.map((passenger) => ({
        passengerId: passenger.id,
        passengerName: passenger.name,
        identityNumber: passenger.identityNumber,
        phone: passenger.phone,
        seatNumber: passenger.seatNumber,
        ticketNumber: ticket.ticketNumber,
        customerName: ticket.customer?.name || 'Walk-in',
        customerPhone: ticket.customer?.phone || '-',
      })),
    );

    return {
      schedule: {
        id: schedule.id,
        routeCode: schedule.route.routeCode,
        origin: schedule.route.origin,
        destination: schedule.route.destination,
        departureTime: schedule.departureTime,
        status: schedule.status,
      },
      passengers: passengerList,
      summary: {
        totalTickets: tickets.length,
        totalPassengers: passengerList.length,
      },
    };
  }

  async updateTripStatus(
    userId: string,
    scheduleId: string,
    updateDto: UpdateTripStatusDto,
  ) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    const schedule = await this.prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Verify driver is assigned to this schedule
    if (schedule.driverId !== driver.id) {
      throw new BadRequestException('You are not assigned to this schedule');
    }

    // Create trip log (which also updates schedule status)
    const tripLog = await this.tripLogsService.create(
      {
        scheduleId,
        status: updateDto.status,
        location: updateDto.location,
        latitude: updateDto.latitude,
        longitude: updateDto.longitude,
        notes: updateDto.notes,
      },
      driver.id,
    );

    return {
      message: 'Trip status updated successfully',
      data: tripLog,
    };
  }
}
