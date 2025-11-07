import { Module, Global } from '@nestjs/common';
import { ImageProcessorService } from './image-processor.service';
import { UploadService } from './upload.service';

@Global()
@Module({
  providers: [ImageProcessorService, UploadService],
  exports: [ImageProcessorService, UploadService],
})
export class UploadModule {}
