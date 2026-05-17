/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/require-await */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, DataSource } from 'typeorm';
import { Document } from '../../shared/entities/document.entity';
import { NotaryRecord } from '../../shared/entities/notary-record.entity';
import { SecretariatRecord } from '../../shared/entities/secretariat-record.entity';
import { User } from '../../shared/entities/user.entity';
import { BusinessUser } from '../../shared/entities/business-user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import {
  UploadDocumentDto,
  UpdateDocumentMetadataDto,
} from './dto/upload-documents.dto';
import { SearchDocumentDto } from './dto/search-document.dto';
import {
  DocumentResponseDto,
  PendingUploadItemDto,
  BulkUploadResponseDto,
  UploadDocumentResponseDto,
  PaginatedDocumentsResponseDto,
} from './dto/document-response.dto';
import {
  DocumentStatus,
  DocumentCategory,
} from '../../shared/enums/document-status.enum';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { EUserRole } from '../../shared/enums/user-role.enum';
import { CloudinaryUploadResult } from '../../shared/interfaces/cloudinary.interface';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(NotaryRecord)
    private notaryRecordRepository: Repository<NotaryRecord>,
    @InjectRepository(SecretariatRecord)
    private secretariatRecordRepository: Repository<SecretariatRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BusinessUser)
    private businessUserRepository: Repository<BusinessUser>,
    private cloudinaryService: CloudinaryService,
    private dataSource: DataSource,
  ) {}

  /**
   * Get user info for denormalization
   */
  private async getUserInfo(
    userId: string,
    businessId: string,
  ): Promise<{ name: string; role: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return { name: 'Unknown', role: 'unknown' };

    if (user.role === EUserRole.SUPERADMIN) {
      return { name: user.fullNames || user.phone, role: 'SUPERADMIN' };
    }

    const businessUser = await this.businessUserRepository.findOne({
      where: { userId: userId, businessId: businessId },
    });

    if (businessUser?.roles?.length) {
      return {
        name: user.fullNames || user.phone,
        role: businessUser.roles[0],
      };
    }

    return { name: user.fullNames || user.phone, role: 'STAFF' };
  }

  /**
   * Check if user has upload permission
   */
  private async checkUploadPermission(
    userId: string,
    businessId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
  ): Promise<void> {
    const isSuperAdmin = userRole === EUserRole.SUPERADMIN;
    const isOwner = userBusinessRoles.includes(EBusinessRole.OWNER);
    const isSecretariat = userBusinessRoles.includes(EBusinessRole.SECRETARIAT);

    if (!isSuperAdmin && !isOwner && !isSecretariat) {
      throw new ForbiddenException(
        'Only business owner and secretariat staff can upload documents',
      );
    }
  }

  /**
   * Upload a single document
   */
  async uploadDocument(
    userId: string,
    businessId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    file: Express.Multer.File,
    dto: UploadDocumentDto,
  ): Promise<UploadDocumentResponseDto> {
    await this.checkUploadPermission(
      userId,
      businessId,
      userRole,
      userBusinessRoles,
    );

    // A document attaches to EITHER a notary or a secretariat record.
    if (!dto.record_id === !dto.secretariat_record_id) {
      throw new BadRequestException(
        'Provide exactly one of record_id or secretariat_record_id',
      );
    }
    const isSecretariat = !!dto.secretariat_record_id;
    const notaryRec = isSecretariat
      ? null
      : await this.notaryRecordRepository.findOne({
          where: { id: dto.record_id, business_id: businessId },
        });
    const secRec = isSecretariat
      ? await this.secretariatRecordRepository.findOne({
          where: {
            id: dto.secretariat_record_id,
            business_id: businessId,
          },
        })
      : null;
    if (!notaryRec && !secRec) {
      throw new NotFoundException('Record not found');
    }
    // Normalised view used for denormalised document fields.
    const record = {
      id: notaryRec?.id ?? null,
      secId: secRec?.id ?? null,
      client_full_name:
        notaryRec?.client_full_name ?? secRec?.client_full_name ?? '',
      client_id_number:
        notaryRec?.client_id_number ?? secRec?.client_id_number ?? '',
      display_number: notaryRec?.display_number ?? null,
      book_type: notaryRec?.book_type ?? 'secretariat',
      upi: notaryRec?.upi ?? null,
    };

    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds limit of 10MB`);
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and PDF files are allowed',
      );
    }

    const userInfo = await this.getUserInfo(userId, businessId);

    // Upload to Cloudinary with proper typing
    let uploadResult: CloudinaryUploadResult;
    try {
      uploadResult = await this.cloudinaryService.uploadFile(file);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Cloudinary upload failed: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to upload file to cloud storage',
      );
    }

    // Check if this should be the primary document
    const isPrimary = dto.is_primary || false;
    if (isPrimary) {
      await this.documentRepository.update(
        record.secId
          ? { secretariat_record_id: record.secId, is_primary: true }
          : { record_id: record.id ?? undefined, is_primary: true },
        { is_primary: false },
      );
    }

    const document = this.documentRepository.create({
      record_id: record.id,
      secretariat_record_id: record.secId,
      file_name: file.originalname,
      file_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      file_size: file.size,
      mime_type: file.mimetype,
      category: dto.category || DocumentCategory.OTHER,
      description: dto.description,
      upi: dto.upi || record.upi || undefined,
      is_primary: isPrimary,
      status: DocumentStatus.UPLOADED,
      client_name: record.client_full_name,
      client_id_number: record.client_id_number,
      record_display_number: record.display_number ?? undefined,
      book_type: record.book_type,
      uploaded_by: userId,
      uploaded_by_name: userInfo.name,
      uploaded_by_role: userInfo.role,
    });

    // Persist the row + flag atomically. If the DB write fails, delete
    // the just-uploaded Cloudinary asset so it isn't orphaned.
    try {
      await this.dataSource.transaction(async (m) => {
        await m.save(document);
        if (record.secId) {
          await m.update(SecretariatRecord, record.secId, {
            has_documents: true,
          });
        } else if (record.id) {
          await m.update(NotaryRecord, record.id, { has_documents: true });
        }
      });
    } catch (err) {
      try {
        await this.cloudinaryService.deleteFile(uploadResult.public_id);
      } catch {
        this.logger.error(
          `Orphaned Cloudinary asset ${uploadResult.public_id} (DB save failed and cleanup failed)`,
        );
      }
      const e = err as Error;
      this.logger.error(`Document DB save failed: ${e.message}`);
      throw new InternalServerErrorException('Failed to save document');
    }

    return {
      message: 'Document uploaded successfully',
      document: this.formatDocumentResponse(document),
    };
  }

  /**
   * Bulk upload multiple documents
   */
  async bulkUploadDocuments(
    userId: string,
    businessId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    files: Express.Multer.File[],
    metadataList: {
      record_id: string;
      description: string;
      category?: string;
      upi?: string;
    }[],
  ): Promise<BulkUploadResponseDto> {
    await this.checkUploadPermission(
      userId,
      businessId,
      userRole,
      userBusinessRoles,
    );

    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length !== metadataList.length) {
      throw new BadRequestException(
        'Number of files must match number of metadata entries',
      );
    }

    const successful: DocumentResponseDto[] = [];
    const failed: Array<{ file: string; error: string }> = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const uploadDto = new UploadDocumentDto();
        uploadDto.record_id = metadataList[i].record_id;
        uploadDto.description = metadataList[i].description;
        uploadDto.category = metadataList[i].category as DocumentCategory;
        uploadDto.upi = metadataList[i].upi;

        const result = await this.uploadDocument(
          userId,
          businessId,
          userRole,
          userBusinessRoles,
          files[i],
          uploadDto,
        );
        successful.push(result.document);
      } catch (err) {
        const error = err as Error;
        failed.push({
          file: files[i].originalname,
          error: error.message,
        });
      }
    }

    return {
      message: `Uploaded ${successful.length} of ${files.length} documents`,
      successful,
      failed,
      total_success: successful.length,
      total_failed: failed.length,
    };
  }

  /**
   * Get pending uploads (records with no or few documents)
   */
  async getPendingUploads(businessId: string): Promise<PendingUploadItemDto[]> {
    const records = await this.notaryRecordRepository
      .createQueryBuilder('record')
      .leftJoin('record.attachments', 'doc')
      .where('record.business_id = :businessId', { businessId })
      .andWhere('record.status = :status', { status: 'active' })
      .groupBy('record.id')
      .having('COUNT(doc.id) = 0 OR MAX(doc.uploaded_at) IS NULL')
      .orderBy('record.served_date', 'DESC')
      .getMany();

    const pendingUploads: PendingUploadItemDto[] = [];

    for (const record of records) {
      const daysSinceServed = Math.floor(
        (new Date().getTime() - new Date(record.served_date).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      const docCount = await this.documentRepository.count({
        where: { record_id: record.id },
      });

      let urgency: 'high' | 'medium' | 'low' = 'low';
      if (daysSinceServed > 30 || docCount === 0) {
        urgency = 'high';
      } else if (daysSinceServed > 14) {
        urgency = 'medium';
      }

      pendingUploads.push({
        record_id: record.id,
        record_display_number: record.display_number || record.record_number,
        book_type: record.book_type,
        client_name: record.client_full_name,
        client_id_number: record.client_id_number,
        service_name: record.sub_service,
        served_date: record.served_date,
        days_since_served: daysSinceServed,
        document_count: docCount,
        urgency,
      });
    }

    return pendingUploads;
  }

  /**
   * Get documents by record ID
   */
  async getDocumentsByRecord(
    recordId: string,
    businessId: string,
  ): Promise<DocumentResponseDto[]> {
    const record = await this.notaryRecordRepository.findOne({
      where: { id: recordId, business_id: businessId },
    });
    if (!record) {
      throw new NotFoundException('Record not found');
    }

    const documents = await this.documentRepository.find({
      where: { record_id: recordId, status: Not(DocumentStatus.DELETED) },
      order: { is_primary: 'DESC', uploaded_at: 'DESC' },
    });

    return documents.map((doc) => this.formatDocumentResponse(doc));
  }

  /**
   * Get document by ID
   */
  async getDocumentById(
    documentId: string,
    businessId: string,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['record', 'secretariat_record'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const ownerBusinessId =
      document.record?.business_id ?? document.secretariat_record?.business_id;
    if (ownerBusinessId !== businessId) {
      throw new ForbiddenException('Access denied to this document');
    }

    return this.formatDocumentResponse(document);
  }

  /**
   * Update document metadata
   */
  async updateDocumentMetadata(
    documentId: string,
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
    dto: UpdateDocumentMetadataDto,
  ): Promise<DocumentResponseDto> {
    await this.checkUploadPermission(
      userId,
      businessId,
      userRole,
      userBusinessRoles,
    );

    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['record', 'secretariat_record'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const ownerBusinessId =
      document.record?.business_id ?? document.secretariat_record?.business_id;
    if (ownerBusinessId !== businessId) {
      throw new ForbiddenException('Access denied to this document');
    }

    // Update primary flag logic (scoped to the correct parent record)
    if (dto.is_primary) {
      await this.documentRepository.update(
        document.secretariat_record_id
          ? {
              secretariat_record_id: document.secretariat_record_id,
              is_primary: true,
            }
          : { record_id: document.record_id ?? undefined, is_primary: true },
        { is_primary: false },
      );
    }

    Object.assign(document, dto);
    await this.documentRepository.save(document);

    return this.formatDocumentResponse(document);
  }

  /**
   * Delete document
   */
  async deleteDocument(
    documentId: string,
    businessId: string,
    userId: string,
    userRole: string,
    userBusinessRoles: EBusinessRole[],
  ): Promise<{ message: string }> {
    await this.checkUploadPermission(
      userId,
      businessId,
      userRole,
      userBusinessRoles,
    );

    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['record', 'secretariat_record'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const ownerBusinessId =
      document.record?.business_id ?? document.secretariat_record?.business_id;
    if (ownerBusinessId !== businessId) {
      throw new ForbiddenException('Access denied to this document');
    }

    // Delete from Cloudinary
    try {
      await this.cloudinaryService.deleteFile(document.public_id);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Failed to delete from Cloudinary: ${error.message}`);
    }

    // Soft delete
    document.status = DocumentStatus.DELETED;
    await this.documentRepository.save(document);

    // Recompute has_documents from the live count on whichever parent.
    if (document.secretariat_record_id) {
      const remaining = await this.documentRepository.count({
        where: {
          secretariat_record_id: document.secretariat_record_id,
          status: DocumentStatus.UPLOADED,
        },
      });
      await this.secretariatRecordRepository.update(
        document.secretariat_record_id,
        { has_documents: remaining > 0 },
      );
    } else if (document.record_id) {
      const remaining = await this.documentRepository.count({
        where: {
          record_id: document.record_id,
          status: DocumentStatus.UPLOADED,
        },
      });
      await this.notaryRecordRepository.update(document.record_id, {
        has_documents: remaining > 0,
      });
    }

    return { message: 'Document deleted successfully' };
  }

  /**
   * Search documents
   */
  async searchDocuments(
    businessId: string,
    searchDto: SearchDocumentDto,
  ): Promise<PaginatedDocumentsResponseDto> {
    const query = this.documentRepository
      .createQueryBuilder('doc')
      .innerJoin('doc.record', 'record')
      .where('record.business_id = :businessId', { businessId })
      .andWhere('doc.status = :status', { status: DocumentStatus.UPLOADED });

    if (searchDto.client_name) {
      query.andWhere('doc.client_name ILIKE :clientName', {
        clientName: `%${searchDto.client_name}%`,
      });
    }

    if (searchDto.client_id_number) {
      query.andWhere('doc.client_id_number = :clientIdNumber', {
        clientIdNumber: searchDto.client_id_number,
      });
    }

    if (searchDto.record_number) {
      query.andWhere('doc.record_display_number ILIKE :recordNumber', {
        recordNumber: `%${searchDto.record_number}%`,
      });
    }

    if (searchDto.upi) {
      query.andWhere('doc.upi ILIKE :upi', { upi: `%${searchDto.upi}%` });
    }

    if (searchDto.file_name) {
      query.andWhere('doc.file_name ILIKE :fileName', {
        fileName: `%${searchDto.file_name}%`,
      });
    }

    if (searchDto.category) {
      query.andWhere('doc.category = :category', {
        category: searchDto.category,
      });
    }

    if (searchDto.record_id) {
      query.andWhere('doc.record_id = :recordId', {
        recordId: searchDto.record_id,
      });
    }

    if (searchDto.book_type) {
      query.andWhere('doc.book_type = :bookType', {
        bookType: searchDto.book_type,
      });
    }

    if (searchDto.start_date) {
      query.andWhere('record.served_date >= :startDate', {
        startDate: searchDto.start_date,
      });
    }

    if (searchDto.end_date) {
      query.andWhere('record.served_date <= :endDate', {
        endDate: searchDto.end_date,
      });
    }

    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy('doc.uploaded_at', 'DESC')
      .getManyAndCount();

    const formattedData: DocumentResponseDto[] = data.map((doc) =>
      this.formatDocumentResponse(doc),
    );

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get document statistics
   */
  /**
   * Get document statistics
   */
  async getDocumentStatistics(businessId: string): Promise<{
    total_documents: number;
    by_book_type: Array<{
      book_type: string;
      document_count: string;
      total_size: string;
    }>;
    pending_uploads: number;
    urgent_uploads: number;
    total_storage_mb: number;
  }> {
    // Define interface for raw query results (total_size can be null)
    interface StatsRawResult {
      book_type: string;
      document_count: string;
      total_size: string | null;
    }

    // Get raw results without type assertion
    const rawStats = await this.documentRepository
      .createQueryBuilder('doc')
      .innerJoin('doc.record', 'record')
      .select('doc.book_type', 'book_type')
      .addSelect('COUNT(*)', 'document_count')
      .addSelect('SUM(doc.file_size)', 'total_size')
      .where('record.business_id = :businessId', { businessId })
      .andWhere('doc.status = :status', { status: DocumentStatus.UPLOADED })
      .groupBy('doc.book_type')
      .getRawMany();

    // Transform to ensure total_size is never null (use 0 as fallback)
    const stats: Array<{
      book_type: string;
      document_count: string;
      total_size: string;
    }> = rawStats.map((stat: StatsRawResult) => ({
      book_type: stat.book_type,
      document_count: stat.document_count,
      total_size: stat.total_size || '0',
    }));

    const totalDocuments = await this.documentRepository.count({
      where: { status: DocumentStatus.UPLOADED },
    });

    const pendingRecords = await this.getPendingUploads(businessId);

    let totalStorageMb = 0;
    for (const stat of stats) {
      const totalSize = parseInt(stat.total_size, 10);
      if (!isNaN(totalSize)) {
        totalStorageMb += totalSize / 1024 / 1024;
      }
    }

    return {
      total_documents: totalDocuments,
      by_book_type: stats,
      pending_uploads: pendingRecords.length,
      urgent_uploads: pendingRecords.filter((p) => p.urgency === 'high').length,
      total_storage_mb: totalStorageMb,
    };
  }

  /**
   * Format document response
   */
  private formatDocumentResponse(document: Document): DocumentResponseDto {
    let previewUrl: string | undefined = undefined;

    if (document.mime_type === 'application/pdf') {
      previewUrl = document.file_url.replace(
        '/upload/',
        '/upload/fl_attachment/',
      );
    } else if (document.mime_type.startsWith('image/')) {
      previewUrl = document.file_url;
    }

    return {
      id: document.id,
      record_id: document.record_id ?? document.secretariat_record_id ?? '',
      record_display_number: document.record_display_number || '',
      client_name: document.client_name,
      client_id_number: document.client_id_number,
      file_name: document.file_name,
      file_url: document.file_url,
      file_size: document.file_size,
      file_size_mb: (document.file_size / 1024 / 1024).toFixed(2),
      mime_type: document.mime_type,
      public_id: document.public_id,
      category: document.category,
      description: document.description,
      upi: document.upi,
      is_primary: document.is_primary,
      status: document.status,
      uploaded_by_name: document.uploaded_by_name,
      uploaded_by_role: document.uploaded_by_role,
      uploaded_at: document.uploaded_at,
      download_url: document.file_url,
      preview_url: previewUrl,
    };
  }
}
