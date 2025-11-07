import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  UpdateVehicleStatusDto,
  QueryVehiclesDto,
} from './dto';
import { VehicleStatus } from '@prisma/client';
import { UploadService } from '../../common/upload/upload.service';
import { UploadType } from '../../common/upload/upload.config';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(createVehicleDto: CreateVehicleDto) {
    // Normalize vehicle number (remove spaces for uniqueness check)
    const normalizedVehicleNumber = createVehicleDto.vehicleNumber.replace(
      /\s+/g,
      '',
    );

    // Check if vehicle number already exists
    const existingVehicle = await this.prisma.vehicle.findFirst({
      where: {
        vehicleNumber: {
          equals: normalizedVehicleNumber,
          mode: 'insensitive',
        },
      },
    });

    if (existingVehicle) {
      throw new ConflictException('Vehicle number already exists');
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...createVehicleDto,
        vehicleNumber: normalizedVehicleNumber,
      },
    });

    return vehicle;
  }

  async findAll(query: QueryVehiclesDto) {
    const { page = 1, limit = 10, type, status, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { vehicleNumber: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
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
              travelDocuments: true,
            },
          },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      data: vehicles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAvailable() {
    const vehicles = await this.prisma.vehicle.findMany({
      where: {
        status: VehicleStatus.AVAILABLE,
      },
      orderBy: {
        vehicleNumber: 'asc',
      },
      include: {
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    return {
      data: vehicles,
      total: vehicles.length,
    };
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        schedules: {
          take: 10,
          orderBy: {
            departureTime: 'desc',
          },
          select: {
            id: true,
            departureTime: true,
            arrivalTime: true,
            status: true,
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
        _count: {
          select: {
            schedules: true,
            travelDocuments: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check if updating vehicle number and if it conflicts
    if (
      updateVehicleDto.vehicleNumber &&
      updateVehicleDto.vehicleNumber !== vehicle.vehicleNumber
    ) {
      const normalizedVehicleNumber = updateVehicleDto.vehicleNumber.replace(
        /\s+/g,
        '',
      );

      const existingVehicle = await this.prisma.vehicle.findFirst({
        where: {
          vehicleNumber: {
            equals: normalizedVehicleNumber,
            mode: 'insensitive',
          },
        },
      });

      if (existingVehicle) {
        throw new ConflictException('Vehicle number already exists');
      }

      updateVehicleDto.vehicleNumber = normalizedVehicleNumber;
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id },
      data: updateVehicleDto,
    });

    return updatedVehicle;
  }

  async updateStatus(id: string, updateStatusDto: UpdateVehicleStatusDto) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check if vehicle can change status
    if (
      vehicle.status === VehicleStatus.IN_USE &&
      updateStatusDto.status !== VehicleStatus.IN_USE
    ) {
      // Check if vehicle has active schedules
      const activeSchedules = await this.prisma.schedule.count({
        where: {
          vehicleId: id,
          status: {
            in: ['SCHEDULED', 'DEPARTED'],
          },
        },
      });

      if (activeSchedules > 0) {
        throw new BadRequestException(
          'Cannot change status: Vehicle has active schedules',
        );
      }
    }

    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id },
      data: { status: updateStatusDto.status },
    });

    return updatedVehicle;
  }

  async remove(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check if vehicle has any schedules
    if (vehicle._count.schedules > 0) {
      throw new BadRequestException(
        'Cannot delete vehicle: It has associated schedules. Set status to RETIRED instead.',
      );
    }

    await this.prisma.vehicle.delete({
      where: { id },
    });

    return {
      message: 'Vehicle deleted successfully',
    };
  }

  async uploadImage(id: string, file: Express.Multer.File) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Delete old image if exists
    if (vehicle.imageUrl) {
      const oldPath = this.uploadService.getPathFromUrl(vehicle.imageUrl);
      if (oldPath) {
        await this.uploadService.deleteFile(oldPath).catch(() => {});
      }
    }

    // Process uploaded image
    const processedImage = await this.uploadService.processUploadedFile(
      file,
      UploadType.VEHICLE,
      {
        optimize: true,
        generateThumbnail: true,
        maxWidth: 1920,
        maxHeight: 1080,
      },
    );

    // Update vehicle with new image URL
    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        imageUrl: processedImage.url,
      },
    });

    return {
      message: 'Vehicle image uploaded successfully',
      imageUrl: processedImage.url,
      thumbnailUrl: processedImage.thumbnailUrl,
      vehicle: updated,
    };
  }

  async deleteImage(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (!vehicle.imageUrl) {
      throw new BadRequestException('Vehicle has no image');
    }

    // Delete image file
    const imagePath = this.uploadService.getPathFromUrl(vehicle.imageUrl);
    if (imagePath) {
      await this.uploadService.deleteFile(imagePath).catch(() => {});

      // Also delete thumbnail if exists
      const filename = this.uploadService.getFilenameFromUrl(vehicle.imageUrl);
      if (filename) {
        const thumbnailPath = imagePath.replace(filename, `thumb-${filename}`);
        await this.uploadService.deleteFile(thumbnailPath).catch(() => {});
      }
    }

    // Update vehicle
    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: {
        imageUrl: null,
      },
    });

    return {
      message: 'Vehicle image deleted successfully',
      vehicle: updated,
    };
  }
}
