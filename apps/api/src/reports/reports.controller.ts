import {
  Controller,
  Post,
  Param,
  Get,
  Query,
  Res,
  ParseEnumPipe,
} from '@nestjs/common';
import { REPORTS_DIR, ReportsService, ReportType } from './reports.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post(':userId/generate')
  async generate(
    @Param('userId') userId: string,
    @Query('type', new ParseEnumPipe(ReportType)) type: ReportType,
  ) {
    console.log('HERE: ', userId, type);

    const result = await this.reportsService.generateReport(userId, type);
    console.log('2. HERE: ', result);
    return {
      message: 'Report generated',
      reportId: result.reportId,
      path: result.path,
      downloadUrl: `/reports/download/${userId}/${result.reportId}`,
    };
  }

  @Get(':userId')
  listReports(@Param('userId') userId: string) {
    return this.reportsService.listUserReports(userId);
  }

  @Get('download/:userId/:reportFile')
  download(
    @Param('userId') userId: string,
    @Param('reportFile') reportFile: string,
    @Res() res: Response,
  ) {
    const filePath = path.join(REPORTS_DIR, userId, reportFile);
    console.log('DOWNLOAD: ', filePath);

    console.log('CWD:', process.cwd());
    console.log('Resolved path:', filePath);
    console.log('Exists:', fs.existsSync(filePath));

    if (!fs.existsSync(filePath)) {
      console.warn('404 FILE NOT FOUND:', filePath);
      return res.status(404).send('Report not found');
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${reportFile}"`,
    );
    res.sendFile(path.basename(filePath), { root: path.dirname(filePath) });
  }
}
