import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { createMulterConfig, UploadType } from '../upload.config';

/**
 * Custom file upload interceptor with validation
 */
export function createFileUploadInterceptor(
  uploadType: UploadType,
  fieldName: string = 'file',
) {
  return FileInterceptor(fieldName, createMulterConfig(uploadType));
}

/**
 * Custom multiple files upload interceptor
 */
export function createMultipleFileUploadInterceptor(
  uploadType: UploadType,
  fieldName: string = 'files',
  maxCount: number = 10,
) {
  return FilesInterceptor(fieldName, maxCount, createMulterConfig(uploadType));
}

/**
 * Interceptor to validate file exists
 */
@Injectable()
export class FileRequiredInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const file = request.file;

    if (!file) {
      throw new BadRequestException('File is required');
    }

    return next.handle();
  }
}
