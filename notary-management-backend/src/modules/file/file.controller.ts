import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { FileService } from './file.service';

@ApiTags('Files')
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a file',
    description:
      'Uploads a single file (multipart/form-data, field name "file") to Cloudinary and returns its URL/metadata.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'File uploaded; returns upload result' })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.fileService.uploadFile(file);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Upload an image',
    description:
      'Uploads a single image (multipart/form-data, field name "image"). Validates the MIME type is an image.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Image uploaded; returns upload result' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.fileService.uploadImage(file);
  }
}
