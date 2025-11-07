import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface ImageProcessOptions {
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  };
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp';
  thumbnail?: {
    width: number;
    height: number;
  };
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  /**
   * Process and optimize an image
   */
  async processImage(
    inputPath: string,
    outputPath: string,
    options?: ImageProcessOptions,
  ): Promise<void> {
    try {
      let image = sharp(inputPath);

      // Apply resize if specified
      if (options?.resize) {
        image = image.resize({
          width: options.resize.width,
          height: options.resize.height,
          fit: options.resize.fit || 'cover',
          withoutEnlargement: true,
        });
      }

      // Set quality and format
      const format = options?.format || 'jpeg';
      const quality = options?.quality || 80;

      switch (format) {
        case 'jpeg':
          image = image.jpeg({ quality, progressive: true });
          break;
        case 'png':
          image = image.png({ quality, compressionLevel: 9 });
          break;
        case 'webp':
          image = image.webp({ quality });
          break;
      }

      // Ensure output directory exists
      const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'));
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Save processed image
      await image.toFile(outputPath);

      this.logger.log(`Image processed successfully: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Failed to process image: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate thumbnail from image
   */
  async generateThumbnail(
    inputPath: string,
    outputPath: string,
    width: number = 150,
    height: number = 150,
  ): Promise<void> {
    try {
      await sharp(inputPath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 70 })
        .toFile(outputPath);

      this.logger.log(`Thumbnail generated: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Failed to generate thumbnail: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(imagePath: string): Promise<sharp.Metadata> {
    try {
      const metadata = await sharp(imagePath).metadata();
      return metadata;
    } catch (error) {
      this.logger.error(`Failed to get image metadata: ${error.message}`);
      throw error;
    }
  }

  /**
   * Optimize image (auto resize if too large + compress)
   */
  async optimizeImage(
    inputPath: string,
    outputPath: string,
    maxWidth: number = 1920,
    maxHeight: number = 1080,
    quality: number = 80,
  ): Promise<{ width: number; height: number; size: number }> {
    try {
      const metadata = await this.getImageMetadata(inputPath);

      let image = sharp(inputPath);

      // Resize if image is larger than max dimensions
      if (
        (metadata.width && metadata.width > maxWidth) ||
        (metadata.height && metadata.height > maxHeight)
      ) {
        image = image.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: false,
        });
      }

      // Compress
      image = image.jpeg({ quality, progressive: true });

      const info = await image.toFile(outputPath);

      this.logger.log(
        `Image optimized: ${outputPath} (${info.width}x${info.height}, ${(info.size / 1024).toFixed(2)}KB)`,
      );

      return {
        width: info.width,
        height: info.height,
        size: info.size,
      };
    } catch (error) {
      this.logger.error(`Failed to optimize image: ${error.message}`);
      throw error;
    }
  }

  /**
   * Convert image to WebP format
   */
  async convertToWebP(
    inputPath: string,
    outputPath: string,
    quality: number = 80,
  ): Promise<void> {
    try {
      await sharp(inputPath)
        .webp({ quality })
        .toFile(outputPath);

      this.logger.log(`Image converted to WebP: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Failed to convert to WebP: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create multiple sizes of an image
   */
  async createMultipleSizes(
    inputPath: string,
    baseOutputPath: string,
    sizes: { suffix: string; width: number; height?: number }[],
  ): Promise<string[]> {
    const outputPaths: string[] = [];

    try {
      for (const size of sizes) {
        const ext = baseOutputPath.substring(baseOutputPath.lastIndexOf('.'));
        const pathWithoutExt = baseOutputPath.substring(
          0,
          baseOutputPath.lastIndexOf('.'),
        );
        const outputPath = `${pathWithoutExt}-${size.suffix}${ext}`;

        await sharp(inputPath)
          .resize(size.width, size.height, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 80 })
          .toFile(outputPath);

        outputPaths.push(outputPath);
      }

      this.logger.log(`Created ${sizes.length} image sizes`);
      return outputPaths;
    } catch (error) {
      this.logger.error(`Failed to create multiple sizes: ${error.message}`);
      throw error;
    }
  }
}
