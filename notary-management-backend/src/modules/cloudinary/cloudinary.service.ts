import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {

  async uploadFile(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'uploads',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<any> {
    return this.uploadFile(file);
  }

  async uploadVideo(file: Express.Multer.File): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'videos',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }

  async deleteFileByUrl(url: string): Promise<any> {
    const publicId = this.extractPublicIdFromUrl(url);
    return this.deleteFile(publicId);
  }

  private extractPublicIdFromUrl(url: string): string {
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    return matches ? matches[1] : '';
  }

  async getFileInfo(publicId: string): Promise<any> {
    return cloudinary.api.resource(publicId);
  }

  async generateSignedUrl(
    publicId: string,
    options: any = {},
  ): Promise<string> {
    return cloudinary.utils.private_download_url(
      publicId,
      options.format,
      options,
    );
  }
}
