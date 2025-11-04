import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { TravelDocumentsService } from './travel-documents.service';
import { CreateTravelDocumentDto, QueryTravelDocumentsDto } from './dto';
import { Roles, CurrentUser } from '../../auth/decorators';
import type { CurrentUserType } from '../../auth/decorators';
import { UserRole } from '../../../generated/prisma';
import { TravelDocumentPdfGenerator } from './utils/pdf-generator';

@Controller('travel-documents')
export class TravelDocumentsController {
  constructor(private readonly travelDocumentsService: TravelDocumentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(
    @CurrentUser() user: CurrentUserType,
    @Body() createDto: CreateTravelDocumentDto,
  ) {
    return this.travelDocumentsService.create(createDto, user.id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query() query: QueryTravelDocumentsDto,
  ) {
    return this.travelDocumentsService.findAll(query, user.id, user.role);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.travelDocumentsService.findOne(id, user.id, user.role);
  }

  @Patch(':id/issue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  issue(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.travelDocumentsService.issue(id, user.id);
  }

  @Get(':id/print')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async print(
    @CurrentUser() user: CurrentUserType,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Get document with all relations
    const document = await this.travelDocumentsService.findOne(
      id,
      user.id,
      user.role,
    );

    // Generate PDF
    const pdfBuffer = await TravelDocumentPdfGenerator.generatePdf(document as any);

    // Set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="travel-document-${document.documentNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  cancel(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.travelDocumentsService.cancel(id, user.id, user.role);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.travelDocumentsService.remove(id);
  }
}
