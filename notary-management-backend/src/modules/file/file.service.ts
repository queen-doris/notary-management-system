import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}

@Injectable()
export class FileService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadFile(file: Express.Multer.File): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const result = await this.cloudinaryService.uploadFile(file);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
      };
    } catch (error) {
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadResult> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    return this.uploadFile(file);
  }

  async uploadVideo(file: Express.Multer.File): Promise<UploadResult> {
    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException('File must be a video');
    }

    try {
      const result = await this.cloudinaryService.uploadVideo(file);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration,
      };
    } catch (error) {
      throw new BadRequestException(`Video upload failed: ${error.message}`);
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await this.cloudinaryService.deleteFile(publicId);
    } catch (error) {
      throw new BadRequestException(`File deletion failed: ${error.message}`);
    }
  }

  async deleteFileByUrl(url: string): Promise<void> {
    try {
      await this.cloudinaryService.deleteFileByUrl(url);
    } catch (error) {
      throw new BadRequestException(`File deletion failed: ${error.message}`);
    }
  }

  async getFileInfo(publicId: string): Promise<any> {
    try {
      return await this.cloudinaryService.getFileInfo(publicId);
    } catch (error) {
      throw new BadRequestException(
        `File info retrieval failed: ${error.message}`,
      );
    }
  }

  async generateSignedUrl(
    publicId: string,
    options: any = {},
  ): Promise<string> {
    try {
      return await this.cloudinaryService.generateSignedUrl(publicId, options);
    } catch (error) {
      throw new BadRequestException(
        `Signed URL generation failed: ${error.message}`,
      );
    }
  }
}
