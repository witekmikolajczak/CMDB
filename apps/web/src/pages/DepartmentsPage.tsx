// apps/web/src/pages/DepartmentsPage.tsx
import React, { useState, useEffect } from 'react';
import '../styles/DepartmentsPage.css';
import { useAuth } from '../contexts/AuthContext';
import { getDepartments, createDepartment, getUsers, apiRequest, updateDepartment, deleteDepartment } from '../api/apiClient';

// Define the Department interface
interface Department {
  id: string | number;
  name: string;
  description: string;
  // Backend sends snake_case properties
  user_count?: number;
  asset_count?: number;
}

// Define the User interface
interface User {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  departmentId?: string | number | null;
}

// Define the DepartmentUser interface
interface DepartmentUser {
  user_id: string;
  department_id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Department users state for view modal
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUser[]>([]);
  const [departmentUsersLoading, setDepartmentUsersLoading] = useState<boolean>(false);
  const [departmentUsersError, setDepartmentUsersError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const usersPerPage = 5;
  
  // User management state
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [departmentForUsers, setDepartmentForUsers] = useState<Department | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userError, setUserError] = useState<string>('');
  
  // Department form state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [departmentToEdit, setDepartmentToEdit] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState<{ name: string; description: string }>({ 
    name: '', 
    description: '' 
  });
  const [formError, setFormError] = useState<string>('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
  
  // Load departments when the component mounts
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        setLoading(true);
        const data = await getDepartments();
        setDepartments(data);
      } catch (err) {
        console.error('Error loading departments:', err);
        setError('Failed to load departments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadDepartments();
  }, []);
  
  // Load unassigned users for the modal
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setUserError('');
      
      // Get all users first
      const allUsersData = await getUsers();
      
      // Then get users who are already assigned to departments
      const response = await apiRequest('departments/users/assigned', 'GET');
      const assignedUserIds = response.map((assignment: {user_id: string}) => assignment.user_id);
      
      // Filter out users who are already assigned to a department
      const unassignedUsers = allUsersData.filter((user: {id: string | number}) => 
        !assignedUserIds.includes(user.id.toString())
      );
      
      setAllUsers(unassignedUsers);
    } catch (err) {
      console.error('Error loading unassigned users:', err);
      setUserError('Failed to load unassigned users. Please try again.');
    } finally {
      setLoadingUsers(false);
    }
  };
  
  // Handle input changes for the new department form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewDepartment(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Load users for a specific department
  const loadDepartmentUsers = async (departmentId: string | number) => {
    try {
      setDepartmentUsersLoading(true);
      setDepartmentUsersError('');
      
      // Get users assigned to the selected department
      const response = await apiRequest(`departments/${departmentId}/users`, 'GET');
      
      if (Array.isArray(response)) {
        setDepartmentUsers(response);
        setTotalUsers(response.length);
        console.log(`Loaded ${response.length} users for department ${departmentId}`);
      } else {
        setDepartmentUsers([]);
        setTotalUsers(0);
      }
    } catch (err) {
      console.error('Error loading department users:', err);
      setDepartmentUsersError('Failed to load department users. Please try again.');
    } finally {
      setDepartmentUsersLoading(false);
    }
  };
  
  // Remove a user from department
  const removeUserFromDepartment = async (userId: string, departmentId: string | number) => {
    try {
      setLoading(true);
      
      // Call API to remove user from department
      await apiRequest(
        `departments/${departmentId}/removeUser/${userId}`,
        'DELETE'
      );
      
      // Update local state to reflect changes
      setDepartmentUsers(prev => prev.filter(user => user.user_id !== userId));
      setTotalUsers(prev => prev - 1);
      
      // Refresh departments list to update counts
      const updatedDepartments = await getDepartments();
      setDepartments(updatedDepartments);
      
    } catch (err) {
      console.error('Error removing user from department:', err);
      setDepartmentUsersError('Failed to remove user from department. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Show department details with users
  const handleViewDepartment = async (department: Department) => {
    setSelectedDepartment(department);
    setCurrentPage(1);
    setSearchTerm('');
    await loadDepartmentUsers(department.id);
  };
  
  // Handle form submission for creating a new department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!newDepartment.name.trim()) {
      setFormError('Department name is required');
      return;
    }
    
    try {
      setLoading(true);
      // Call createDepartment without storing the result since we don't use it
      await createDepartment(newDepartment.name, newDepartment.description);
      
      // Refresh the departments list
      const updatedDepartments = await getDepartments();
      setDepartments(updatedDepartments);
      
      // Reset form and close modal
      setNewDepartment({ name: '', description: '' });
      setShowAddModal(false);
    } catch (err) {
      console.error('Error creating department:', err);
      setFormError('Failed to create department. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Open edit modal for a department
  const handleOpenEditModal = (department: Department) => {
    setDepartmentToEdit(department);
    setNewDepartment({
      name: department.name,
      description: department.description
    });
    setShowEditModal(true);
  };
  
  // Handle form submission for updating a department
  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!newDepartment.name.trim() || !departmentToEdit) {
      setFormError('Department name is required');
      return;
    }
    
    try {
      setLoading(true);
      await updateDepartment(
        departmentToEdit.id,
        newDepartment.name,
        newDepartment.description
      );
      
      // Refresh the departments list
      const updatedDepartments = await getDepartments();
      setDepartments(updatedDepartments);
      
      // Reset form and close modal
      setNewDepartment({ name: '', description: '' });
      setShowEditModal(false);
      setDepartmentToEdit(null);
    } catch (err) {
      console.error('Error updating department:', err);
      setFormError('Failed to update department. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle department deletion
  const handleDeleteDepartment = async () => {
    if (!departmentToEdit) return;
    
    try {
      setLoading(true);
      await deleteDepartment(departmentToEdit.id);
      
      // Refresh the departments list
      const updatedDepartments = await getDepartments();
      setDepartments(updatedDepartments);
      
      // Reset state and close modals
      setNewDepartment({ name: '', description: '' });
      setShowDeleteConfirmation(false);
      setShowEditModal(false);
      setDepartmentToEdit(null);
    } catch (err) {
      console.error('Error deleting department:', err);
      setFormError('Failed to delete department. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Show user management modal for a department
  const handleShowUserModal = async (department: Department) => {
    setDepartmentForUsers(department);
    setSelectedUsers([]);
    setShowUserModal(true);
    loadUsers();
  };
  
  // Handle user selection
  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };
  
  // Add selected users to department
  const addUsersToDepartment = async () => {
    if (!departmentForUsers || selectedUsers.length === 0) return;
    
    try {
      setLoading(true);
      
      // Call API to add users to department
      await apiRequest(
        `departments/${departmentForUsers.id}/addUsers`, 
        'POST', 
        { userIds: selectedUsers }
      );
      
      // Refresh departments after adding users
      const updatedDepartments = await getDepartments();
      setDepartments(updatedDepartments);
      
      // Close modal and reset state
      setShowUserModal(false);
      setDepartmentForUsers(null);
      setSelectedUsers([]);
    } catch (err) {
      console.error('Error adding users to department:', err);
      setUserError('Failed to add users to department. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  // Filter users based on search term
  const filteredUsers = () => {
    if (!searchTerm.trim()) {
      return departmentUsers;
    }
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return departmentUsers.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      
      return fullName.includes(lowerCaseSearchTerm) || email.includes(lowerCaseSearchTerm);
    });
  };
  
  // Calculate pagination indexes
  const startIndex = () => (currentPage - 1) * usersPerPage;
  const endIndex = () => startIndex() + usersPerPage;
  
  // Get paginated and filtered users
  const filteredAndPaginatedUsers = () => {
    return filteredUsers().slice(startIndex(), endIndex());
  };
  
  return (
    <div className="departments-page">
      <header className="page-header">
        <h1>Department Management</h1>
        <div className="header-actions">
          {user?.role === 'admin' && (
            <>
              <div className="department-limit">
                <span className="limit-indicator">
                  <span className="limit-count">{departments.length}</span> / <span>10</span>
                </span>
                departments
              </div>
              <button 
                className="primary-btn"
                onClick={() => setShowAddModal(true)}
                disabled={departments.length >= 10}
                title={departments.length >= 10 ? 'Maximum department limit reached (10)' : 'Add a new department'}
              >
                + Add New Department
              </button>
            </>
          )}
        </div>
      </header>

      {loading && <div className="loading-indicator">Loading departments...</div>}
      
      {error && <div className="error-message">{error}</div>}

      <div className="departments-content">
        {departments.length === 0 && !loading ? (
          <div className="empty-state">
            <p>No departments found. Create your first department to get started.</p>
          </div>
        ) : (
          <div className="departments-grid">
            {departments.map(department => (
              <div key={department.id} className="department-card">
                <div className="department-card-header">
                  <h3>{department.name}</h3>
                </div>
                <div className="department-card-body">
                  <p className="department-description">{department.description || 'No description provided'}</p>
                  
                  <div className="department-metrics">
                    <div className="metric-item">
                      <div className="metric-value">{department.user_count || 0}</div>
                      <div className="metric-label">Users</div>
                    </div>
                    <div className="metric-item">
                      <div className="metric-value">{department.asset_count || 0}</div>
                      <div className="metric-label">Assets</div>
                    </div>
                  </div>
                  
                  {user?.role === 'admin' && (
                    <div className="department-actions">
                      <button 
                        className="action-btn view-btn"
                        onClick={() => handleViewDepartment(department)}
                        title="View department details and users"
                      >
                        <span className="btn-icon">👁️</span>
                        View
                      </button>
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => handleOpenEditModal(department)}
                        title="Edit department details"
                      >
                        <span className="btn-icon">✏️</span>
                        Edit
                      </button>
                      <button 
                        className="action-btn users-btn"
                        onClick={() => handleShowUserModal(department)}
                        title="Assign users to this department"
                      >
                        <span className="btn-icon">👤</span>
                        Assign
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Department Details Modal */}
        {selectedDepartment && (
          <div className="department-details-modal">
            <div className="modal-content">
              <h2>Department Details</h2>
              <div className="department-details">
                <p><strong>Name:</strong> {selectedDepartment.name}</p>
                <p><strong>Description:</strong> {selectedDepartment.description}</p>
                <p><strong>Total Users:</strong> {selectedDepartment.user_count || 0}</p>
                <p><strong>Total Assets:</strong> {selectedDepartment.asset_count || 0}</p>
              </div>
              
              <h3>Department Users</h3>
              {departmentUsersError && <div className="form-error">{departmentUsersError}</div>}
              
              <div className="search-bar">
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              
              <div className="department-users-list">
                {departmentUsersLoading ? (
                  <div className="loading-indicator">Loading users...</div>
                ) : filteredAndPaginatedUsers().length === 0 ? (
                  <div className="empty-state">
                    {searchTerm ? 'No users match your search' : 'No users assigned to this department'}
                  </div>
                ) : (
                  filteredAndPaginatedUsers().map(user => (
                    <div key={user.user_id} className="user-item">
                      <div className="user-info">
                        {user.firstName} {user.lastName} - {user.email}
                      </div>
                      <button 
                        className="remove-user-btn"
                        onClick={() => removeUserFromDepartment(user.user_id, selectedDepartment.id)}
                        title="Remove user from department"
                        disabled={loading}
                      >
                        ❌
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              {!departmentUsersLoading && filteredUsers().length > 0 && (
                <div className="users-pagination">
                  <div className="page-info">
                    Showing {startIndex() + 1}-{Math.min(endIndex(), filteredUsers().length)} of {filteredUsers().length} ({totalUsers} total in department)
                  </div>
                  <div className="pagination-controls">
                    <button 
                      className="page-button"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <button 
                      className="page-button"
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      disabled={endIndex() >= filteredUsers().length}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              
              <div className="modal-actions">
                <button 
                  className="secondary-btn" 
                  onClick={() => {
                    setSelectedDepartment(null);
                    setDepartmentUsers([]);
                    setDepartmentUsersError('');
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add New Department Modal */}
        {showAddModal && (
          <div className="add-department-modal">
            <div className="modal-content">
              <h2>Add New Department</h2>
              {formError && <div className="form-error">{formError}</div>}
              <form onSubmit={handleAddDepartment}>
                <div className="form-group">
                  <label htmlFor="name">Department Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newDepartment.name}
                    onChange={handleInputChange}
                    placeholder="Enter department name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newDepartment.description}
                    onChange={handleInputChange}
                    placeholder="Enter department description"
                    rows={4}
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="secondary-btn" 
                    onClick={() => setShowAddModal(false)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="primary-btn"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Add Users to Department Modal */}
        {showUserModal && departmentForUsers && (
          <div className="add-users-modal">
            <div className="modal-content">
              <h2>Assign Users to {departmentForUsers.name}</h2>
              {userError && <div className="form-error">{userError}</div>}
              
              <div className="users-list">
                {loadingUsers ? (
                  <div className="loading-indicator">Loading users...</div>
                ) : allUsers.length === 0 ? (
                  <div className="empty-state">No users available</div>
                ) : (
                  <div className="user-selection">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>Name</th>
                          <th>Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsers.map(user => (
                          <tr key={user.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.id.toString())}
                                onChange={() => handleUserSelection(user.id.toString())}
                              />
                            </td>
                            <td>{user.firstName} {user.lastName}</td>
                            <td>{user.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={() => setShowUserModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="primary-btn"
                  onClick={addUsersToDepartment}
                  disabled={loading || selectedUsers.length === 0}
                >
                  {loading ? 'Adding Users...' : 'Add Selected Users'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Department Modal */}
        {showEditModal && departmentToEdit && (
          <div className="edit-department-modal">
            <div className="modal-content">
              <h2>Edit Department</h2>
              {formError && <div className="form-error">{formError}</div>}
              <form onSubmit={handleUpdateDepartment}>
                <div className="form-group">
                  <label htmlFor="edit-name">Department Name</label>
                  <input
                    type="text"
                    id="edit-name"
                    name="name"
                    value={newDepartment.name}
                    onChange={handleInputChange}
                    placeholder="Enter department name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-description">Description</label>
                  <textarea
                    id="edit-description"
                    name="description"
                    value={newDepartment.description}
                    onChange={handleInputChange}
                    placeholder="Enter department description"
                    rows={4}
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="danger-btn" 
                    onClick={() => setShowDeleteConfirmation(true)}
                    disabled={loading}
                  >
                    Delete Department
                  </button>
                  <div className="action-group">
                    <button 
                      type="button" 
                      className="secondary-btn" 
                      onClick={() => {
                        setShowEditModal(false);
                        setDepartmentToEdit(null);
                        setNewDepartment({ name: '', description: '' });
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="primary-btn"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Department'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmation && departmentToEdit && (
          <div className="delete-confirmation-modal">
            <div className="modal-content">
              <h2>Confirm Deletion</h2>
              <p>Are you sure you want to delete the department <strong>{departmentToEdit.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone and all users in this department will become unassigned.</p>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="danger-btn"
                  onClick={handleDeleteDepartment}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete Department'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentsPage;