// apps/web/src/pages/UsersPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/UsersPage.css';
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
    const response = await fetch(`http://localhost:3001/users/profile-picture/${userId}`);
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
  const { user: authUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userImages, setUserImages] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('All Roles');
  
  // New state for edit mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalMessage, setModalMessage] = useState<{title: string, text: string, type: string} | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  // State for profile picture upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch users from the API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setError('Authentication token not found');
          setIsLoading(false);
          return;
        }
        
        const response = await fetch('http://localhost:3001/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);

        // Fetch profile pictures for all users
        const imagePromises = data.map(user => 
          fetchProfileImage(user.id).then(url => ({ userId: user.id, url }))
        );
        
        const imageResults = await Promise.all(imagePromises);
        const imageMap = imageResults.reduce((acc, { userId, url }) => {
          acc[userId] = url;
          return acc;
        }, {} as Record<string, string | null>);
        
        setUserImages(imageMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch departments from the API
  useEffect(() => {
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
    
    fetchDepartments();
  }, []);

  // Fetch roles from the API
  useEffect(() => {
    const fetchRoles = async () => {
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
    
    fetchRoles();
  }, []);

  // Fetch statuses from the API
  useEffect(() => {
    const fetchStatuses = async () => {
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
    
    fetchStatuses();
  }, []);

  // Update users list with profile pictures
  const updateUsersWithProfilePictures = async (updatedUser: User) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`http://localhost:3001/users/${updatedUser.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch updated user: ${response.status}`);
      }

      const userData = await response.json();
      const updatedUsers = users.map(u => u.id === userData.id ? userData : u);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      // Update profile picture if it exists
      const profilePicture = await fetchProfileImage(userData.id);
      if (profilePicture) {
        setUserImages(prev => ({
          ...prev,
          [userData.id]: profilePicture
        }));
      }
    } catch (error) {
      console.error('Error updating users list:', error);
    }
  };

  // Handle search and filtering
  useEffect(() => {
    let result = [...users];
    
    // Apply search term filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.department.toLowerCase().includes(search)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'All Roles') {
      const role = roles.find(r => r.name.toLowerCase() === roleFilter.toLowerCase());
      if (role) {
        result = result.filter(user => user.roleId === role.id);
      }
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle role filter change
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditedUser({...user});
    setIsEditMode(true);
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

  // Handle save edited user
  const handleSaveUser = async () => {
    if (!editedUser) return;
    
    try {
      setIsSubmitting(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setModalMessage({
          title: 'Error',
          text: 'Authentication token not found',
          type: 'error'
        });
        return;
      }
      
      // Get department ID from selected department name
      const selectedDept = departments.find(d => d.name === editedUser.department);
      const departmentId = selectedDept?.id || null;
      
      // Prepare user data for update
      const userData = {
        ...editedUser,
        departmentId: selectedDept?.id || null,
        department: undefined,
        roleId: editedUser.roleId ? parseInt(editedUser.roleId.toString()) : null,
        statusId: editedUser.statusId ? parseInt(editedUser.statusId.toString()) : null,
        role: undefined,
        status: undefined
      };
      
      const response = await fetch(`http://localhost:3001/users/${editedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.status}`);
      }
      
      const updatedUser = await response.json();
      
      // Update users list
      setUsers(users.map(u => u.id === updatedUser.id ? {
        ...updatedUser,
        department: departments.find(d => d.id === updatedUser.departmentId)?.name || 'Unassigned',
        role: roles.find(r => r.id === updatedUser.roleId)?.name || 'Standard User',
        status: statuses.find(s => s.id === updatedUser.statusId)?.name || 'Active'
      } : u));
      
      // Close modal and reset state
      setModalMessage({
        title: 'Success',
        text: 'User updated successfully',
        type: 'success'
      });
      setIsEditMode(false);
      setSelectedUser(null);
      setEditedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      setModalMessage({
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to update user',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setIsSubmitting(true);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setModalMessage({
          title: 'Error',
          text: 'Authentication token not found',
          type: 'error'
        });
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

  // Handle profile picture change
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setModalMessage({
        title: 'Error',
        text: 'Profile picture must be less than 5MB',
        type: 'error'
      });
      return;
    }
    
    // Check file type
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setModalMessage({
        title: 'Error',
        text: 'Only JPEG, PNG, and GIF images are allowed',
        type: 'error'
      });
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (userId: string, file: File) => {
    try {
      setUploadProgress(true);
      
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await fetch(`http://localhost:3001/users/${userId}/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
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
    } finally {
      setUploadProgress(false);
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

  // Close modal
  const handleCloseModal = () => {
    setModalMessage(null);
    setSelectedUser(null);
    setEditedUser(null);
    setIsEditMode(false);
    setShowConfirmDelete(false);
  };

  return (
    <div className="users-page">
      <header className="page-header">
        <h1>User Management</h1>
        <div className="header-actions">
          {authUser?.role === 'admin' && (
            <button 
              className="primary-btn" 
              onClick={() => {
                setSelectedUser(null);
                setEditedUser(null);
                setIsEditMode(true);
              }}
            >
              + Add New User
            </button>
          )}
        </div>
      </header>

      <div className="users-content">
        <div className="users-list">
          <div className="users-table-header">
            <h2>Current Users</h2>
            <div className="table-controls">
              <input 
                type="text" 
                placeholder="Search users..." 
                className="search-input" 
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <select 
                className="filter-select"
                value={roleFilter}
                onChange={handleRoleFilterChange}
              >
                <option value="All Roles">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
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
                          src={userImages[user.id]} 
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
                      >
                        View
                      </button>
                      {authUser?.role === 'admin' && (
                        <>
                          <button 
                            className="action-btn warning-btn"
                            onClick={() => {
                              setEditedUser(user);
                              setIsEditMode(true);
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="action-btn destructive-btn"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowConfirmDelete(true);
                            }}
                          >
                            Delete
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
                  <h2>{isEditMode ? 'Edit User' : 'User Details'}</h2>
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
                          src={userImages[selectedUser.id]} 
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
                        <div className="profile-picture-container">
                          {previewUrl ? (
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="preview-image"
                            />
                          ) : userImages[selectedUser.id] ? (
                            <img 
                              src={userImages[selectedUser.id]} 
                              alt="Current" 
                              className="current-image"
                            />
                          ) : (
                            <div className="default-avatar">
                              {selectedUser.firstName.charAt(0).toUpperCase() +
                              selectedUser.lastName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="profile-picture-buttons">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleProfilePictureChange}
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                          />
                          <button
                            type="button"
                            className="profile-picture-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadProgress}
                          >
                            {uploadProgress ? 'Uploading...' : 'Change Picture'}
                          </button>
                          {userImages[selectedUser.id] && (
                            <button
                              type="button"
                              className="profile-picture-delete-btn"
                              onClick={() => handleDeleteProfilePicture(selectedUser.id)}
                              disabled={uploadProgress}
                            >
                              Remove Picture
                            </button>
                          )}
                        </div>
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