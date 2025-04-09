// apps/web/src/pages/DepartmentsPage.tsx
import React, { useState } from 'react';
import '../styles/DepartmentsPage.css';
import { useAuth } from '../contexts/AuthContext';

// Mock data for departments
const MOCK_DEPARTMENTS = [
  {
    id: '1',
    name: 'Information Technology',
    description: 'Manages all IT infrastructure and support',
    userCount: 15,
    assetCount: 45
  },
  {
    id: '2',
    name: 'Human Resources',
    description: 'Responsible for recruitment and employee relations',
    userCount: 8,
    assetCount: 12
  },
  {
    id: '3',
    name: 'Finance',
    description: 'Handles financial planning and accounting',
    userCount: 10,
    assetCount: 20
  },
  {
    id: '4',
    name: 'Sales',
    description: 'Drives revenue and customer acquisition',
    userCount: 25,
    assetCount: 35
  }
];

const DepartmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);

  return (
    <div className="departments-page">
      <header className="page-header">
        <h1>Department Management</h1>
        <div className="header-actions">
          {user?.role === 'admin' && (
            <button className="primary-btn">+ Add New Department</button>
          )}
        </div>
      </header>

      <div className="departments-content">
        <div className="departments-grid">
          {MOCK_DEPARTMENTS.map(department => (
            <div key={department.id} className="department-card">
              <div className="department-card-header">
                <h3>{department.name}</h3>
                {user?.role === 'admin' && (
                  <div className="department-actions">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => setSelectedDepartment(department)}
                    >
                      View
                    </button>
                  </div>
                )}
              </div>
              <div className="department-card-body">
                <p className="department-description">{department.description}</p>
                <div className="department-stats">
                  <div className="stat-item">
                    <span className="stat-label">Users</span>
                    <span className="stat-value">{department.userCount}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Assets</span>
                    <span className="stat-value">{department.assetCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedDepartment && (
          <div className="department-details-modal">
            <div className="modal-content">
              <h2>Department Details</h2>
              <div className="department-details">
                <p><strong>Name:</strong> {selectedDepartment.name}</p>
                <p><strong>Description:</strong> {selectedDepartment.description}</p>
                <p><strong>Total Users:</strong> {selectedDepartment.userCount}</p>
                <p><strong>Total Assets:</strong> {selectedDepartment.assetCount}</p>
              </div>
              <div className="modal-actions">
                <button 
                  className="secondary-btn" 
                  onClick={() => setSelectedDepartment(null)}
                >
                  Close
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