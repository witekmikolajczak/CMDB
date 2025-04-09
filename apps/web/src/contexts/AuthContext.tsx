// apps/web/src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { authService, User, ProfileUpdateData } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  hasRole: (role: string) => boolean;
  updateUser: (updatedUser?: User | null) => void;
  updateUserProfile: (profileData: ProfileUpdateData) => Promise<User>;
  uploadProfilePicture: (file: File) => Promise<void>;
  deleteProfilePicture: () => Promise<void>;
  getProfilePictureUrl: () => string;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to update user state
  const updateUser = useCallback((updatedUser?: User | null) => {
    if (updatedUser === undefined) {
      // Check stored user and token
      const storedUser = authService.getUser();
      const token = authService.getToken();
      
      if (storedUser && token) {
        setUser(storedUser);
      } else {
        setUser(null);
      }
    } else {
      // Explicitly set user (can be null or a new user object)
      setUser(updatedUser);
    }
  }, []);

  // Load user from storage on initial mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = authService.getUser();
      
      if (storedUser && authService.getToken()) {
        try {
          // Verify token is still valid
          const isValid = await authService.validateToken();
          
          if (isValid) {
            setUser(storedUser);
          } else {
            // If token is invalid, clear the stored data
            authService.logout();
            setUser(null);
          }
        } catch (error) {
          console.error('Token validation error:', error);
          authService.logout();
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login({ username, password });
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Register function
  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await authService.register(userData);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData: ProfileUpdateData) => {
    setIsLoading(true);
    try {
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (file: File) => {
    setIsLoading(true);
    try {
      await authService.uploadProfilePicture(file);
      // Update the user object with the new profile picture URL
      if (user) {
        const profilePictureUrl = authService.getProfilePictureUrl();
        setUser({
          ...user,
          profilePictureUrl
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete profile picture
  const deleteProfilePicture = async () => {
    setIsLoading(true);
    try {
      await authService.deleteProfilePicture();
      // Remove the profile picture URL from the user object
      if (user) {
        const { profilePictureUrl, ...userWithoutPicture } = user;
        setUser(userWithoutPicture as User);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get profile picture URL
  const getProfilePictureUrl = () => {
    return authService.getProfilePictureUrl();
  };

  // Check if user has a specific role
  const hasRole = (role: string) => {
    return !!user && user.role === role;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    hasRole,
    updateUser,
    updateUserProfile,
    uploadProfilePicture,
    deleteProfilePicture,
    getProfilePictureUrl,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};