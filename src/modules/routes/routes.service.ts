import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRouteDto, UpdateRouteDto, QueryRoutesDto } from './dto';

@Injectable()
export class RoutesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRouteDto: CreateRouteDto) {
    // Check if route code already exists
    const existingRoute = await this.prisma.route.findUnique({
      where: { routeCode: createRouteDto.routeCode },
    });

    if (existingRoute) {
      throw new ConflictException('Route code already exists');
    }

    const route = await this.prisma.route.create({
      data: createRouteDto,
    });

    return route;
  }

  async findAll(query: QueryRoutesDto) {
    const { page = 1, limit = 10, origin, destination, isActive, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (origin) {
      where.origin = { contains: origin, mode: 'insensitive' };
    }

    if (destination) {
      where.destination = { contains: destination, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { routeCode: { contains: search, mode: 'insensitive' } },
        { origin: { contains: search, mode: 'insensitive' } },
        { destination: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [routes, total] = await Promise.all([
      this.prisma.route.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          _count: {
            select: {
              schedules: true,
            },
          },
        },
      }),
      this.prisma.route.count({ where }),
    ]);

    return {
      data: routes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        schedules: {
          take: 5,
          orderBy: {
            departureTime: 'desc',
          },
          select: {
            id: true,
            departureTime: true,
            arrivalTime: true,
            price: true,
            availableSeats: true,
            status: true,
          },
        },
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return route;
  }

  async update(id: string, updateRouteDto: UpdateRouteDto) {
    const route = await this.prisma.route.findUnique({
      where: { id },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    // Check if updating route code and if it conflicts
    if (updateRouteDto.routeCode && updateRouteDto.routeCode !== route.routeCode) {
      const existingRoute = await this.prisma.route.findUnique({
        where: { routeCode: updateRouteDto.routeCode },
      });

      if (existingRoute) {
        throw new ConflictException('Route code already exists');
      }
    }

    const updatedRoute = await this.prisma.route.update({
      where: { id },
      data: updateRouteDto,
    });

    return updatedRoute;
  }

  async remove(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    // Soft delete by marking as inactive
    const deletedRoute = await this.prisma.route.update({
      where: { id },
      data: { isActive: false },
    });

    return {
      message: 'Route deactivated successfully',
      data: deletedRoute,
    };
  }

  async restore(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const restoredRoute = await this.prisma.route.update({
      where: { id },
      data: { isActive: true },
    });

    return {
      message: 'Route activated successfully',
      data: restoredRoute,
    };
  }
}
