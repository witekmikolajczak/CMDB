import { IsEmail, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  username?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsUUID()
  statusId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  managerId?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  positionTitle?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  employeeId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  building?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  roomNumber?: string;

  @IsOptional()
  @Type(() => Date)
  hireDate?: Date;
}
