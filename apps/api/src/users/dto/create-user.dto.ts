// apps/api/src/users/dto/create-user.dto.ts
export class CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  departmentId?: string;
  roleId?: number;
  statusId?: number;
  role?: string; // Added for role-based access control
}
