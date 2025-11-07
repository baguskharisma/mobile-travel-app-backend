import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdminDto, QueryAdminsDto, UpdateAdminDto, UpdateAdminStatusDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { UploadService } from '../../common/upload/upload.service';
import { UploadType } from '../../common/upload/upload.config';

@Injectable()
export class AdminsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(createAdminDto: CreateAdminDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createAdminDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Check if phone already exists for admins
    const existingPhone = await this.prisma.admin.findUnique({
      where: { phone: createAdminDto.phone },
    });

    if (existingPhone) {
      throw new ConflictException('Phone number already exists');
    }

    // Create admin with user in a transaction
    return this.prisma.$transaction(async (prisma) => {
      const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

      const user = await prisma.user.create({
        data: {
          phone: createAdminDto.phone,
          email: createAdminDto.email || null,
          password: hashedPassword,
          role: UserRole.ADMIN,
        },
      });

      const admin = await prisma.admin.create({
        data: {
          userId: user.id,
          name: createAdminDto.name,
          phone: createAdminDto.phone,
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

      return admin;
    });
  }

  async findAll(query: QueryAdminsDto) {
    const { page = 1, limit = 10, status, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      user: {
        deletedAt: null, // Filter out soft-deleted users
      },
    };

    if (status) {
      where.user = {
        ...where.user,
        status,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await this.prisma.admin.count({ where });

    // Get paginated admins
    const admins = await this.prisma.admin.findMany({
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
      data: admins,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        id,
        user: {
          deletedAt: null, // Filter out soft-deleted users
        },
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

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        id,
        user: {
          deletedAt: null,
        },
      },
      include: { user: true },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Prevent super admin profile from being updated
    if (admin.user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot update Super Admin profile');
    }

    // Check if phone number is already taken by another admin
    if (updateAdminDto.phone) {
      const existingAdmin = await this.prisma.admin.findUnique({
        where: { phone: updateAdminDto.phone },
      });

      if (existingAdmin && existingAdmin.id !== id) {
        throw new ConflictException('Phone number already exists');
      }
    }

    const updatedAdmin = await this.prisma.admin.update({
      where: { id },
      data: updateAdminDto,
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

    return updatedAdmin;
  }

  async updateStatus(id: string, updateStatusDto: UpdateAdminStatusDto) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        id,
        user: {
          deletedAt: null,
        },
      },
      include: { user: true },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Prevent super admin from being deactivated
    if (admin.user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot change Super Admin status');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: admin.userId },
      data: { status: updateStatusDto.status },
      include: {
        admin: {
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
        },
      },
    });

    return updatedUser.admin;
  }

  async remove(id: string) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        id,
        user: {
          deletedAt: null,
        },
      },
      include: { user: true },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Prevent super admin from being deleted
    if (admin.user.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot delete Super Admin');
    }

    // Soft delete user
    await this.prisma.user.update({
      where: { id: admin.userId },
      data: { deletedAt: new Date() },
    });

    return { message: 'Admin deleted successfully' };
  }

  async restore(id: string) {
    const admin = await this.prisma.admin.findFirst({
      where: {
        id,
        user: {
          deletedAt: { not: null },
        },
      },
      include: { user: true },
    });

    if (!admin) {
      throw new NotFoundException('Deleted admin not found');
    }

    // Restore user
    const restoredUser = await this.prisma.user.update({
      where: { id: admin.userId },
      data: { deletedAt: null },
      include: {
        admin: {
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
        },
      },
    });

    return restoredUser.admin;
  }

  async findByUserId(userId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            status: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin profile not found');
    }

    return admin;
  }

  async updateByUserId(userId: string, updateAdminDto: UpdateAdminDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { userId },
    });

    if (!admin) {
      throw new NotFoundException('Admin profile not found');
    }

    return this.update(admin.id, updateAdminDto);
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    const admin = await this.prisma.admin.findUnique({
      where: { userId },
    });

    if (!admin) {
      throw new NotFoundException('Admin profile not found');
    }

    return this.uploadImage(admin.id, file);
  }

  async deleteProfileImage(userId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { userId },
    });

    if (!admin) {
      throw new NotFoundException('Admin profile not found');
    }

    return this.deleteImage(admin.id);
  }

  async uploadImage(id: string, file: Express.Multer.File) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Delete old image if exists
    if (admin.profileImageUrl) {
      const oldPath = this.uploadService.getPathFromUrl(admin.profileImageUrl);
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

    // Update admin with new image URL
    const updated = await this.prisma.admin.update({
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
            role: true,
          },
        },
      },
    });

    return {
      message: 'Profile image uploaded successfully',
      imageUrl: processedImage.url,
      thumbnailUrl: processedImage.thumbnailUrl,
      admin: updated,
    };
  }

  async deleteImage(id: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (!admin.profileImageUrl) {
      throw new BadRequestException('Admin has no profile image');
    }

    // Delete image file
    const imagePath = this.uploadService.getPathFromUrl(admin.profileImageUrl);
    if (imagePath) {
      await this.uploadService.deleteFile(imagePath).catch(() => {});

      // Also delete thumbnail if exists
      const filename = this.uploadService.getFilenameFromUrl(admin.profileImageUrl);
      if (filename) {
        const thumbnailPath = imagePath.replace(filename, `thumb-${filename}`);
        await this.uploadService.deleteFile(thumbnailPath).catch(() => {});
      }
    }

    // Update admin
    const updated = await this.prisma.admin.update({
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
            role: true,
          },
        },
      },
    });

    return {
      message: 'Profile image deleted successfully',
      admin: updated,
    };
  }
}
