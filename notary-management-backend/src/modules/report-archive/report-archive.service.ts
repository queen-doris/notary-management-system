import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportArchive } from '../../shared/entities/report-archive.entity';
import { ReportType } from '../../shared/enums/report-type.enum';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const ALLOWED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

@Injectable()
export class ReportArchiveService {
  constructor(
    @InjectRepository(ReportArchive)
    private repo: Repository<ReportArchive>,
    private cloudinary: CloudinaryService,
  ) {}

  async upload(
    businessId: string,
    userId: string,
    userName: string,
    file: Express.Multer.File,
    dto: {
      report_type: ReportType;
      period_start?: string;
      period_end?: string;
      notes?: string;
    },
  ): Promise<ReportArchive> {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only PDF or Excel (.xlsx/.xls) files are allowed',
      );
    }
    const result = await this.cloudinary.uploadFile(file);
    return this.repo.save(
      this.repo.create({
        report_type: dto.report_type,
        period_start: dto.period_start || null,
        period_end: dto.period_end || null,
        file_name: file.originalname,
        file_url: result.secure_url,
        public_id: result.public_id,
        mime_type: file.mimetype,
        file_size: file.size,
        notes: dto.notes,
        is_active: true,
        uploaded_by: userId,
        uploaded_by_name: userName,
        business_id: businessId,
      }),
    );
  }

  async list(
    businessId: string,
    filters: {
      report_type?: ReportType;
      start_date?: string;
      end_date?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const q = this.repo
      .createQueryBuilder('r')
      .where('r.business_id = :businessId', { businessId })
      .andWhere('r.is_active = true');
    if (filters.report_type)
      q.andWhere('r.report_type = :rt', { rt: filters.report_type });
    if (filters.start_date)
      q.andWhere('r.period_start >= :sd', { sd: filters.start_date });
    if (filters.end_date)
      q.andWhere('r.period_end <= :ed', { ed: filters.end_date });
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const [data, total] = await q
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('r.createdAt', 'DESC')
      .getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOne(businessId: string, id: string): Promise<ReportArchive> {
    const r = await this.repo.findOne({
      where: { id, business_id: businessId },
    });
    if (!r) throw new NotFoundException('Archived report not found');
    return r;
  }

  async remove(
    businessId: string,
    id: string,
  ): Promise<{ message: string }> {
    const r = await this.getOne(businessId, id);
    r.is_active = false;
    await this.repo.save(r);
    return { message: 'Archived report removed' };
  }
}
