import React, { useRef, useState, useEffect } from 'react';

interface ProfilePictureUploaderProps {
  initials: string;
  imageUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
  loading?: boolean;
  editable?: boolean;
}

const ProfilePictureUploader: React.FC<ProfilePictureUploaderProps> = ({
  initials,
  imageUrl,
  onUpload,
  onDelete,
  loading = false,
  editable = true,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string>(imageUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setPreviewUrl(imageUrl || '');
  }, [imageUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onUpload(file);
    }
  };

  const handleDelete = async () => {
    if (onDelete) {
      setIsDeleting(true);
      await onDelete();
      setPreviewUrl('');
      setIsDeleting(false);
    }
  };

  // No longer needed as we're using CSS classes for styling
  // Theme styling will be handled by CSS based on the data-theme attribute
  
  return (
    <div className="profile-picture-section profile-picture-borderless" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center'
      }}>
      <div style={{
        position: 'relative',
        width: '154px',
        height: '154px',
        marginBottom: '1.5rem',
        overflow: 'visible',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {previewUrl ? (
          <div style={{
            width: '150px',
            height: '150px',
            borderRadius: '75px', /* Explicitly using pixels for perfect roundness */
            backgroundColor: '#4c566a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxShadow: '0 0 0 2px #a6abb5'
          }}>
            <img 
              src={previewUrl} 
              alt="Profile" 
              style={{ 
                width: '150px', 
                height: '150px', 
                objectFit: 'cover',
                borderRadius: '75px' /* Explicitly using pixels for perfect roundness */
              }} 
            />
          </div>
        ) : (
          <div style={{
            width: '150px',
            height: '150px',
            borderRadius: '75px', /* Explicitly using pixels for perfect roundness */
            backgroundColor: '#4c566a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '3rem',
            fontWeight: 500,
            boxShadow: '0 0 0 2px #a6abb5'
          }}>
            {initials}
          </div>
        )}
        {editable && (
          <label htmlFor="profilePicture" style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#4ECDC4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'white',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            zIndex: 10
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </label>
        )}
        <input
          type="file"
          id="profilePicture"
          accept="image/jpeg, image/png, image/gif"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="profile-picture-input"
          disabled={!editable || loading}
        />
      </div>
      {previewUrl && editable && onDelete && (
        <button
          type="button"
          className="profile-picture-delete-btn"
          onClick={handleDelete}
          disabled={loading || isDeleting}
        >
          {(loading || isDeleting) ? 'Deleting...' : 'Remove Picture'}
        </button>
      )}
    </div>
  );
};

export default ProfilePictureUploader;
