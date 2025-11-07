import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

export enum UploadType {
  PROFILE = 'profiles',
  VEHICLE = 'vehicles',
  PAYMENT_PROOF = 'payment-proofs',
  DOCUMENT = 'documents',
}

export interface UploadConfig {
  maxSize: number; // in bytes
  allowedMimeTypes: string[];
  destination: string;
}

export const UPLOAD_CONFIGS: Record<UploadType, UploadConfig> = {
  [UploadType.PROFILE]: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    destination: './src/uploads/profiles',
  },
  [UploadType.VEHICLE]: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    destination: './src/uploads/vehicles',
  },
  [UploadType.PAYMENT_PROOF]: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
    destination: './src/uploads/payment-proofs',
  },
  [UploadType.DOCUMENT]: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
    destination: './src/uploads/documents',
  },
};

export const createMulterConfig = (uploadType: UploadType) => {
  const config = UPLOAD_CONFIGS[uploadType];

  return {
    storage: diskStorage({
      destination: config.destination,
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        const filename = `${uploadType}-${uniqueSuffix}${ext}`;
        callback(null, filename);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!config.allowedMimeTypes.includes(file.mimetype)) {
        return callback(
          new BadRequestException(
            `Invalid file type. Allowed types: ${config.allowedMimeTypes.join(', ')}`,
          ),
          false,
        );
      }
      callback(null, true);
    },
    limits: {
      fileSize: config.maxSize,
    },
  };
};

export const getFileUrl = (uploadType: UploadType, filename: string): string => {
  return `/uploads/${uploadType}/${filename}`;
};
