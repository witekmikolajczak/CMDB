// apps/api/src/users/dto/bulk-create-users.dto.ts
import { IsOptional, IsString, IsEmail, IsNumber } from 'class-validator';

export class BulkCreateUsersDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsNumber()
  @IsOptional()
  roleId?: number;

  @IsNumber()
  @IsOptional()
  statusId?: number;

  @IsString()
  @IsOptional()
  departmentId?: string;
}
