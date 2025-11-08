import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PaymentProofsService } from './payment-proofs.service';
import {
  CreatePaymentProofDto,
  ApprovePaymentProofDto,
  RejectPaymentProofDto,
} from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole, PaymentProofStatus } from '@prisma/client';

@Controller('payment-proofs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentProofsController {
  constructor(private readonly paymentProofsService: PaymentProofsService) {}

  /**
   * Customer uploads payment proof
   */
  @Post()
  @Roles(UserRole.CUSTOMER)
  @UseInterceptors(
    FileInterceptor('paymentProof', {
      storage: diskStorage({
        destination: './src/uploads/payment-proofs',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `payment-proof-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
          return callback(
            new BadRequestException(
              'Only image files (jpg, jpeg, png) and PDF are allowed',
            ),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async create(
    @Body() createDto: CreatePaymentProofDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('userId') userId: string,
  ) {
    // Debug logging
    console.log('========== PAYMENT PROOF BACKEND DEBUG ==========');
    console.log('File received:', file ? file.filename : 'NO FILE');
    console.log('CreateDto:', JSON.stringify(createDto, null, 2));
    console.log('Passengers type:', typeof createDto.passengers);
    console.log('Passengers value:', createDto.passengers);
    console.log('=================================================');

    if (!file) {
      throw new BadRequestException('Payment proof file is required');
    }

    const paymentProofUrl = `/uploads/payment-proofs/${file.filename}`;

    return this.paymentProofsService.create(
      createDto,
      paymentProofUrl,
      userId,
    );
  }

  /**
   * Get all payment proofs (admin only)
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async findAll(@Query('status') status?: PaymentProofStatus) {
    return this.paymentProofsService.findAll(status);
  }

  /**
   * Get customer's own payment proofs
   */
  @Get('my-proofs')
  @Roles(UserRole.CUSTOMER)
  async findMyProofs(@CurrentUser('userId') userId: string) {
    return this.paymentProofsService.findByCustomer(userId);
  }

  /**
   * Get payment proof by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.SUPER_ADMIN)
  async findOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.paymentProofsService.findOne(id, userId, userRole);
  }

  /**
   * Admin approves payment proof
   */
  @Patch(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async approve(
    @Param('id') id: string,
    @Body() approveDto: ApprovePaymentProofDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.paymentProofsService.approve(id, approveDto, userId);
  }

  /**
   * Admin rejects payment proof
   */
  @Patch(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async reject(
    @Param('id') id: string,
    @Body() rejectDto: RejectPaymentProofDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.paymentProofsService.reject(id, rejectDto, userId);
  }

  /**
   * Delete payment proof
   */
  @Delete(':id')
  @Roles(UserRole.CUSTOMER, UserRole.SUPER_ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.paymentProofsService.remove(id, userId, userRole);
  }
}
