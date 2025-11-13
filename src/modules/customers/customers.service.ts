import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryCustomersDto, UpdateCustomerDto } from './dto';
import { UploadService } from '../../common/upload/upload.service';
import { UploadType } from '../../common/upload/upload.config';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async findAll(query: QueryCustomersDto) {
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
        { address: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await this.prisma.customer.count({ where });

    // Get paginated customers
    const customers = await this.prisma.customer.findMany({
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
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({
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
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            totalPrice: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        user: {
          deletedAt: null,
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if phone number is already taken by another customer
    if (updateCustomerDto.phone) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { phone: updateCustomerDto.phone },
      });

      if (existingCustomer && existingCustomer.id !== id) {
        throw new ConflictException('Phone number already exists');
      }
    }

    // Check if email is already taken by another user
    if (updateCustomerDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateCustomerDto.email },
      });

      if (existingUser && existingUser.id !== customer.userId) {
        throw new ConflictException('Email already exists');
      }
    }

    // Prepare update data for customer table
    const customerUpdateData: any = {};
    if (updateCustomerDto.name !== undefined) customerUpdateData.name = updateCustomerDto.name;
    if (updateCustomerDto.phone !== undefined) customerUpdateData.phone = updateCustomerDto.phone;
    if (updateCustomerDto.address !== undefined) customerUpdateData.address = updateCustomerDto.address;
    if (updateCustomerDto.gender !== undefined) customerUpdateData.gender = updateCustomerDto.gender;
    if (updateCustomerDto.birthDate !== undefined) {
      customerUpdateData.birthDate = updateCustomerDto.birthDate ? new Date(updateCustomerDto.birthDate) : null;
    }

    // Prepare update data for user table
    const userUpdateData: any = {};
    if (updateCustomerDto.email !== undefined) userUpdateData.email = updateCustomerDto.email;
    if (updateCustomerDto.birthDate !== undefined) {
      userUpdateData.birthDate = updateCustomerDto.birthDate ? new Date(updateCustomerDto.birthDate) : null;
    }
    if (updateCustomerDto.gender !== undefined) userUpdateData.gender = updateCustomerDto.gender;

    // Update both customer and user in a transaction
    const updatedCustomer = await this.prisma.$transaction(async (prisma) => {
      // Update user table if there are fields to update
      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: customer.userId },
          data: userUpdateData,
        });
      }

      // Update customer table
      return prisma.customer.update({
        where: { id },
        data: customerUpdateData,
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
    });

    return updatedCustomer;
  }

  async findByUserId(userId: string) {
    const customer = await this.prisma.customer.findUnique({
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

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return customer;
  }

  async updateByUserId(userId: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return this.update(customer.id, updateCustomerDto);
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return this.uploadImage(customer.id, file);
  }

  async deleteProfileImage(userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return this.deleteImage(customer.id);
  }

  async uploadImage(id: string, file: Express.Multer.File) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Delete old image if exists
    if (customer.profileImageUrl) {
      const oldPath = this.uploadService.getPathFromUrl(customer.profileImageUrl);
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

    // Update customer with new image URL
    const updated = await this.prisma.customer.update({
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
      customer: updated,
    };
  }

  async deleteImage(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!customer.profileImageUrl) {
      throw new BadRequestException('Customer has no profile image');
    }

    // Delete image file
    const imagePath = this.uploadService.getPathFromUrl(customer.profileImageUrl);
    if (imagePath) {
      await this.uploadService.deleteFile(imagePath).catch(() => {});

      // Also delete thumbnail if exists
      const filename = this.uploadService.getFilenameFromUrl(customer.profileImageUrl);
      if (filename) {
        const thumbnailPath = imagePath.replace(filename, `thumb-${filename}`);
        await this.uploadService.deleteFile(thumbnailPath).catch(() => {});
      }
    }

    // Update customer
    const updated = await this.prisma.customer.update({
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
      customer: updated,
    };
  }
}
