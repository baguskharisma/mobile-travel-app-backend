import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  AssignDriverDto,
  QuerySchedulesDto,
} from './dto';
import {
  ScheduleStatus,
  DriverStatus,
  VehicleStatus,
} from '@prisma/client';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate if driver is available for the given time period
   */
  private async validateDriverAvailability(
    driverId: string,
    departureTime: Date,
    arrivalTime: Date | null,
    excludeScheduleId?: string,
  ) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
      include: { user: true },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (driver.user.deletedAt) {
      throw new BadRequestException('Driver is not active');
    }

    // Check for overlapping schedules
    const endTime = arrivalTime || new Date(departureTime.getTime() + 8 * 60 * 60 * 1000); // Default 8 hours

    const whereClause: any = {
      driverId,
      status: {
        in: [ScheduleStatus.SCHEDULED, ScheduleStatus.DEPARTED],
      },
      OR: [
        {
          // New schedule starts during existing schedule
          AND: [
            { departureTime: { lte: departureTime } },
            {
              OR: [
                { arrivalTime: { gte: departureTime } },
                { arrivalTime: null },
              ],
            },
          ],
        },
        {
          // New schedule ends during existing schedule
          AND: [
            { departureTime: { lte: endTime } },
            {
              OR: [
                { arrivalTime: { gte: endTime } },
                { arrivalTime: null },
              ],
            },
          ],
        },
        {
          // New schedule contains existing schedule
          AND: [
            { departureTime: { gte: departureTime } },
            { departureTime: { lte: endTime } },
          ],
        },
      ],
    };

    if (excludeScheduleId) {
      whereClause.id = { not: excludeScheduleId };
    }

    const conflictingSchedules = await this.prisma.schedule.findMany({
      where: whereClause,
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

    if (conflictingSchedules.length > 0) {
      const conflict = conflictingSchedules[0];
      throw new ConflictException(
        `Driver is already assigned to another schedule (${conflict.route.routeCode}) from ${conflict.departureTime.toISOString()} to ${conflict.arrivalTime?.toISOString() || 'TBD'}`,
      );
    }

    return true;
  }

  /**
   * Validate if vehicle is available for the given time period
   */
  private async validateVehicleAvailability(
    vehicleId: string,
    departureTime: Date,
    arrivalTime: Date | null,
    excludeScheduleId?: string,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (vehicle.status === VehicleStatus.RETIRED) {
      throw new BadRequestException('Vehicle is retired and cannot be used');
    }

    // Check for overlapping schedules
    const endTime = arrivalTime || new Date(departureTime.getTime() + 8 * 60 * 60 * 1000);

    const whereClause: any = {
      vehicleId,
      status: {
        in: [ScheduleStatus.SCHEDULED, ScheduleStatus.DEPARTED],
      },
      OR: [
        {
          AND: [
            { departureTime: { lte: departureTime } },
            {
              OR: [
                { arrivalTime: { gte: departureTime } },
                { arrivalTime: null },
              ],
            },
          ],
        },
        {
          AND: [
            { departureTime: { lte: endTime } },
            {
              OR: [
                { arrivalTime: { gte: endTime } },
                { arrivalTime: null },
              ],
            },
          ],
        },
        {
          AND: [
            { departureTime: { gte: departureTime } },
            { departureTime: { lte: endTime } },
          ],
        },
      ],
    };

    if (excludeScheduleId) {
      whereClause.id = { not: excludeScheduleId };
    }

    const conflictingSchedules = await this.prisma.schedule.findMany({
      where: whereClause,
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

    if (conflictingSchedules.length > 0) {
      const conflict = conflictingSchedules[0];
      throw new ConflictException(
        `Vehicle is already scheduled for another trip (${conflict.route.routeCode}) from ${conflict.departureTime.toISOString()} to ${conflict.arrivalTime?.toISOString() || 'TBD'}`,
      );
    }

    return true;
  }

  async create(createScheduleDto: CreateScheduleDto) {
    // Validate route exists
    const route = await this.prisma.route.findUnique({
      where: { id: createScheduleDto.routeId },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    if (!route.isActive) {
      throw new BadRequestException('Route is not active');
    }

    // Validate vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: createScheduleDto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Ensure available seats don't exceed vehicle capacity
    if (createScheduleDto.availableSeats > vehicle.capacity) {
      throw new BadRequestException(
        `Available seats (${createScheduleDto.availableSeats}) cannot exceed vehicle capacity (${vehicle.capacity})`,
      );
    }

    const departureTime = new Date(createScheduleDto.departureTime);
    const arrivalTime = createScheduleDto.arrivalTime
      ? new Date(createScheduleDto.arrivalTime)
      : null;

    // Validate departure time is in the future
    if (departureTime < new Date()) {
      throw new BadRequestException('Departure time must be in the future');
    }

    // Validate arrival time is after departure time
    if (arrivalTime && arrivalTime <= departureTime) {
      throw new BadRequestException('Arrival time must be after departure time');
    }

    // Validate vehicle availability
    await this.validateVehicleAvailability(
      createScheduleDto.vehicleId,
      departureTime,
      arrivalTime,
    );

    // Validate driver availability if driver is assigned
    if (createScheduleDto.driverId) {
      await this.validateDriverAvailability(
        createScheduleDto.driverId,
        departureTime,
        arrivalTime,
      );
    }

    // Create schedule
    const schedule = await this.prisma.schedule.create({
      data: {
        routeId: createScheduleDto.routeId,
        vehicleId: createScheduleDto.vehicleId,
        driverId: createScheduleDto.driverId,
        departureTime,
        arrivalTime,
        price: createScheduleDto.price,
        availableSeats: createScheduleDto.availableSeats,
      },
      include: {
        route: true,
        vehicle: true,
        driver: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return schedule;
  }

  async findAll(query: QuerySchedulesDto) {
    const {
      page = 1,
      limit = 10,
      routeId,
      vehicleId,
      driverId,
      status,
      origin,
      destination,
      dateFrom,
      dateTo,
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (routeId) {
      where.routeId = routeId;
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (status) {
      where.status = status;
    }

    if (origin || destination) {
      where.route = {};
      if (origin) {
        where.route.origin = { contains: origin, mode: 'insensitive' };
      }
      if (destination) {
        where.route.destination = { contains: destination, mode: 'insensitive' };
      }
    }

    if (dateFrom || dateTo) {
      where.departureTime = {};
      if (dateFrom) {
        where.departureTime.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.departureTime.lte = new Date(dateTo);
      }
    }

    const [schedules, total] = await Promise.all([
      this.prisma.schedule.findMany({
        where,
        skip,
        take: limit,
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
              status: true,
            },
          },
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              licenseNumber: true,
              status: true,
            },
          },
          _count: {
            select: {
              tickets: true,
            },
          },
        },
      }),
      this.prisma.schedule.count({ where }),
    ]);

    return {
      data: schedules,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findUpcoming(limit: number = 20) {
    const now = new Date();

    const schedules = await this.prisma.schedule.findMany({
      where: {
        departureTime: { gte: now },
        status: ScheduleStatus.SCHEDULED,
        availableSeats: { gt: 0 },
      },
      take: limit,
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
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    return {
      data: schedules,
      total: schedules.length,
    };
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        route: true,
        vehicle: true,
        driver: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                status: true,
              },
            },
          },
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            totalPassengers: true,
            totalPrice: true,
            status: true,
            bookingDate: true,
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Prevent update if schedule has already departed or completed
    if (
      schedule.status === ScheduleStatus.DEPARTED ||
      schedule.status === ScheduleStatus.ARRIVED ||
      schedule.status === ScheduleStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot update schedule with status: ${schedule.status}`,
      );
    }

    // Validate route if being changed
    if (updateScheduleDto.routeId && updateScheduleDto.routeId !== schedule.routeId) {
      const route = await this.prisma.route.findUnique({
        where: { id: updateScheduleDto.routeId },
      });

      if (!route) {
        throw new NotFoundException('Route not found');
      }

      if (!route.isActive) {
        throw new BadRequestException('Route is not active');
      }
    }

    // Validate vehicle if being changed
    if (updateScheduleDto.vehicleId && updateScheduleDto.vehicleId !== schedule.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: updateScheduleDto.vehicleId },
      });

      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }

      // Check if available seats exceed new vehicle capacity
      const seatsToCheck = updateScheduleDto.availableSeats ?? schedule.availableSeats;
      if (seatsToCheck > vehicle.capacity) {
        throw new BadRequestException(
          `Available seats (${seatsToCheck}) cannot exceed vehicle capacity (${vehicle.capacity})`,
        );
      }
    }

    // Validate available seats don't exceed vehicle capacity
    if (updateScheduleDto.availableSeats !== undefined) {
      const vehicleToCheck = updateScheduleDto.vehicleId
        ? await this.prisma.vehicle.findUnique({ where: { id: updateScheduleDto.vehicleId } })
        : schedule.vehicle;

      if (updateScheduleDto.availableSeats > vehicleToCheck!.capacity) {
        throw new BadRequestException(
          `Available seats (${updateScheduleDto.availableSeats}) cannot exceed vehicle capacity (${vehicleToCheck!.capacity})`,
        );
      }
    }

    const departureTime = updateScheduleDto.departureTime
      ? new Date(updateScheduleDto.departureTime)
      : schedule.departureTime;
    const arrivalTime = updateScheduleDto.arrivalTime
      ? new Date(updateScheduleDto.arrivalTime)
      : schedule.arrivalTime;

    // Validate times
    if (arrivalTime && arrivalTime <= departureTime) {
      throw new BadRequestException('Arrival time must be after departure time');
    }

    // Validate vehicle availability if vehicle or time is being changed
    if (
      updateScheduleDto.vehicleId ||
      updateScheduleDto.departureTime ||
      updateScheduleDto.arrivalTime
    ) {
      const vehicleId = updateScheduleDto.vehicleId || schedule.vehicleId;
      await this.validateVehicleAvailability(vehicleId, departureTime, arrivalTime, id);
    }

    // Validate driver availability if driver or time is being changed
    if (
      updateScheduleDto.driverId ||
      updateScheduleDto.departureTime ||
      updateScheduleDto.arrivalTime
    ) {
      const driverId = updateScheduleDto.driverId || schedule.driverId;
      if (driverId) {
        await this.validateDriverAvailability(driverId, departureTime, arrivalTime, id);
      }
    }

    const updatedSchedule = await this.prisma.schedule.update({
      where: { id },
      data: {
        ...updateScheduleDto,
        departureTime: updateScheduleDto.departureTime
          ? new Date(updateScheduleDto.departureTime)
          : undefined,
        arrivalTime: updateScheduleDto.arrivalTime
          ? new Date(updateScheduleDto.arrivalTime)
          : undefined,
      },
      include: {
        route: true,
        vehicle: true,
        driver: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return updatedSchedule;
  }

  async assignDriver(id: string, assignDriverDto: AssignDriverDto) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Prevent assignment if schedule has already departed or completed
    if (
      schedule.status === ScheduleStatus.DEPARTED ||
      schedule.status === ScheduleStatus.ARRIVED ||
      schedule.status === ScheduleStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot assign driver to schedule with status: ${schedule.status}`,
      );
    }

    // Validate driver availability
    await this.validateDriverAvailability(
      assignDriverDto.driverId,
      schedule.departureTime,
      schedule.arrivalTime,
      id,
    );

    const updatedSchedule = await this.prisma.schedule.update({
      where: { id },
      data: { driverId: assignDriverDto.driverId },
      include: {
        route: true,
        vehicle: true,
        driver: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return updatedSchedule;
  }

  async cancel(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Prevent cancellation if schedule has already arrived or is cancelled
    if (
      schedule.status === ScheduleStatus.ARRIVED ||
      schedule.status === ScheduleStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel schedule with status: ${schedule.status}`,
      );
    }

    // Check if schedule has active tickets
    const activeTickets = await this.prisma.ticket.count({
      where: {
        scheduleId: id,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (activeTickets > 0) {
      throw new BadRequestException(
        `Cannot cancel schedule: It has ${activeTickets} active ticket(s). Please cancel or refund tickets first.`,
      );
    }

    const cancelledSchedule = await this.prisma.schedule.update({
      where: { id },
      data: { status: ScheduleStatus.CANCELLED },
      include: {
        route: true,
        vehicle: true,
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
      message: 'Schedule cancelled successfully',
      data: cancelledSchedule,
    };
  }

  async remove(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Prevent deletion if schedule has tickets
    if (schedule._count.tickets > 0) {
      throw new BadRequestException(
        'Cannot delete schedule: It has associated tickets. Cancel the schedule instead.',
      );
    }

    await this.prisma.schedule.delete({
      where: { id },
    });

    return {
      message: 'Schedule deleted successfully',
    };
  }
}
