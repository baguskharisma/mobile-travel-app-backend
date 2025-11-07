import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDriverDto, QueryDriversDto, UpdateDriverDto, UpdateDriverStatusDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { UploadService } from '../../common/upload/upload.service';
import { UploadType } from '../../common/upload/upload.config';

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(createDriverDto: CreateDriverDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createDriverDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if phone already exists for drivers
    const existingPhone = await this.prisma.driver.findUnique({
      where: { phone: createDriverDto.phone },
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // Create driver with user in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const hashedPassword = await bcrypt.hash(createDriverDto.password, 10);

      const user = await prisma.user.create({
        data: {
          phone: createDriverDto.phone,
          email: createDriverDto.email || null,
          password: hashedPassword,
          role: UserRole.DRIVER,
        },
      });

      const driver = await prisma.driver.create({
        data: {
          userId: user.id,
          name: createDriverDto.name,
          phone: createDriverDto.phone,
          licenseNumber: createDriverDto.licenseNumber,
          address: createDriverDto.address,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      return driver;
    });
  }

  async findAll(query: QueryDriversDto) {
    const { page = 1, limit = 10, driverStatus, userStatus, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      user: {
        deletedAt: null, // Filter out soft-deleted users
      },
    };

    if (driverStatus) {
      where.status = driverStatus;
    }

    if (userStatus) {
      where.user = {
        ...where.user,
        status: userStatus,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await this.prisma.driver.count({ where });

    // Get paginated drivers
    const drivers = await this.prisma.driver.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      data: drivers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    const driver = await this.prisma.driver.findFirst({
      where: {
        id,
        user: {
          deletedAt: null,
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Check if phone number is already taken by another driver
    if (updateDriverDto.phone) {
      const existingDriver = await this.prisma.driver.findUnique({
        where: { phone: updateDriverDto.phone },
      });

      if (existingDriver && existingDriver.id !== id) {
        throw new ConflictException('Phone number already exists');
      }
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: updateDriverDto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return updatedDriver;
  }

  async updateStatus(id: string, updateStatusDto: UpdateDriverStatusDto) {
    const driver = await this.prisma.driver.findFirst({
      where: {
        id,
        user: {
          deletedAt: null,
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const updatedDriver = await this.prisma.driver.update({
      where: { id },
      data: { status: updateStatusDto.status },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return updatedDriver;
  }

  async findByUserId(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return driver;
  }

  async updateByUserId(userId: string, updateDriverDto: UpdateDriverDto) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return this.update(driver.id, updateDriverDto);
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return this.uploadImage(driver.id, file);
  }

  async deleteProfileImage(userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    return this.deleteImage(driver.id);
  }

  async uploadImage(id: string, file: Express.Multer.File) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Delete old image if exists
    if (driver.profileImageUrl) {
      const oldPath = this.uploadService.getPathFromUrl(driver.profileImageUrl);
      if (oldPath) {
        await this.uploadService.deleteFile(oldPath).catch(() => {});
      }
    }

    // Process uploaded image
    const processedImage = await this.uploadService.processUploadedFile(
      file,
      UploadType.PROFILE,
      {
        optimize: true,
        generateThumbnail: true,
        maxWidth: 800,
        maxHeight: 800,
      },
    );

    // Update driver with new image URL
    const updated = await this.prisma.driver.update({
      where: { id },
      data: {
        profileImageUrl: processedImage.url,
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            status: true,
          },
        },
      },
    });

    return {
      message: 'Profile image uploaded successfully',
      imageUrl: processedImage.url,
      thumbnailUrl: processedImage.thumbnailUrl,
      driver: updated,
    };
  }

  async deleteImage(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (!driver.profileImageUrl) {
      throw new BadRequestException('Driver has no profile image');
    }

    // Delete image file
    const imagePath = this.uploadService.getPathFromUrl(driver.profileImageUrl);
    if (imagePath) {
      await this.uploadService.deleteFile(imagePath).catch(() => {});

      // Also delete thumbnail if exists
      const filename = this.uploadService.getFilenameFromUrl(driver.profileImageUrl);
      if (filename) {
        const thumbnailPath = imagePath.replace(filename, `thumb-${filename}`);
        await this.uploadService.deleteFile(thumbnailPath).catch(() => {});
      }
    }

    // Update driver
    const updated = await this.prisma.driver.update({
      where: { id },
      data: {
        profileImageUrl: null,
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            status: true,
          },
        },
      },
    });

    return {
      message: 'Profile image deleted successfully',
      driver: updated,
    };
  }
}
