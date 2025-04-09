// apps/web/src/pages/Register.tsx
import React, { useState, useEffect } from 'react';
import '../styles/Login.css'; // Reuse login styles
import { authService } from '../services/authService';
import { getDepartments } from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onLoginClick: () => void;
}

interface Department {
  id: number;
  name: string;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onLoginClick }) => {
  // Use auth context to access updateUser method
  const { updateUser } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    departmentId: ''
  });

  // Departments
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await getDepartments();
        setDepartments(data);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };

    fetchDepartments();
  }, []);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined
      });
      
      // Update user state before calling onRegisterSuccess
      updateUser();
      onRegisterSuccess();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Registration failed. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <header className="login-header">
        <div className="logo-container">
          <img src="./logo-small.svg" alt="logo" width="60px" />
          <h1 className="app-title">InvenTrack</h1>
        </div>
      </header>

      <main className="login-content">
        <div className="login-card register-card">
          <h2>Create Account</h2>
          <p className="login-subtitle">Register to access the asset management system</p>
          
          {errors.form && (
            <div className="error-message">
              <span className="error-icon">⚠️</span> {errors.form}
            </div>
          )}
          
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name*</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  disabled={isLoading}
                  className={errors.firstName ? 'error' : ''}
                />
                {errors.firstName && <div className="field-error">{errors.firstName}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name*</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  disabled={isLoading}
                  className={errors.lastName ? 'error' : ''}
                />
                {errors.lastName && <div className="field-error">{errors.lastName}</div>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Username*</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                disabled={isLoading}
                className={errors.username ? 'error' : ''}
              />
              {errors.username && <div className="field-error">{errors.username}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={isLoading}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <div className="field-error">{errors.email}</div>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password*</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  disabled={isLoading}
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <div className="field-error">{errors.password}</div>}
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password*</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="departmentId">Department (Optional)</label>
              <select
                id="departmentId"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="">Select a department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              type="submit" 
              className="primary-btn login-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="register-prompt">
            <p>Already have an account?</p>
            <button 
              className="text-btn" 
              onClick={onLoginClick}
              disabled={isLoading}
            >
              Sign In
            </button>
          </div>
        </div>
      </main>

      <footer className="login-footer">
        <p>&copy; {new Date().getFullYear()} Witold Mikołajczak & Dawid Skrzypacz. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Register;