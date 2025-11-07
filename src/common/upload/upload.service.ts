import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ImageProcessorService } from './image-processor.service';
import { UploadType, getFileUrl } from './upload.config';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  url: string;
  mimeType: string;
  size: number;
  uploadType: UploadType;
}

export interface ProcessedImage extends UploadedFile {
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private readonly imageProcessor: ImageProcessorService) {}

  /**
   * Process uploaded file
   */
  async processUploadedFile(
    file: Express.Multer.File,
    uploadType: UploadType,
    options?: {
      optimize?: boolean;
      generateThumbnail?: boolean;
      maxWidth?: number;
      maxHeight?: number;
    },
  ): Promise<ProcessedImage> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      const uploadedFile: ProcessedImage = {
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        url: getFileUrl(uploadType, file.filename),
        mimeType: file.mimetype,
        size: file.size,
        uploadType,
      };

      // Only process images (not PDFs)
      const isImage = file.mimetype.startsWith('image/');

      if (isImage && options?.optimize) {
        const optimizedPath = file.path.replace(
          file.filename,
          `optimized-${file.filename}`,
        );

        const result = await this.imageProcessor.optimizeImage(
          file.path,
          optimizedPath,
          options.maxWidth || 1920,
          options.maxHeight || 1080,
        );

        // Delete original and rename optimized
        await unlink(file.path);
        await this.renameFile(optimizedPath, file.path);

        uploadedFile.width = result.width;
        uploadedFile.height = result.height;
        uploadedFile.size = result.size;
      }

      // Generate thumbnail if requested
      if (isImage && options?.generateThumbnail) {
        const thumbnailFilename = `thumb-${file.filename}`;
        const thumbnailPath = file.path.replace(file.filename, thumbnailFilename);

        await this.imageProcessor.generateThumbnail(file.path, thumbnailPath);

        uploadedFile.thumbnailUrl = getFileUrl(uploadType, thumbnailFilename);
      }

      this.logger.log(
        `File processed successfully: ${uploadedFile.url} (${uploadType})`,
      );

      return uploadedFile;
    } catch (error) {
      this.logger.error(`Failed to process uploaded file: ${error.message}`);
      // Clean up file if processing failed
      if (file?.path && existsSync(file.path)) {
        await unlink(file.path).catch(() => {});
      }
      throw error;
    }
  }

  /**
   * Process multiple uploaded files
   */
  async processMultipleFiles(
    files: Express.Multer.File[],
    uploadType: UploadType,
    options?: {
      optimize?: boolean;
      generateThumbnail?: boolean;
    },
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];

    for (const file of files) {
      const processed = await this.processUploadedFile(file, uploadType, options);
      results.push(processed);
    }

    return results;
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (existsSync(filePath)) {
        await unlink(filePath);
        this.logger.log(`File deleted: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultipleFiles(filePaths: string[]): Promise<void> {
    const deletePromises = filePaths.map((path) => this.deleteFile(path));
    await Promise.allSettled(deletePromises);
  }

  /**
   * Rename file
   */
  private async renameFile(oldPath: string, newPath: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.rename(oldPath, newPath);
  }

  /**
   * Get file URL from filename
   */
  getFileUrl(uploadType: UploadType, filename: string): string {
    return getFileUrl(uploadType, filename);
  }

  /**
   * Extract filename from URL
   */
  getFilenameFromUrl(url: string): string | null {
    const match = url.match(/\/uploads\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  }

  /**
   * Get full path from URL
   */
  getPathFromUrl(url: string): string | null {
    const match = url.match(/\/uploads\/(.+)$/);
    if (!match) return null;

    return `./src/uploads/${match[1]}`;
  }
}
