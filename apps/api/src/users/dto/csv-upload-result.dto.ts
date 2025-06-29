// apps/api/src/users/dto/csv-upload-result.dto.ts

export class CsvUploadResultDto {
  success: boolean;
  message: string;
  createdUsers: CreatedUserDto[];
  failedUsers: FailedUserDto[];
  totalRows?: number;
  errors?: string[];
}

export class CreatedUserDto {
  id?: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export class FailedUserDto {
  firstName: string;
  lastName: string;
  email: string;
  reason: string;
}
