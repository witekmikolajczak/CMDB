// apps/web/src/pages/UsersPage.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/UsersPage.css';
import '../styles/BulkUpload.css';
import ProfilePictureUploader from '../components/ProfilePictureUploader';
import { useAuth } from '../contexts/AuthContext';

// Define interfaces
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: number;
  statusId: number;
  department: string;
  departmentId?: string;
  role?: string;
  status?: string;
  profilePicture?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface Role {
  id: number | string;
  name: string;
  description?: string;
}

interface Status {
  id: number | string;
  name: string;
  description?: string;
}

// Helper function to fetch profile image
const fetchProfileImage = async (userId: string): Promise<string | null> => {
  try {
    // Get authentication token
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.warn('No authentication token found when fetching profile picture');
      return null;
    }

    // Include token in the request
    const response = await fetch(`http://localhost:3001/users/profile-picture/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // If 404, return null (no profile picture)
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch profile picture: ${response.status}`);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    return null;
  }
};

const UsersPage: React.FC = () => {
  const { t } = useTranslation(); // t is used for translation but might not be explicitly referenced in JSX
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userImages, setUserImages] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true); // isLoading is used to control UI state
  const [error, setError] = useState<string | null>(null); // error is used for error handling
  
  // State for UI filtering and search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('All Roles');
  
  // New state for edit mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<{title: string, text: string, type: string} | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Function to fetch users data - extracted for reuse
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get the authentication token
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      // Add timestamp to prevent caching but avoid CORS issues with headers
      const response = await fetch(`http://localhost:3001/users?_t=${new Date().getTime()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
          // Removed cache-control headers to avoid CORS issues
        }
        // Removed cache option as it's not needed with the timestamp parameter
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
      
      // Apply any existing filters to the new data
      applyFilters(data);

      // Fetch profile pictures for all users
      const imagePromises = data.map((user: User) => 
        fetchProfileImage(user.id).then(url => ({ userId: user.id, url }))
      );
      
      const imageResults = await Promise.all(imagePromises);
      const imageMap = imageResults.reduce((acc, { userId, url }) => {
        acc[userId] = url;
        return acc;
      }, {} as Record<string, string | null>);
      
      setUserImages(imageMap);
      console.log('User data refreshed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to update a specific user in the users list
  const updateUserInList = async (updatedUserId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Fetch the updated user data
      const response = await fetch(`http://localhost:3001/users/${updatedUserId}?_t=${new Date().getTime()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch updated user: ${response.status}`);
      }

      const updatedUserData = await response.json();
      
      // Update the user in the list
      setUsers(prevUsers => {
        const newUsers = [...prevUsers];
        const index = newUsers.findIndex(user => user.id === updatedUserId);
        
        if (index !== -1) {
          newUsers[index] = updatedUserData;
        }
        
        return newUsers;
      });

      // Also update the filtered users
      setFilteredUsers(prevUsers => {
        const newUsers = [...prevUsers];
        const index = newUsers.findIndex(user => user.id === updatedUserId);
        
        if (index !== -1) {
          newUsers[index] = updatedUserData;
        }
        
        return newUsers;
      });

      // Also update the user image if needed
      fetchProfileImage(updatedUserId).then(url => {
        setUserImages(prev => ({
          ...prev,
          [updatedUserId]: url
        }));
      });

      console.log('User data updated successfully');
      
      // If this is the selected user, update it
      if (selectedUser && selectedUser.id === updatedUserId) {
        setSelectedUser(updatedUserData);
      }
      
      // If this is the edited user, update it
      if (editedUser && editedUser.id === updatedUserId) {
        setEditedUser(updatedUserData);
      }
      
      return updatedUserData;
    } catch (err) {
      console.error('Error updating user in list:', err);
      return null;
    }
  };
  
  // Track component visibility for refreshing data
  useEffect(() => {
    // Function to handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing users data');
        fetchUsers();
      }
    };

    // Add event listener for visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch users from the API on component mount
  useEffect(() => {
    fetchUsers();
    fetchUserRoles();
    fetchUserStatuses();
    fetchDepartments();
  }, []);
  
  // Listen for user profile updates in localStorage
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'auth_user' && event.newValue) {
        try {
          const userData = JSON.parse(event.newValue);
          // Update this user in our list
          updateUserInList(userData.id);
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fetch departments from the API
  const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        const response = await fetch('http://localhost:3001/departments', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch departments: ${response.status}`);
        }
        
        const data = await response.json();
        setDepartments(data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    
  // Fetch roles from the API
  const fetchUserRoles = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        const response = await fetch('http://localhost:3001/users/roles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch roles: ${response.status}`);
        }
        
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error('Error fetching roles:', error);
        // Set default roles if API fails
        setRoles([
          { id: 'admin', name: 'Admin' },
          { id: 'standard_user', name: 'Standard User' }
        ]);
      }
    };
    
  // Fetch statuses from the API
  const fetchUserStatuses = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        const response = await fetch('http://localhost:3001/users/statuses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch statuses: ${response.status}`);
        }
        
        const data = await response.json();
        setStatuses(data);
      } catch (error) {
        console.error('Error fetching statuses:', error);
        // Set default statuses if API fails
        setStatuses([
          { id: 'active', name: 'Active' },
          { id: 'inactive', name: 'Inactive' }
        ]);
      }
    };
    
  // Apply filters to the users list
  
  // This comment is left to maintain the code structure
  
  // Apply filters to users list
  const applyFilters = (usersList: User[]) => {
    let result = [...usersList];
    
    // Apply search term filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.department && user.department.toLowerCase().includes(search))
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'All Roles') {
      const role = roles.find(r => r.name === roleFilter);
      if (role) {
        result = result.filter(user => user.roleId === role.id);
      }
    }
    
    setFilteredUsers(result);
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle role filter change
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  // Effect to apply filters when users, searchTerm, or roleFilter changes
  useEffect(() => {
    if (users.length > 0) {
      applyFilters(users);
    }
  }, [users, searchTerm, roleFilter, roles]);
  
  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditedUser({...user});
    setIsEditMode(true);
    setIsAddMode(false);
  };

  // Handle input change in edit form
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editedUser) return;
    
    const { name, value } = e.target;
    setEditedUser({
      ...editedUser,
      [name]: value
    });
  };
  
  // Handle close modal
  const handleCloseModal = () => {
    setModalMessage(null);
    setSelectedUser(null);
    setEditedUser(null);
    setIsEditMode(false);
    setIsAddMode(false);
    setShowConfirmDelete(false);
  };
  
  // Save edited user
  const handleSaveUser = async () => {
    if (!editedUser) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setModalMessage({
          title: 'Error',
          text: 'Authentication token not found',
          type: 'error'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Get department ID from selected department name
      const selectedDept = departments.find(d => d.name === editedUser.department);
      
      // Prepare user data for update or create
      const { firstName, lastName, email } = editedUser;
      
      // Ensure roleId is always a valid number (default to 2 for Standard User)
      const roleId = editedUser.roleId 
        ? (typeof editedUser.roleId === 'string' ? parseInt(editedUser.roleId) : editedUser.roleId) 
        : 2;
      
      // Ensure statusId is always a valid number (default to 1 for Active)
      const statusId = editedUser.statusId 
        ? (typeof editedUser.statusId === 'string' ? parseInt(editedUser.statusId) : editedUser.statusId) 
        : 1;
      
      const userData = {
        firstName,
        lastName,
        email,
        departmentId: selectedDept?.id || null,
        roleId: roleId,
        statusId: statusId
      };
      
      let response;
      let successMessage;
      
      if (isAddMode) {
        // Create new user
        response = await fetch('http://localhost:3001/users', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });
        successMessage = 'User created successfully';
      } else {
        // Update existing user
        response = await fetch(`http://localhost:3001/users/${editedUser.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ...userData, id: editedUser.id })
        });
        successMessage = 'User updated successfully';
      }
      
      if (!response.ok) {
        throw new Error(`Failed to ${isAddMode ? 'create' : 'update'} user: ${response.status}`);
      }
      
      const resultUser = await response.json();
      
      // Update users list
      if (isAddMode) {
        setUsers([...users, resultUser]);
        setFilteredUsers([...filteredUsers, resultUser]);
      } else {
        setUsers(users.map(u => u.id === resultUser.id ? {
          ...resultUser,
          department: departments.find(d => d.id === resultUser.departmentId)?.name || 'Unassigned',
          role: roles.find(r => r.id === resultUser.roleId)?.name || 'Standard User',
          status: statuses.find(s => s.id === resultUser.statusId)?.name || 'Active'
        } : u));
      }
      
      // Refetch the users to ensure everything is up to date
      fetchUsers();
      
      // Close modal and reset state
      setModalMessage({
        title: 'Success',
        text: successMessage,
        type: 'success'
      });
      setIsEditMode(false);
      setIsAddMode(false);
      setSelectedUser(null);
      setEditedUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
      setModalMessage({
        title: 'Error',
        text: error instanceof Error ? error.message : `Failed to ${isAddMode ? 'create' : 'update'} user`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setModalMessage({
          title: 'Error',
          text: 'Authentication token not found',
          type: 'error'
        });
        setIsSubmitting(false);
        return;
      }
      
      const response = await fetch(`http://localhost:3001/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`);
      }
      
      // Update users list
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setFilteredUsers(filteredUsers.filter(u => u.id !== selectedUser.id));
      
      // Close modal and reset state
      setModalMessage({
        title: 'Success',
        text: 'User deleted successfully',
        type: 'success'
      });
      setShowConfirmDelete(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setModalMessage({
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to delete user',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (userId: string, file: File) => {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: file
      });

      if (!response.ok) {
        throw new Error(`Failed to upload profile picture: ${response.status}`);
      }

      // Update the user's profile picture in the UI
      const updatedUser = await response.json();
      const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      // Update profile picture in the images map
      const profilePicture = await fetchProfileImage(updatedUser.id);
      if (profilePicture) {
        setUserImages(prev => ({
          ...prev,
          [updatedUser.id]: profilePicture
        }));
      }

      setModalMessage({
        title: 'Success',
        text: 'Profile picture uploaded successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setModalMessage({
        title: 'Error',
        text: 'Failed to upload profile picture',
        type: 'error'
      });
    }
  };

  // Handle profile picture deletion
  const handleDeleteProfilePicture = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}/profile-picture`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete profile picture: ${response.status}`);
      }

      // Update the user's profile picture in the UI
      const updatedUser = await response.json();
      const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      // Remove profile picture from the images map
      setUserImages(prev => {
        const newImages = { ...prev };
        delete newImages[updatedUser.id];
        return newImages;
      });

      setModalMessage({
        title: 'Success',
        text: 'Profile picture deleted successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      setModalMessage({
        title: 'Error',
        text: 'Failed to delete profile picture',
        type: 'error'
      });
    }
  };

  // Handle CSV template download
  const handleDownloadCsvTemplate = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setModalMessage({
          title: 'Error',
          text: 'Authentication token not found',
          type: 'error'
        });
        return;
      }

      // Fetch the CSV template
      const response = await fetch('http://localhost:3001/users/template/csv', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download CSV template: ${response.status}`);
      }

      // Get the CSV content
      const csvContent = await response.text();

      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setModalMessage({
        title: 'Success',
        text: 'CSV template downloaded successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error downloading CSV template:', error);
      setModalMessage({
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to download CSV template',
        type: 'error'
      });
    }
  };

  // Handle CSV file upload for bulk user creation
  const handleCsvFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setModalMessage({
          title: 'Error',
          text: 'Authentication token not found',
          type: 'error'
        });
        setIsSubmitting(false);
        return;
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload the CSV file
      const response = await fetch('http://localhost:3001/users/bulk/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload CSV: ${response.status}`);
      }

      // If the response is a CSV file (for credentials), download it
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/csv')) {
        const csvContent = await response.text();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'new_users_credentials.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Refresh the users list
        fetchUsers();

        setModalMessage({
          title: 'Success',
          text: 'Users imported successfully. A CSV file with credentials has been downloaded.',
          type: 'success'
        });
      } else {
        // Parse JSON response
        const result = await response.json();
        
        // Refresh the users list
        fetchUsers();

        setModalMessage({
          title: 'Success',
          text: `${result.message}`,
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Error uploading CSV file:', error);
      setModalMessage({
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to upload CSV file',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  return (
    <div className="users-page">
      <header className="page-header">
        <h1>User Management</h1>
        <div className="header-actions">
          {authUser?.role === 'admin' && (
            <>
              <button 
                className="primary-btn" 
                onClick={() => {
                  // Create empty user template for the form
                  const defaultRoleId = roles.length > 0 ? (() => {
                    const standardUserRole = roles.find(r => r.name === 'Standard User');
                    if (standardUserRole) {
                      return typeof standardUserRole.id === 'string' 
                        ? parseInt(standardUserRole.id) 
                        : standardUserRole.id;
                    }
                    return 2; // Default role ID if not found
                  })() : 2;
                  
                  const defaultStatusId = statuses.length > 0 ? (() => {
                    const activeStatus = statuses.find(s => s.name === 'Active');
                    if (activeStatus) {
                      return typeof activeStatus.id === 'string' 
                        ? parseInt(activeStatus.id) 
                        : activeStatus.id;
                    }
                    return 1; // Default status ID if not found
                  })() : 1;
                  
                  setSelectedUser({
                    id: '',
                    firstName: '',
                    lastName: '',
                    email: '',
                    roleId: defaultRoleId,
                    statusId: defaultStatusId,
                    department: '',
                    role: 'Standard User',
                    status: 'Active'
                  });
                  
                  setEditedUser({
                    id: '',
                    firstName: '',
                    lastName: '',
                    email: '',
                    roleId: defaultRoleId,
                    statusId: defaultStatusId,
                    department: '',
                    role: 'Standard User',
                    status: 'Active'
                  });
                  setIsEditMode(true);
                  setIsAddMode(true);
                }}
              >
                + Add New User
              </button>
              <div className="bulk-actions">
                <button 
                  className="secondary-btn" 
                  onClick={handleDownloadCsvTemplate}
                >
                  Download CSV Template
                </button>
                <label className="upload-btn">
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleCsvFileUpload} 
                    style={{ display: 'none' }}
                  />
                  Upload Users (CSV)
                </label>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="users-content">
        <div className="users-list">
          <div className="users-toolbar">
            {isLoading ? (
              <div className="loading-indicator">{t('common.loading')}</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <div className="search-filter">
                <input
                  type="text"
                  placeholder={t('users.searchPlaceholder')}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                <select 
                  value={roleFilter}
                  onChange={handleRoleFilterChange}
                  className="filter-select"
                >
                  <option value="All Roles">{t('users.allRoles')}</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <table className="users-table">
            <thead>
              <tr>
                <th>Profile Picture</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-avatar">
                      {userImages[user.id] ? (
                        <img 
                          src={userImages[user.id] || undefined} 
                          alt={`${user.firstName} ${user.lastName}`}
                          className="avatar-image"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = '/default-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="default-avatar">
                          {user.firstName.charAt(0).toUpperCase() +
                          user.lastName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.role || 'Standard User'}</td>
                  <td>{user.department || 'Unassigned'}</td>
                  <td>
                    <span className={`status-badge status-${user.status?.toLowerCase() || 'active'}`}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn"
                        onClick={() => handleEditUser(user)}
                        title="View User"
                      >
                        👁️
                      </button>
                      {authUser?.role === 'admin' && (
                        <>
                          <button 
                            className="action-btn warning-btn"
                            onClick={() => {
                              setEditedUser(user);
                              setIsEditMode(true);
                            }}
                            title="Edit User"
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-btn destructive-btn"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowConfirmDelete(true);
                            }}
                            title="Delete User"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedUser && (
              <div className="user-details-modal">
                <div className="modal-content">
                  <div className="modal-header">
                    <h2>{isEditMode ? (isAddMode ? t('users.addNewUser') : t('users.editUser')) : t('users.userDetails')}</h2>
                    <button 
                      className="close-btn" 
                      onClick={handleCloseModal}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="user-details">
                    <div className="user-details-header">
                      <div className="user-avatar large">
                        {userImages[selectedUser.id] ? (
                          <img 
                            src={userImages[selectedUser.id] || undefined} 
                            alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                            className="avatar-image"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = '/default-avatar.png';
                            }}
                          />
                        ) : (
                          <div className="default-avatar">
                            {selectedUser.firstName.charAt(0).toUpperCase() +
                            selectedUser.lastName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {isEditMode ? (
                      <form 
                        className="edit-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveUser();
                      }}
                    >
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          value={editedUser?.firstName || ''}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={editedUser?.lastName || ''}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          name="email"
                          value={editedUser?.email || ''}
                          onChange={handleEditInputChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Role</label>
                        <select
                          name="roleId"
                          value={editedUser?.roleId || ''}
                          onChange={handleEditInputChange}
                          required
                        >
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Department</label>
                        <select
                          name="department"
                          value={editedUser?.department || ''}
                          onChange={handleEditInputChange}
                          required
                        >
                          <option value="">Select Department</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.name}>
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Status</label>
                        <select
                          name="statusId"
                          value={editedUser?.statusId || ''}
                          onChange={handleEditInputChange}
                          required
                        >
                          {statuses.map(status => (
                            <option key={status.id} value={status.id}>
                              {status.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group profile-picture-group">
                        <ProfilePictureUploader
                          initials={selectedUser.firstName.charAt(0).toUpperCase() + selectedUser.lastName.charAt(0).toUpperCase()}
                          imageUrl={previewUrl || userImages[selectedUser.id] || ''}
                          onUpload={async (file) => {
                            setPreviewUrl(URL.createObjectURL(file));
                            await handleProfilePictureUpload(selectedUser.id, file);
                          }}
                          onDelete={async () => {
                            await handleDeleteProfilePicture(selectedUser.id);
                            setPreviewUrl(null);
                          }}
                          loading={isSubmitting}
                          editable={true}
                        />
                      </div>

                      <div className="form-actions">
                        <button 
                          type="button" 
                          className="secondary-btn"
                          onClick={handleCloseModal}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" 
                          className="primary-btn"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="user-info-details">
                      <div className="user-info-row">
                        <span className="label">First Name:</span>
                        <span className="value">{selectedUser.firstName}</span>
                      </div>
                      <div className="user-info-row">
                        <span className="label">Last Name:</span>
                        <span className="value">{selectedUser.lastName}</span>
                      </div>
                      <div className="user-info-row">
                        <span className="label">Email:</span>
                        <span className="value">{selectedUser.email}</span>
                      </div>
                      <div className="user-info-row">
                        <span className="label">Role:</span>
                        <span className="value">{selectedUser.role || 'Standard User'}</span>
                      </div>
                      <div className="user-info-row">
                        <span className="label">Department:</span>
                        <span className="value">{selectedUser.department || 'Unassigned'}</span>
                      </div>
                      <div className="user-info-row">
                        <span className="label">Status:</span>
                        <span className="value">{selectedUser.status || 'Active'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {showConfirmDelete && selectedUser && (
            <div className="confirm-delete-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>Confirm Delete</h2>
                  <button 
                    className="close-btn" 
                    onClick={() => setShowConfirmDelete(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete this user?</p>
                  <p className="user-name-to-delete">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div className="modal-footer">
                  <button 
                    className="secondary-btn"
                    onClick={() => setShowConfirmDelete(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="destructive-btn"
                    onClick={handleDeleteUser}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {modalMessage && (
            <div className="message-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h2>{modalMessage.title}</h2>
                  <button 
                    className="close-btn" 
                    onClick={handleCloseModal}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <p>{modalMessage.text}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersPage;