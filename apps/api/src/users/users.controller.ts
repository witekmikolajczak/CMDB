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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { Response } from 'express';
import { Public, Roles } from '../auth/auth.guard';

@Controller('users')
@Roles('admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public() // Make this endpoint public for dashboard
  @Get('count')
  async getUsersCount() {
    return await this.usersService.getUsersCount();
  }

  @Public() // Make this endpoint public for dashboard
  @Get('countWeek')
  async getUsersCountThisWeek() {
    return await this.usersService.getUsersCountThisWeek();
  }

  @Get()
  async getAllUsers() {
    return await this.usersService.getAllUsers();
  }

  @Get('roles')
  async getUserRoles(@Request() req) {
    return await this.usersService.getUserRoles();
  }

  @Get('statuses')
  async getUserStatuses(@Request() req) {
    return await this.usersService.getUserStatuses();
  }

  @Put('profile')
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateUserProfileDto,
  ) {
    const userId = req.user.sub;
    const updatedUser = await this.usersService.updateUserProfile(
      userId,
      updateProfileDto,
    );
    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() userData: any,
    @Request() req,
  ) {
    return await this.usersService.updateUser(id, userData);
  }

  @Post('profile-picture')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new HttpException(
              'Invalid file type. Only JPEG, PNG, and GIF images are allowed',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadProfilePicture(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    const userId = req.user.sub;
    const result = await this.usersService.uploadProfilePicture(userId, file);
    res.status(HttpStatus.OK).json(result);
  }

  @Get('profile-picture')
  async getProfilePicture(@Request() req, @Res() res: Response) {
    const userId = req.user.sub;
    const profilePicture = await this.usersService.getProfilePicture(userId);

    if (!profilePicture) {
      return res.status(HttpStatus.NOT_FOUND).json({
        message: 'No profile picture found',
      });
    }

    res.set('Content-Type', profilePicture.contentType);
    res.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    );
    res.send(profilePicture.data);
  }

  @Get('profile-picture/:userId')
  async getUserProfilePicture(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    const profilePicture = await this.usersService.getProfilePicture(userId);

    if (!profilePicture) {
      return res.status(HttpStatus.NOT_FOUND).json({
        message: 'No profile picture found',
      });
    }

    res.set('Content-Type', profilePicture.contentType);
    res.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    );
    res.send(profilePicture.data);
  }

  @Delete('profile-picture')
  async deleteProfilePicture(@Request() req) {
    const userId = req.user.sub;
    return await this.usersService.deleteProfilePicture(userId);
  }

  @Post(':id/profile-picture')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
      },
      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new HttpException(
              'Invalid file type. Only JPEG, PNG, and GIF images are allowed',
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadUserPicture(
    @Param('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return await this.usersService.uploadProfilePicture(userId, file);
  }

  @Delete(':id/profile-picture')
  async deleteUserPicture(@Param('id') userId: string, @Request() req) {
    return await this.usersService.deleteProfilePicture(userId);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    if (req.user.sub === id) {
      throw new HttpException(
        'You cannot delete your own account',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.usersService.deleteUser(id);
  }
}
