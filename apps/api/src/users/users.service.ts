import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUsersCount(): Promise<{ count: number }> {
    const count = await this.prisma.user.count();
    return { count };
  }

  async getUsersCountThisWeek(): Promise<{ count: number }> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const count = await this.prisma.user.count({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    return { count };
  }

  async getAllUsers() {
    const users = await this.prisma.user.findMany();

    return users;
  }

  async updateUserProfile(userId: string, profileData: UpdateUserProfileDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  /**
   * Update a user by ID (admin only)
   */
  async updateUser(userId: string, userData: UpdateUserDto) {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!existingUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Execute update using Prisma
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: userData as any, // Type assertion needed for Prisma compatibility
        include: {
          department: {
            select: { name: true },
          },
        },
      });

      return {
        success: true,
        message: 'User updated successfully',
        user: {
          ...updatedUser,
          departmentName: updatedUser.department?.name || '',
          department: undefined,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to update user: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Upload a profile picture for a user
   * @param userId The ID of the user
   * @param file The uploaded file
   * @returns The updated user object
   */
  async uploadProfilePicture(userId: string, file: Express.Multer.File) {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Update user with profile picture using Prisma
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: file.buffer,
          profilePictureType: file.mimetype,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Profile picture uploaded successfully',
        user: {
          id: userId,
          profilePicture: file.originalname,
        },
      };
    } catch (error) {
      this.logger.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  /**
   * Delete a user's profile picture
   */
  async deleteProfilePicture(userId: string) {
    try {
      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Update user to remove profile picture using Prisma
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePicture: null,
          profilePictureType: null,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Profile picture deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error deleting profile picture:', error);
      throw error;
    }
  }

  /**
   * Get user profile picture
   */
  async getProfilePicture(
    userId: string,
  ): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      // Query user's profile picture using Prisma
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          profilePicture: true,
          profilePictureType: true,
        },
      });

      if (!user || !user.profilePicture) {
        return null; // No profile picture found
      }

      return {
        data: user.profilePicture as Buffer,
        contentType: user.profilePictureType || 'image/jpeg',
      };
    } catch (error) {
      this.logger.error(`Error getting profile picture: ${error}`, error);
      return null;
    }
  }

  /**
   * Get all available user roles
   */
  async getUserRoles() {
    try {
      // Using Prisma to fetch all roles
      const roles = await this.prisma.role.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return roles;
    } catch (error) {
      this.logger.error(`Failed to fetch user roles: ${error}`);
      throw error;
    }
  }

  /**
   * Get all available user statuses
   */
  async getUserStatuses() {
    try {
      // Using Prisma to fetch all user statuses
      const statuses = await this.prisma.userStatus.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return statuses;
    } catch (error) {
      this.logger.error(`Failed to fetch user statuses: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a user by ID (admin only)
   */
  async deleteUser(userId: string) {
    try {
      // Check if user exists before attempting to delete
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Delete user using Prisma
      await this.prisma.user.delete({
        where: { id: userId },
      });

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error deleting user:', error);
      throw error;
    }
  }
}
