/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import {
  CloudinaryUploadResult,
  CloudinaryDeleteResult,
} from '../../shared/interfaces/cloudinary.interface';

@Injectable()
export class CloudinaryService {
  async uploadFile(file: Express.Multer.File): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'uploads',
        },
        (error, result) => {
          if (error) {
            reject(new Error(error.message));
            return;
          }
          if (!result) {
            reject(new Error('Upload failed: No result returned'));
            return;
          }
          // Map the result to CloudinaryUploadResult
          const uploadResult: CloudinaryUploadResult = {
            asset_id: result.asset_id || '',
            public_id: result.public_id || '',
            version: result.version || 0,
            version_id: result.version_id || '',
            signature: result.signature || '',
            width: result.width || 0,
            height: result.height || 0,
            format: result.format || '',
            resource_type: result.resource_type || '',
            created_at: result.created_at || '',
            tags: result.tags || [],
            bytes: result.bytes || 0,
            type: result.type || '',
            etag: result.etag || '',
            placeholder: result.placeholder || false,
            url: result.url || '',
            secure_url: result.secure_url || '',
            folder: result.folder || '',
            original_filename: result.original_filename || '',
            api_key: result.api_key || '',
          };
          resolve(uploadResult);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<CloudinaryUploadResult> {
    return this.uploadFile(file);
  }

  async uploadVideo(
    file: Express.Multer.File,
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'videos',
        },
        (error, result) => {
          if (error) {
            reject(new Error(error.message));
            return;
          }
          if (!result) {
            reject(new Error('Upload failed: No result returned'));
            return;
          }
          // Map the result to CloudinaryUploadResult
          const uploadResult: CloudinaryUploadResult = {
            asset_id: result.asset_id || '',
            public_id: result.public_id || '',
            version: result.version || 0,
            version_id: result.version_id || '',
            signature: result.signature || '',
            width: result.width || 0,
            height: result.height || 0,
            format: result.format || '',
            resource_type: result.resource_type || '',
            created_at: result.created_at || '',
            tags: result.tags || [],
            bytes: result.bytes || 0,
            type: result.type || '',
            etag: result.etag || '',
            placeholder: result.placeholder || false,
            url: result.url || '',
            secure_url: result.secure_url || '',
            folder: result.folder || '',
            original_filename: result.original_filename || '',
            api_key: result.api_key || '',
          };
          resolve(uploadResult);
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<CloudinaryDeleteResult> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(new Error(error.message));
          return;
        }
        const deleteResult: CloudinaryDeleteResult = {
          result: (result?.result as 'ok' | 'not_found') || 'not_found',
          message: result?.message,
        };
        resolve(deleteResult);
      });
    });
  }

  async deleteFileByUrl(url: string): Promise<CloudinaryDeleteResult> {
    const publicId = this.extractPublicIdFromUrl(url);
    return this.deleteFile(publicId);
  }

  private extractPublicIdFromUrl(url: string): string {
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    return matches ? matches[1] : '';
  }

  async getFileInfo(publicId: string): Promise<unknown> {
    return cloudinary.api.resource(publicId);
  }

  async generateSignedUrl(
    publicId: string,
    options: {
      format?: string;
      attachment?: boolean;
      expires_at?: number;
    } = {},
  ): Promise<string> {
    const format = options.format || 'pdf';
    return cloudinary.utils.private_download_url(publicId, format, {
      attachment: options.attachment,
      expires_at: options.expires_at,
    });
  }
}
