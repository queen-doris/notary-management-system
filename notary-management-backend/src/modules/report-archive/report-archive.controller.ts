import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ReportArchiveService } from './report-archive.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { EBusinessRole } from '../../shared/enums/business-role.enum';
import { ReportType } from '../../shared/enums/report-type.enum';

@ApiTags('Report Archives')
@ApiBearerAuth('access-token')
@Controller('report-archives')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportArchiveController {
  constructor(private readonly service: ReportArchiveService) {}

  @Post('upload')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a past report (PDF or Excel)',
    description:
      'Archive a previously-produced Minijust / financial / daily-sales report so historical reports live alongside generated ones.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'report_type'],
      properties: {
        file: { type: 'string', format: 'binary' },
        report_type: {
          type: 'string',
          enum: Object.values(ReportType),
        },
        period_start: { type: 'string', example: '2026-01-01' },
        period_end: { type: 'string', example: '2026-03-31' },
        notes: { type: 'string' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Report archived' })
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    dto: {
      report_type: ReportType;
      period_start?: string;
      period_end?: string;
      notes?: string;
    },
  ) {
    return this.service.upload(
      user.businessId,
      user.id,
      user.fullNames || user.phone,
      file,
      dto,
    );
  }

  @Get()
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'List archived reports',
    description:
      'Returns archived reports with download URLs, filterable by type and period.',
  })
  @ApiQuery({ name: 'report_type', required: false, enum: ReportType })
  @ApiQuery({ name: 'start_date', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'end_date', required: false, example: '2026-12-31' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  @ApiOkResponse({ description: 'Archived reports' })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('report_type') reportType?: ReportType,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.list(user.businessId, {
      report_type: reportType,
      start_date: startDate,
      end_date: endDate,
      page,
      limit,
    });
  }

  @Get(':id')
  @Roles(EBusinessRole.OWNER, EBusinessRole.ACCOUNTANT)
  @ApiOperation({
    summary: 'Get an archived report (with download URL)',
  })
  @ApiParam({ name: 'id', description: 'Archive UUID' })
  @ApiOkResponse({ description: 'Archived report' })
  async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.getOne(user.businessId, id);
  }

  @Delete(':id')
  @Roles(EBusinessRole.OWNER)
  @ApiOperation({ summary: 'Remove an archived report (OWNER)' })
  @ApiParam({ name: 'id', description: 'Archive UUID' })
  @ApiOkResponse({ description: 'Removed' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.remove(user.businessId, id);
  }
}
