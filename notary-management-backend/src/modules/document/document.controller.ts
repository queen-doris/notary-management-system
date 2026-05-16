/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
// Side-effect import: loads @types/multer's global Express.Multer
// augmentation so `Express.Multer.File` resolves deterministically.
import 'multer';
import { DocumentService } from './document.service';
import {
  UploadDocumentDto,
  UpdateDocumentMetadataDto,
} from './dto/upload-documents.dto';
import { SearchDocumentDto } from './dto/search-document.dto';
import { BulkUploadItemDto } from './dto/bulk-upload.dto';
import {
  DocumentResponseDto,
  PaginatedDocumentsResponseDto,
  PendingUploadItemDto,
  UploadDocumentResponseDto,
  BulkUploadResponseDto,
} from './dto/document-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // ==================== Document Upload ====================

  @Post('upload')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a single document',
    description: 'Upload a document and attach it to a notary record.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Document file',
        },
        record_id: {
          type: 'string',
          format: 'uuid',
          description: 'Record ID to attach to',
        },
        category: {
          type: 'string',
          enum: [
            'id_card',
            'passport',
            'contract',
            'agreement',
            'land_title',
            'court_order',
            'affidavit',
            'certificate',
            'receipt',
            'other',
          ],
        },
        description: { type: 'string', description: 'Document description' },
        upi: { type: 'string', description: 'UPI for land documents' },
        is_primary: { type: 'boolean', description: 'Set as primary document' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Document uploaded successfully',
    type: UploadDocumentResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid file or request' })
  @ApiNotFoundResponse({ description: 'Record not found' })
  async uploadDocument(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ): Promise<UploadDocumentResponseDto> {
    return this.documentService.uploadDocument(
      user.id,
      user.businessId,
      user.role,
      user.businessRoles || [],
      file,
      dto,
    );
  }

  @Post('bulk-upload')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @UseInterceptors(FilesInterceptor('files', 20))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Bulk upload multiple documents',
    description: 'Upload multiple documents at once to different records.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Document files',
        },
        metadata: {
          type: 'string',
          description:
            'JSON string: an array with one entry per uploaded file (same order/length). Each entry: {"record_id":"<uuid>","description":"...","category":"certificate","upi":"optional"}. Example: [{"record_id":"605efe42-4a67-4250-80ad-825050e38c1a","description":"Diploma","category":"certificate"}]',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Documents uploaded successfully',
    type: BulkUploadResponseDto,
  })
  async bulkUploadDocuments(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('metadata') metadata: string,
  ): Promise<BulkUploadResponseDto> {
    // Validate and parse metadata
    if (!metadata) {
      throw new BadRequestException('Metadata is required');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required');
    }

    let metadataList: BulkUploadItemDto[];
    try {
      metadataList = JSON.parse(metadata) as BulkUploadItemDto[];
    } catch {
      throw new BadRequestException(
        'metadata must be a valid JSON array, e.g. [{"record_id":"<uuid>","description":"Diploma","category":"certificate"}] — one entry per file',
      );
    }

    // Validate that metadata array matches files array
    if (!Array.isArray(metadataList) || metadataList.length !== files.length) {
      throw new BadRequestException(
        `metadata must be a JSON array with exactly ${files.length} item(s) — one per uploaded file, in the same order`,
      );
    }

    return this.documentService.bulkUploadDocuments(
      user.id,
      user.businessId,
      user.role,
      user.businessRoles || [],
      files,
      metadataList,
    );
  }

  // ==================== Pending Uploads ====================

  @Get('pending')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Get pending uploads',
    description: 'Returns records that have no or few documents uploaded.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Days threshold for pending (default: 7)',
    type: 'number',
  })
  @ApiOkResponse({
    description: 'Pending uploads retrieved successfully',
    type: [PendingUploadItemDto],
  })
  async getPendingUploads(
    @CurrentUser() user: AuthenticatedUser,
    @Query('days') days?: number,
  ): Promise<PendingUploadItemDto[]> {
    return this.documentService.getPendingUploads(user.businessId);
  }

  // ==================== Document Retrieval ====================

  @Get('record/:recordId')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.RECEPTIONIST,
  )
  @ApiOperation({
    summary: 'Get documents by record ID',
    description: 'Retrieves all documents attached to a specific record.',
  })
  @ApiParam({
    name: 'recordId',
    description: 'Notary Record UUID',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Documents retrieved successfully',
    type: [DocumentResponseDto],
  })
  async getDocumentsByRecord(
    @CurrentUser() user: AuthenticatedUser,
    @Param('recordId', ParseUUIDPipe) recordId: string,
  ): Promise<DocumentResponseDto[]> {
    return this.documentService.getDocumentsByRecord(recordId, user.businessId);
  }

  @Get('search')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.RECEPTIONIST,
  )
  @ApiOperation({
    summary: 'Search documents',
    description:
      'Search documents by client name, ID number, record number, UPI, or file name.',
  })
  @ApiOkResponse({
    description: 'Documents retrieved successfully',
    type: PaginatedDocumentsResponseDto,
  })
  async searchDocuments(
    @CurrentUser() user: AuthenticatedUser,
    @Query() searchDto: SearchDocumentDto,
  ): Promise<PaginatedDocumentsResponseDto> {
    return this.documentService.searchDocuments(user.businessId, searchDto);
  }

  @Get(':id')
  @Roles(
    EBusinessRole.OWNER,
    EBusinessRole.SECRETARIAT,
    EBusinessRole.RECEPTIONIST,
  )
  @ApiOperation({
    summary: 'Get document by ID',
    description: 'Retrieves document metadata by ID.',
  })
  @ApiParam({ name: 'id', description: 'Document UUID', type: 'string' })
  @ApiOkResponse({
    description: 'Document retrieved successfully',
    type: DocumentResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Document not found' })
  async getDocumentById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DocumentResponseDto> {
    return this.documentService.getDocumentById(id, user.businessId);
  }

  // ==================== Document Management ====================

  @Put(':id')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Update document metadata',
    description:
      'Updates document category, description, UPI, or primary flag.',
  })
  @ApiParam({ name: 'id', description: 'Document UUID', type: 'string' })
  @ApiBody({ type: UpdateDocumentMetadataDto })
  @ApiOkResponse({
    description: 'Document updated successfully',
    type: DocumentResponseDto,
  })
  async updateDocumentMetadata(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentMetadataDto,
  ): Promise<DocumentResponseDto> {
    return this.documentService.updateDocumentMetadata(
      id,
      user.businessId,
      user.id,
      user.role,
      user.businessRoles || [],
      dto,
    );
  }

  @Delete(':id')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Deletes a document from the system and Cloudinary.',
  })
  @ApiParam({ name: 'id', description: 'Document UUID', type: 'string' })
  @ApiOkResponse({ description: 'Document deleted successfully' })
  @ApiNotFoundResponse({ description: 'Document not found' })
  async deleteDocument(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.documentService.deleteDocument(
      id,
      user.businessId,
      user.id,
      user.role,
      user.businessRoles || [],
    );
  }

  // ==================== Statistics ====================

  @Get('stats/summary')
  @Roles(EBusinessRole.OWNER, EBusinessRole.SECRETARIAT)
  @ApiOperation({
    summary: 'Get document statistics',
    description:
      'Returns document statistics including total count, storage usage, and pending uploads.',
  })
  @ApiOkResponse({ description: 'Statistics retrieved successfully' })
  async getDocumentStatistics(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<any> {
    return this.documentService.getDocumentStatistics(user.businessId);
  }
}
