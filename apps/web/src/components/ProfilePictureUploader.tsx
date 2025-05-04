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

  return (
    <div className="profile-picture-section">
      <div className="profile-picture-container">
        {previewUrl ? (
          <img src={previewUrl} alt="Profile" className="profile-picture" />
        ) : (
          <div className="profile-picture-placeholder">{initials}</div>
        )}
        {editable && (
          <label htmlFor="profilePicture" className="profile-picture-edit-icon">
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
