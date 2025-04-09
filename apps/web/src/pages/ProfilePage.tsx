import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user, updateUserProfile, uploadProfilePicture, deleteProfilePicture, getProfilePictureUrl, setUser } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add state for modal
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ title: '', text: '', type: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        department: user.departmentId ? `Department ${user.departmentId}` : ''
      });
      
      // Set profile picture URL if available
      const pictureUrl = getProfilePictureUrl();
      if (pictureUrl) {
        // Create a function to fetch the image with authentication
        const fetchProfileImage = async () => {
          try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            
            const response = await fetch(pictureUrl, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const imageUrl = URL.createObjectURL(blob);
              setPreviewUrl(imageUrl);
            }
          } catch (error) {
            console.error('Error fetching profile image:', error);
          }
        };
        
        fetchProfileImage();
      }
    }
  }, [user, getProfilePictureUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicture(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureDelete = async () => {
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await deleteProfilePicture();
      
      // Show success modal
      setModalMessage({
        title: 'Success!',
        text: 'Profile picture deleted successfully!',
        type: 'success'
      });
      setShowModal(true);
      
      setPreviewUrl('');
    } catch (error) {
      // Show error modal
      setModalMessage({
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to delete profile picture',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Only send the fields that can be updated
      const updatedUser = await updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email
      });
      
      // Update the user state with the returned user object
      if (updatedUser) {
        setUser(updatedUser);
      }
      
      // If there's a profile picture to upload, do it after profile update
      if (profilePicture) {
        await uploadProfilePicture(profilePicture);
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setProfilePicture(null);
      }
      
      // Show success modal
      setModalMessage({
        title: 'Success!',
        text: 'Profile updated successfully!',
        type: 'success'
      });
      setShowModal(true);
    } catch (error) {
      // Show error modal
      setModalMessage({
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to update profile',
        type: 'error'
      });
      setShowModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal handler
  const closeModal = () => {
    setShowModal(false);
  };

  if (!user) {
    return <div className="profile-loading">Loading user data...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Profile Information</h2>
        <p>Update your personal information</p>
      </div>

      {message.text && (
        <div className={`profile-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Status Modal */}
      {showModal && (
        <div className="profile-modal-overlay">
          <div className={`profile-modal ${modalMessage.type}`}>
            <div className="modal-header">
              <h3>{modalMessage.title}</h3>
              <button className="modal-close-btn" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <p>{modalMessage.text}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-continue-btn" 
                onClick={closeModal}
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-picture-section">
          <div className="profile-picture-container">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Profile" 
                className="profile-picture"
              />
            ) : (
              <div className="profile-picture-placeholder">
                {user.firstName && user.lastName 
                  ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` 
                  : 'User'}
              </div>
            )}
            <label htmlFor="profilePicture" className="profile-picture-edit-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </label>
            <input
              type="file"
              id="profilePicture"
              accept="image/jpeg, image/png, image/gif"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="profile-picture-input"
            />
          </div>
          
          {previewUrl && (
            <button 
              type="button" 
              className="profile-picture-delete-btn"
              onClick={handleProfilePictureDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Remove Picture'}
            </button>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="department">Department</label>
          <input
            type="text"
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            disabled
          />
          <small>Department can only be changed by administrators</small>
        </div>

        <div className="form-group">
          <label htmlFor="role">Role</label>
          <input
            type="text"
            id="role"
            name="role"
            value={user?.role || ''}
            disabled
          />
          <small>Role can only be changed by administrators</small>
        </div>

        <button 
          type="submit" 
          className="profile-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
