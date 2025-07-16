import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { DepartmentsService } from 'src/departments/departments.service';

export enum ReportType {
  WARRANTY = 'warranty',
  INVENTORY = 'inventory',
  USER_ASSIGNMENT = 'user_assignment',
  DEPARTMENT = 'department',
}
export const REPORTS_DIR = path.join(process.cwd(), '.reports');

@Injectable()
export class ReportsService {
  constructor(private readonly departmentsService: DepartmentsService) {}
  async generateReport(userId: string, type: ReportType) {
    const reportId = uuidv4();
    const userDir = path.join(REPORTS_DIR, userId);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

    const filename = `${type}_${new Date().toISOString().split('T')[0]}_${reportId}.xlsx`;
    const filePath = path.join(userDir, filename);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${type} Report`);

    if (type === ReportType.DEPARTMENT) {
      // Pobierz dane departamentów
      const departments = await this.departmentsService.findAll();

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Parent ID', key: 'parent_id', width: 30 },
        { header: 'User Count', key: 'user_count', width: 15 },
        { header: 'Asset Count', key: 'asset_count', width: 15 },
      ];

      departments.forEach((dept) => {
        worksheet.addRow(dept);
      });
    } else {
      // Pozostaw przykładową logikę dla innych typów
      worksheet.columns = [
        { header: 'Example Column', key: 'col1', width: 30 },
      ];
      worksheet.addRow({ col1: `Sample data for ${type}` });
    }

    await workbook.xlsx.writeFile(filePath);
    return { reportId, path: filePath };
  }

  getReportFile(userId: string, reportId: string) {
    const userDir = path.join(REPORTS_DIR, userId);
    const files = fs.readdirSync(userDir);
    const found = files.find((f) => f.includes(reportId));
    if (!found) throw new NotFoundException('Report not found');

    const fullPath = path.join(userDir, found);
    const buffer = fs.readFileSync(fullPath);

    return {
      filename: found,
      buffer,
    };
  }

  listUserReports(userId: string) {
    const userDir = path.join(REPORTS_DIR, userId);
    if (!fs.existsSync(userDir)) return [];

    return fs.readdirSync(userDir).map((file) => ({
      file,
      downloadUrl: `/reports/download/${userId}/${file}`,
    }));
  }
}
