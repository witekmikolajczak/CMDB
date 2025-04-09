// apps/web/src/pages/AssignmentsPage.tsx
import React, { useState } from 'react';
import '../styles/AssignmentsPage.css';
import { useAuth } from '../contexts/AuthContext';

// Mock data for asset assignments
const MOCK_ASSIGNMENTS = [
  {
    id: '1',
    asset: {
      name: 'MacBook Pro 16"',
      assetTag: 'MAC-2023-001',
      serialNumber: 'SN123456789',
      type: 'Laptop'
    },
    assignedTo: {
      id: 'user1',
      name: 'John Doe',
      email: 'john.doe@company.com',
      department: 'IT'
    },
    assignedBy: {
      name: 'Jane Smith',
      email: 'jane.smith@company.com'
    },
    assignmentDate: '2023-06-15',
    expectedReturnDate: '2024-06-15',
    actualReturnDate: null,
    status: 'active',
    purpose: 'Work Laptop',
    notes: 'Brand new laptop for software development team'
  },
  {
    id: '2',
    asset: {
      name: 'Dell 27" Monitor',
      assetTag: 'MON-2023-002',
      serialNumber: 'SN987654321',
      type: 'Monitor'
    },
    assignedTo: {
      id: 'user2',
      name: 'Emily Chen',
      email: 'emily.chen@company.com',
      department: 'Design'
    },
    assignedBy: {
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com'
    },
    assignmentDate: '2023-07-01',
    expectedReturnDate: '2024-01-01',
    actualReturnDate: null,
    status: 'active',
    purpose: 'Graphic Design Workstation',
    notes: 'High-resolution monitor for design team'
  },
  {
    id: '3',
    asset: {
      name: 'iPhone 14 Pro',
      assetTag: 'MOB-2023-003',
      serialNumber: 'SN567891234',
      type: 'Smartphone'
    },
    assignedTo: {
      id: 'user3',
      name: 'Sarah Williams',
      email: 'sarah.williams@company.com',
      department: 'Sales'
    },
    assignedBy: {
      name: 'David Brown',
      email: 'david.brown@company.com'
    },
    assignmentDate: '2023-05-20',
    expectedReturnDate: '2024-05-20',
    actualReturnDate: null,
    status: 'overdue',
    purpose: 'Business Communication',
    notes: 'Company mobile for sales representatives'
  }
];

const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [filter, setFilter] = useState('all');

  // Filter assignments based on status
  const filteredAssignments = MOCK_ASSIGNMENTS.filter(assignment => {
    if (filter === 'all') return true;
    return assignment.status === filter;
  });

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Determine status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'overdue': return 'status-overdue';
      case 'scheduled_return': return 'status-scheduled';
      default: return '';
    }
  };

  return (
    <div className="assignments-page">
      <header className="page-header">
        <h1>Asset Assignments</h1>
        <div className="header-actions">
          {user?.role === 'admin' && (
            <button className="primary-btn">+ New Assignment</button>
          )}
        </div>
      </header>

      <div className="assignments-content">
        <div className="assignments-controls">
          <div className="filter-section">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select 
              id="status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Assignments</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="scheduled_return">Scheduled Return</option>
            </select>
          </div>
          <input 
            type="text" 
            placeholder="Search assignments..." 
            className="search-input" 
          />
        </div>

        <div className="assignments-table-container">
          <table className="assignments-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Assigned To</th>
                <th>Assignment Date</th>
                <th>Expected Return</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map(assignment => (
                <tr key={assignment.id}>
                  <td>
                    <div className="asset-info">
                      <span className="asset-name">{assignment.asset.name}</span>
                      <span className="asset-tag">{assignment.asset.assetTag}</span>
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      <span className="user-name">{assignment.assignedTo.name}</span>
                      <span className="user-department">{assignment.assignedTo.department}</span>
                    </div>
                  </td>
                  <td>{formatDate(assignment.assignmentDate)}</td>
                  <td>{formatDate(assignment.expectedReturnDate)}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(assignment.status)}`}>
                      {assignment.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="action-btn"
                      onClick={() => setSelectedAssignment(assignment)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedAssignment && (
          <div className="assignment-details-modal">
            <div className="modal-content">
              <h2>Assignment Details</h2>
              <div className="assignment-details">
                <div className="detail-section">
                  <h3>Asset Information</h3>
                  <p><strong>Name:</strong> {selectedAssignment.asset.name}</p>
                  <p><strong>Asset Tag:</strong> {selectedAssignment.asset.assetTag}</p>
                  <p><strong>Serial Number:</strong> {selectedAssignment.asset.serialNumber}</p>
                  <p><strong>Type:</strong> {selectedAssignment.asset.type}</p>
                </div>

                <div className="detail-section">
                  <h3>Assignment Information</h3>
                  <p><strong>Assigned To:</strong> {selectedAssignment.assignedTo.name}</p>
                  <p><strong>Department:</strong> {selectedAssignment.assignedTo.department}</p>
                  <p><strong>Assigned By:</strong> {selectedAssignment.assignedBy.name}</p>
                  <p><strong>Assignment Date:</strong> {formatDate(selectedAssignment.assignmentDate)}</p>
                  <p><strong>Expected Return Date:</strong> {formatDate(selectedAssignment.expectedReturnDate)}</p>
                  <p><strong>Status:</strong> 
                    <span className={`status-badge ${getStatusBadgeClass(selectedAssignment.status)}`}>
                      {selectedAssignment.status.replace('_', ' ')}
                    </span>
                  </p>
                </div>

                <div className="detail-section">
                  <h3>Additional Information</h3>
                  <p><strong>Purpose:</strong> {selectedAssignment.purpose}</p>
                  <p><strong>Notes:</strong> {selectedAssignment.notes}</p>
                </div>
              </div>
              <div className="modal-actions">
                {user?.role === 'admin' && (
                  <>
                    <button className="secondary-btn">Edit Assignment</button>
                    <button className="secondary-btn danger-btn">End Assignment</button>
                  </>
                )}
                <button 
                  className="secondary-btn" 
                  onClick={() => setSelectedAssignment(null)}
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

export default AssignmentsPage;