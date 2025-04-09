// apps/web/src/pages/AssetsPage.tsx
import React, { useState } from 'react';
import '../styles/AssetsPage.css';
import { useAuth } from '../contexts/AuthContext';

// Mock data for assets
const MOCK_ASSETS = [
  {
    id: '1',
    name: 'MacBook Pro',
    assetTag: 'MAC-2023-001',
    type: 'Laptop',
    status: 'assigned',
    serialNumber: 'SN123456789',
    department: 'IT'
  },
  {
    id: '2',
    name: 'Dell Monitor',
    assetTag: 'MON-2023-002',
    type: 'Monitor',
    status: 'available',
    serialNumber: 'SN987654321',
    department: 'Operations'
  },
  {
    id: '3',
    name: 'Cisco Router',
    assetTag: 'NET-2023-003',
    type: 'Network Equipment',
    status: 'under_repair',
    serialNumber: 'SN567891234',
    department: 'IT'
  }
];

const AssetsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  return (
    <div className="assets-page">
      <header className="page-header">
        <h1>Assets Management</h1>
        <div className="header-actions">
          {user?.role === 'admin' && (
            <button className="primary-btn">+ Add New Asset</button>
          )}
        </div>
      </header>

      <div className="assets-content">
        <div className="assets-list">
          <div className="assets-table-header">
            <h2>Current Assets</h2>
            <div className="table-controls">
              <input 
                type="text" 
                placeholder="Search assets..." 
                className="search-input" 
              />
              <select className="filter-select">
                <option>All Statuses</option>
                <option>Available</option>
                <option>Assigned</option>
                <option>Under Repair</option>
              </select>
            </div>
          </div>

          <table className="assets-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Name</th>
                <th>Type</th>
                <th>Serial Number</th>
                <th>Status</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ASSETS.map(asset => (
                <tr key={asset.id}>
                  <td>{asset.assetTag}</td>
                  <td>{asset.name}</td>
                  <td>{asset.type}</td>
                  <td>{asset.serialNumber}</td>
                  <td>
                    <span className={`status-badge status-${asset.status.toLowerCase()}`}>
                      {asset.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{asset.department}</td>
                  <td>
                    <button 
                      className="action-btn"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedAsset && (
            <div className="asset-details-modal">
              <div className="modal-content">
                <h2>Asset Details</h2>
                <div className="asset-details">
                  <p><strong>Name:</strong> {selectedAsset.name}</p>
                  <p><strong>Asset Tag:</strong> {selectedAsset.assetTag}</p>
                  <p><strong>Serial Number:</strong> {selectedAsset.serialNumber}</p>
                  <p><strong>Type:</strong> {selectedAsset.type}</p>
                  <p><strong>Status:</strong> {selectedAsset.status}</p>
                  <p><strong>Department:</strong> {selectedAsset.department}</p>
                </div>
                <div className="modal-actions">
                  <button 
                    className="secondary-btn" 
                    onClick={() => setSelectedAsset(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetsPage;