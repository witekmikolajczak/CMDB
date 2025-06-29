// apps/api/src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Request,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  Res,
  ParseFilePipe,
  MaxFileSizeValidator,
  Header
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { CsvUploadResultDto } from './dto/csv-upload-result.dto';
import { Response } from 'express';
import { Public, Roles } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public() // Make this endpoint public for dashboard
  @Get('count')
  async getUsersCount() {
    try {
      return await this.usersService.getUsersCount();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Public() // Make this endpoint public for dashboard
  @Get('countWeek')
  async getUsersCountThisWeek() {
    try {
      return await this.usersService.getUsersCountThisWeek();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async getAllUsers(@Request() req) {
    try {
      // Role-based access control:
      // 1. Admin: Access all users
      // 2. Manager: Access only users in their department
      // 3. Standard User: Access only users in their department (read-only)
      
      if (req.user.role === 'admin') {
        // Admin can see all users
        return await this.usersService.getAllUsers();
      } else {
        // Managers and standard users can only see users in their department
        return await this.usersService.getUsersByDepartment(req.user.id);
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('roles')
  async getUserRoles(@Request() req) {
    try {
      return await this.usersService.getUserRoles();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('statuses')
  async getUserStatuses(@Request() req) {
    try {
      return await this.usersService.getUserStatuses();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateUserProfileDto) {
    try {
      const userId = req.user.sub;
      const updatedUser = await this.usersService.updateUserProfile(userId, updateProfileDto);
      return {
        message: 'Profile updated successfully',
        user: updatedUser
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() userData: any, @Request() req) {
    try {
      // Role-based access control:
      // 1. Admin: Can update any user
      // 2. Manager: Can update users in their department, but not change roles to admin
      // 3. Standard User: Cannot update other users
      
      if (req.user.role === 'admin') {
        // Admin can update any user
        return await this.usersService.updateUser(id, userData);
      } else if (req.user.role === 'manager') {
        // Manager can only update users in their department
        const departmentUsers = await this.usersService.getUsersByDepartment(req.user.id);
        const canEdit = departmentUsers.some(user => user.id === id);
        
        if (!canEdit) {
          throw new HttpException('You do not have permission to update this user', HttpStatus.FORBIDDEN);
        }
        
        // Managers cannot promote users to admin
        if (userData.role === 'admin') {
          throw new HttpException('You do not have permission to assign admin role', HttpStatus.FORBIDDEN);
        }
        
        return await this.usersService.updateUser(id, userData);
      } else {
        // Standard users cannot update other users
        throw new HttpException('You do not have permission to update users', HttpStatus.FORBIDDEN);
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('profile-picture')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB in bytes
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new HttpException(
              'Invalid file type. Only JPEG, PNG, and GIF images are allowed',
              HttpStatus.BAD_REQUEST
            ),
            false
          );
        }
        callback(null, true);
      }
    })
  )
  async uploadProfilePicture(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response
  ) {
    try {
      const userId = req.user.sub;
      const result = await this.usersService.uploadProfilePicture(userId, file);
      res.status(HttpStatus.OK).json(result);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('profile-picture')
  async getProfilePicture(@Request() req, @Res() res: Response) {
    try {
      const userId = req.user.sub;
      const profilePicture = await this.usersService.getProfilePicture(userId);
      
      if (!profilePicture) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'No profile picture found'
        });
      }
      
      res.set('Content-Type', profilePicture.contentType);
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET');
      res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.send(profilePicture.data);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('profile-picture/:userId')
  async getUserProfilePicture(@Param('userId') userId: string, @Res() res: Response) {
    try {
      const profilePicture = await this.usersService.getProfilePicture(userId);
      
      if (!profilePicture) {
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'No profile picture found'
        });
      }
      
      res.set('Content-Type', profilePicture.contentType);
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET');
      res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.send(profilePicture.data);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('profile-picture')
  async deleteProfilePicture(@Request() req) {
    try {
      const userId = req.user.sub;
      return await this.usersService.deleteProfilePicture(userId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/profile-picture')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB in bytes
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new HttpException(
              'Invalid file type. Only JPEG, PNG, and GIF images are allowed',
              HttpStatus.BAD_REQUEST
            ),
            false
          );
        }
        callback(null, true);
      }
    })
  )
  async uploadUserPicture(
    @Param('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    try {
      return await this.usersService.uploadProfilePicture(userId, file);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id/profile-picture')
  async deleteUserPicture(@Param('id') userId: string, @Request() req) {
    try {
      return await this.usersService.deleteProfilePicture(userId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    try {
      // Users cannot delete their own account
      if (req.user.sub === id) {
        throw new HttpException('You cannot delete your own account', HttpStatus.BAD_REQUEST);
      }
      
      // Role-based access control:
      // 1. Admin: Can delete any user
      // 2. Manager: Can delete users in their department (except other managers and admins)
      // 3. Standard User: Cannot delete users
      
      if (req.user.role === 'admin') {
        // Admin can delete any user
        return await this.usersService.deleteUser(id);
      } else if (req.user.role === 'manager') {
        // Manager can only delete standard users in their department
        const departmentUsers = await this.usersService.getUsersByDepartment(req.user.id);
        const userToDelete = departmentUsers.find(user => user.id === id);
        
        if (!userToDelete) {
          throw new HttpException('You do not have permission to delete this user', HttpStatus.FORBIDDEN);
        }
        
        // Managers cannot delete other managers or admins
        if (userToDelete.role === 'manager' || userToDelete.role === 'admin') {
          throw new HttpException('You do not have permission to delete managers or admins', HttpStatus.FORBIDDEN);
        }
        
        return await this.usersService.deleteUser(id);
      } else {
        // Standard users cannot delete users
        throw new HttpException('You do not have permission to delete users', HttpStatus.FORBIDDEN);
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto, @Request() req) {
    try {
      // Role-based access control:
      // 1. Admin: Can create any user with any role
      // 2. Manager: Can create standard users in their department
      // 3. Standard User: Cannot create users
      
      if (req.user.role === 'admin') {
        // Admin can create any user
        const newUser = await this.usersService.createUser(createUserDto);
        return newUser;
      } else if (req.user.role === 'manager') {
        // Manager can only create standard users
        if (createUserDto.role && createUserDto.role !== 'standard_user') {
          throw new HttpException('You can only create standard users', HttpStatus.FORBIDDEN);
        }
        
        // Force the role to be standard_user
        createUserDto.role = 'standard_user';
        
        // Get manager's departments
        const managerDepartments = await this.usersService.getUserDepartments(req.user.id);
        
        // If departmentId is specified, check if manager has access to it
        if (createUserDto.departmentId) {
          const hasAccess = managerDepartments.some(dept => dept.id === createUserDto.departmentId);
          if (!hasAccess) {
            throw new HttpException('You cannot add users to departments you do not manage', HttpStatus.FORBIDDEN);
          }
        }
        
        const newUser = await this.usersService.createUser(createUserDto);
        return newUser;
      } else {
        // Standard users cannot create users
        throw new HttpException('You do not have permission to create users', HttpStatus.FORBIDDEN);
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('template/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=user_template.csv')
  async downloadCsvTemplate(@Request() req, @Res() res: Response) {
    try {
      const csvTemplate = await this.usersService.generateCsvTemplate();
      res.send(csvTemplate);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('bulk/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max size
      }
    })
  )
  async bulkUploadUsers(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }) // 10MB validation
        ],
        fileIsRequired: true
      })
    )
    file: Express.Multer.File,
    @Res() res: Response
  ): Promise<CsvUploadResultDto> {
    try {
      // Role-based access control:
      // 1. Admin: Can bulk upload any users
      // 2. Manager: Can bulk upload standard users to their departments
      // 3. Standard User: Cannot bulk upload users
      
      if (req.user.role === 'admin') {
        // Admin can bulk upload any users
        const result = await this.usersService.processCsvBulkUpload(file);
        
        if (result.createdUsers.length > 0) {
          // Generate a CSV with usernames and passwords
          const csvData = await this.usersService.generatePasswordsCsv(result.createdUsers);
          
          // Set headers for CSV download
          res.set({
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=new_users_credentials.csv',
          });
          
          // Send the CSV data
          res.send(csvData);
          return result;
        } else {
          // If no users were created, just return the result as JSON
          res.status(HttpStatus.OK).json(result);
          return result;
        }
      } else if (req.user.role === 'manager') {
        // Manager can only bulk upload standard users to their departments
        const result = await this.usersService.processCsvBulkUploadForManager(file, req.user.id);
        
        if (result.createdUsers.length > 0) {
          // Generate a CSV with usernames and passwords
          const csvData = await this.usersService.generatePasswordsCsv(result.createdUsers);
          
          // Set headers for CSV download
          res.set({
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=new_users_credentials.csv',
          });
          
          // Send the CSV data
          res.send(csvData);
          return result;
        } else {
          // If no users were created, just return the result as JSON
          res.status(HttpStatus.OK).json(result);
          return result;
        }
      } else {
        // Standard users cannot bulk upload users
        throw new HttpException('You do not have permission to bulk upload users', HttpStatus.FORBIDDEN);
      }
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to process CSV upload',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}