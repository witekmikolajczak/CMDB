// apps/web/src/pages/AssetsPage.tsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/AssetsPage.css';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { createAssetType, createDepartment, getAssetTypes, getDepartments } from '../api/apiClient';

// Define TypeScript interfaces
interface Asset {
  id: number;
  name: string;
  assetTag: string;
  type: string;
  status: string;
  serialNumber: string;
  department: string;
  make?: string;
  model?: string;
  description?: string;
  createdAt?: string;
  createdBy?: string;
  createdByName?: string;
}

interface AssetType {
  id: number;
  name: string;
  description?: string;
}

interface Department {
  id: number;
  name: string;
  description?: string;
}

// Mock data will be defined in the component if API calls fail

const AssetsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // New state variables for asset type and department creation
  const [showAddAssetTypeModal, setShowAddAssetTypeModal] = useState<boolean>(false);
  const [showAddDepartmentModal, setShowAddDepartmentModal] = useState<boolean>(false);
  const [newAssetType, setNewAssetType] = useState({ name: '', description: '' });
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });
  const [assetTypeError, setAssetTypeError] = useState<string>('');
  const [departmentError, setDepartmentError] = useState<string>('');

  // New asset form state
  const [newAsset, setNewAsset] = useState({
    name: '',
    assetTag: '',
    description: '',
    assetTypeId: '',
    serialNumber: '',
    macAddress: '',
    imei: '',
    status: 'available',
    acquisitionDate: '',
    acquisitionCost: '',
    make: '',
    model: '',
    specifications: '',
    notes: '',
    departmentId: ''
  });
  
  // Search state for dropdown filters
  const [assetTypeSearch, setAssetTypeSearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');
  
  // Filtered asset types and departments
  const filteredAssetTypes = assetTypes
    .filter(type => type.name.toLowerCase().includes(assetTypeSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
    
  const filteredDepartments = departments
    .filter(dept => dept.name.toLowerCase().includes(departmentSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Handle clicks outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close asset type dropdown if clicking outside
      const assetTypeDropdown = document.getElementById('assetTypeDropdown');
      const assetTypeContainer = document.querySelector('.integrated-dropdown');
      if (assetTypeDropdown?.classList.contains('show') && 
          assetTypeContainer && 
          !assetTypeContainer.contains(event.target as Node)) {
        assetTypeDropdown.classList.remove('show');
      }

      // Close department dropdown if clicking outside
      const departmentDropdown = document.getElementById('departmentDropdown');
      const departmentContainer = document.querySelectorAll('.integrated-dropdown')[1];
      if (departmentDropdown?.classList.contains('show') && 
          departmentContainer && 
          !departmentContainer.contains(event.target as Node)) {
        departmentDropdown.classList.remove('show');
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load asset types, departments, and assets on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch asset types - our updated function will handle fallbacks to local storage
        const typesResponse = await getAssetTypes();
        setAssetTypes(typesResponse as AssetType[]);

        // Fetch departments - our updated function will handle fallbacks to local storage
        const deptsResponse = await getDepartments();
        setDepartments(deptsResponse as Department[]);

        // Fetch assets
        try {
          if (axios.defaults.baseURL) {
            const assetsResponse = await axios.get('/api/assets');

            if (assetsResponse && assetsResponse.data) {
              if (Array.isArray(assetsResponse.data)) {
                setAssets(assetsResponse.data as Asset[]);
              } else if (typeof assetsResponse.data === 'object' && assetsResponse.data !== null) {
                // Check for nested data structures
                const responseObj = assetsResponse.data as Record<string, unknown>;
                if ('assets' in responseObj && Array.isArray(responseObj.assets)) {
                  setAssets(responseObj.assets as Asset[]);
                } else if ('data' in responseObj && Array.isArray(responseObj.data)) {
                  setAssets(responseObj.data as Asset[]);
                }
              }
            }
          } else {
            console.warn('API response is not in expected format, using mock data');
          }
        } catch (e) {
          console.error('Error fetching assets:', e);
          console.warn('Could not fetch assets from API, using mock data');
          // We'll keep using the mock assets defined above
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle input changes for the new asset form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewAsset(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle input changes for the new asset type form
  const handleAssetTypeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewAssetType(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle input changes for the new department form
  const handleDepartmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewDepartment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setNewAsset({
      name: '',
      assetTag: '',
      description: '',
      assetTypeId: '',
      serialNumber: '',
      macAddress: '',
      imei: '',
      status: 'available',
      acquisitionDate: '',
      acquisitionCost: '',
      make: '',
      model: '',
      specifications: '',
      notes: '',
      departmentId: ''
    });
  };

  const resetAssetTypeForm = () => {
    setNewAssetType({
      name: '',
      description: ''
    });
    setAssetTypeError('');
  };

  const resetDepartmentForm = () => {
    setNewDepartment({
      name: '',
      description: ''
    });
    setDepartmentError('');
  };

  // Handle adding a new asset type
  const handleAddAssetType = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Transform form data to match the API's expected format
      const assetTypeData = {
        name: newAssetType.name,
        description: newAssetType.description
      };

      // Call the API to create a new asset type
      try {
        await axios.post('/api/asset-types', assetTypeData);
        
        // If successful, refresh the asset types list
        const typesResponse = await axios.get('/api/asset-types');
        setAssetTypes(typesResponse.data as AssetType[]);
        
        // Close modal and reset form
        setShowAddAssetTypeModal(false);
        resetAssetTypeForm();
        
        // You could add a success message/notification here
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        setError(apiError.response?.data?.message || 'Failed to create asset type. Please try again.');
      }
    } catch (err) {
      console.error('Error adding asset type:', err);
      setError('Failed to add asset type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new department
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Transform form data to match the API's expected format
      const departmentData = {
        name: newDepartment.name,
        description: newDepartment.description
      };

      // Call the API to create a new department
      try {
        await axios.post('/api/departments', departmentData);
        
        // If successful, refresh the departments list
        const deptsResponse = await axios.get('/api/departments');
        setDepartments(deptsResponse.data as Department[]);
        
        // Close modal and reset form
        setShowAddDepartmentModal(false);
        resetDepartmentForm();
        
        // You could add a success message/notification here
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        setError(apiError.response?.data?.message || 'Failed to create department. Please try again.');
      }
    } catch (err) {
      console.error('Error adding department:', err);
      setError('Failed to add department. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new asset type directly from the dropdown
  const handleAddAssetTypeFromDropdown = async (name: string) => {
    if (!name.trim()) return;

    try {
      setLoading(true);
      // Create the new asset type
      const newType = await createAssetType(name);
      
      // Refresh the asset types list from local storage
      const updatedTypes = await getAssetTypes();
      setAssetTypes(updatedTypes);
      
      // Select the new type
      setNewAsset({...newAsset, assetTypeId: newType.id.toString()});
      
      // Close the dropdown
      document.getElementById('assetTypeDropdown')?.classList.remove('show');
      
      // Clear the search
      setAssetTypeSearch('');
      
    } catch (error) {
      console.error('Failed to create asset type:', error);
      alert(`Failed to create asset type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new department directly from the dropdown
  const handleAddDepartmentFromDropdown = async (name: string) => {
    if (!name.trim()) return;

    try {
      setLoading(true);
      // Create the new department
      const newDept = await createDepartment(name);
      
      // Refresh the departments list from local storage
      const updatedDepartments = await getDepartments();
      setDepartments(updatedDepartments);
      
      // Select the new department
      setNewAsset({...newAsset, departmentId: newDept.id.toString()});
      
      // Close the dropdown
      document.getElementById('departmentDropdown')?.classList.remove('show');
      
      // Clear the search
      setDepartmentSearch('');
      
    } catch (error) {
      console.error('Failed to create department:', error);
      alert(`Failed to create department: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new asset
  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Transform form data to match the API's expected format
      const assetData = {
        name: newAsset.name,
        asset_tag: newAsset.assetTag,
        description: newAsset.description,
        asset_type_id: parseInt(newAsset.assetTypeId),
        serial_number: newAsset.serialNumber,
        mac_address: newAsset.macAddress,
        imei: newAsset.imei,
        status: newAsset.status,
        acquisition_date: newAsset.acquisitionDate ? new Date(newAsset.acquisitionDate) : null,
        acquisition_cost: newAsset.acquisitionCost ? parseFloat(newAsset.acquisitionCost) : null,
        make: newAsset.make,
        model: newAsset.model,
        specifications: newAsset.specifications,
        notes: newAsset.notes,
        department_id: newAsset.departmentId ? parseInt(newAsset.departmentId) : null
      };

      // Call the API to create a new asset
      try {
        await axios.post('/api/assets', assetData);
        
        // If successful, refresh the assets list
        const assetsResponse = await axios.get('/api/assets');
        setAssets(assetsResponse.data as Asset[]);
        
        // Close modal and reset form
        setShowAddModal(false);
        resetForm();
        
        // You could add a success message/notification here
      } catch (apiError: any) {
        console.error('API Error:', apiError);
        setError(apiError.response?.data?.message || 'Failed to create asset. Please try again.');
      }
    } catch (err) {
      console.error('Error adding asset:', err);
      setError('Failed to add asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assets-page">
      <header className="page-header">
        <h1>Assets Management</h1>
        <div className="header-actions">
          {user?.role === 'admin' && (
            <button 
              className="primary-btn" 
              onClick={() => setShowAddModal(true)}
            >
              + Add New Asset
            </button>
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
              {Array.isArray(assets) && assets.length > 0 ? (
                assets.map(asset => (
                  <tr key={asset.id}>
                    <td>{asset.assetTag}</td>
                    <td>{asset.name}</td>
                    <td>{asset.type}</td>
                    <td>{asset.serialNumber}</td>
                    <td>
                      <span className={`status-badge status-${asset.status?.toLowerCase() || 'unknown'}`}>
                        {asset.status?.replace('_', ' ') || 'Unknown'}
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
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="no-assets-message">No assets found or data is not in the expected format.</td>
                </tr>
              )}
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
                  {selectedAsset.make && <p><strong>Make:</strong> {selectedAsset.make}</p>}
                  {selectedAsset.model && <p><strong>Model:</strong> {selectedAsset.model}</p>}
                  {selectedAsset.description && <p><strong>Description:</strong> {selectedAsset.description}</p>}
                  {selectedAsset.createdAt && <p><strong>Created:</strong> {new Date(selectedAsset.createdAt).toLocaleString()}</p>}
                  {selectedAsset.createdByName && <p><strong>Created By:</strong> {selectedAsset.createdByName}</p>}
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

          {/* Add Asset Modal */}
          {showAddModal && (
            <div className="asset-details-modal">
              <div className="modal-content add-asset-modal">
                <h2>Add New Asset</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleAddAsset}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="name">Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={newAsset.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Asset name"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="assetTag">Asset Tag *</label>
                      <input
                        type="text"
                        id="assetTag"
                        name="assetTag"
                        value={newAsset.assetTag}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., LAP-2025-001"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="assetTypeId">Asset Type *</label>
                      <div className="integrated-dropdown">
                        <div className="dropdown-search-container">
                          <input
                            type="text"
                            placeholder="Search or select asset type..."
                            value={assetTypeSearch !== '' ? assetTypeSearch : (() => {
                              const selected = assetTypes.find(type => type.id.toString() === newAsset.assetTypeId);
                              return selected ? selected.name : '';
                            })()}
                            onChange={e => setAssetTypeSearch(e.target.value)}
                            className="integrated-search"
                            onClick={() => document.getElementById('assetTypeDropdown')?.classList.add('show')}
                            required
                            readOnly={false}
                          />
                          <div className="dropdown-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                            </svg>
                          </div>
                        </div>
                        <div id="assetTypeDropdown" className="dropdown-options">
                          <div className="dropdown-list">
                            {Array.isArray(filteredAssetTypes) && filteredAssetTypes.length > 0 ? (
                              filteredAssetTypes.map(type => (
                                <div
                                  key={type.id}
                                  className={`dropdown-item ${newAsset.assetTypeId === type.id.toString() ? 'selected' : ''}`}
                                  onClick={() => {
                                    setNewAsset(prev => ({
                                      ...prev,
                                      assetTypeId: type.id.toString()
                                    }));
                                    setAssetTypeSearch('');
                                    document.getElementById('assetTypeDropdown')?.classList.remove('show');
                                  }}
                                >
                                  {type.name}
                                </div>
                              ))
                            ) : assetTypeSearch ? (
                              <div
                                className="dropdown-item quick-add"
                                onClick={() => handleAddAssetTypeFromDropdown(assetTypeSearch)}
                              >
                                <span className="plus-icon">+</span> Add "{assetTypeSearch}" as new asset type
                              </div>
                            ) : (
                              <div className="dropdown-item no-results">No asset types available</div>
                            )}
                          </div>
                        </div>
                        <input
                          type="hidden"
                          id="assetTypeId"
                          name="assetTypeId"
                          value={newAsset.assetTypeId}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="serialNumber">{t('assets.serialNumber')}</label>
                      <input
                        type="text"
                        id="serialNumber"
                        name="serialNumber"
                        value={newAsset.serialNumber}
                        onChange={handleInputChange}
                        placeholder={t('assets.serialNumber')}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="status">{t('assets.status')} *</label>
                      <select
                        id="status"
                        name="status"
                        value={newAsset.status}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="available">{t('assets.statusAvailable')}</option>
                        <option value="assigned">{t('assets.statusAssigned')}</option>
                        <option value="under_repair">{t('assets.statusUnderRepair')}</option>
                        <option value="retired">{t('assets.statusRetired')}</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="departmentId">{t('assets.department')}</label>
                      <div className="integrated-dropdown">
                        <div className="dropdown-search-container">
                          <input
                            type="text"
                            placeholder="Search or select department..."
                            value={departmentSearch}
                            onChange={(e) => setDepartmentSearch(e.target.value)}
                            className="integrated-search"
                            onClick={() => document.getElementById('departmentDropdown')?.classList.add('show')}
                          />
                          <div className="dropdown-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
                            </svg>
                          </div>
                        </div>
                        
                        <div id="departmentDropdown" className="dropdown-options">
                          <div className="dropdown-list">
                            {Array.isArray(filteredDepartments) && filteredDepartments.length > 0 ? (
                              filteredDepartments.map(dept => (
                                <div 
                                  key={dept.id} 
                                  className={`dropdown-item ${newAsset.departmentId === dept.id.toString() ? 'selected' : ''}`}
                                  onClick={() => {
                                    setNewAsset({...newAsset, departmentId: dept.id.toString()});
                                    setDepartmentSearch('');
                                    document.getElementById('departmentDropdown')?.classList.remove('show');
                                  }}
                                >
                                  {dept.name}
                                </div>
                              ))
                            ) : departmentSearch ? (
                              <div 
                                className="dropdown-item quick-add"
                                onClick={() => handleAddDepartmentFromDropdown(departmentSearch)}
                              >
                                <span className="plus-icon">+</span> Add "{departmentSearch}" as new department
                              </div>
                            ) : (
                              <div className="dropdown-item no-results">No departments available</div>
                            )}
                          </div>
                        </div>
                        
                        <input
                          type="hidden"
                          id="departmentId"
                          name="departmentId"
                          value={newAsset.departmentId}
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="make">Make</label>
                      <input
                        type="text"
                        id="make"
                        name="make"
                        value={newAsset.make}
                        onChange={handleInputChange}
                        placeholder="e.g., Dell, HP"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="model">Model</label>
                      <input
                        type="text"
                        id="model"
                        name="model"
                        value={newAsset.model}
                        onChange={handleInputChange}
                        placeholder="e.g., XPS 15, EliteBook"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="macAddress">MAC Address</label>
                      <input
                        type="text"
                        id="macAddress"
                        name="macAddress"
                        value={newAsset.macAddress}
                        onChange={handleInputChange}
                        placeholder="For network devices"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="acquisitionDate">Acquisition Date</label>
                      <input
                        type="date"
                        id="acquisitionDate"
                        name="acquisitionDate"
                        value={newAsset.acquisitionDate}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="acquisitionCost">Acquisition Cost</label>
                      <input
                        type="number"
                        id="acquisitionCost"
                        name="acquisitionCost"
                        value={newAsset.acquisitionCost}
                        onChange={handleInputChange}
                        step="0.01"
                        placeholder="Purchase cost"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={newAsset.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Brief description of the asset"
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="specifications">Specifications</label>
                    <textarea
                      id="specifications"
                      name="specifications"
                      value={newAsset.specifications}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Technical specifications"
                    />
                  </div>
                  
                  <div className="form-group full-width">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={newAsset.notes}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Additional notes"
                    />
                  </div>
                  
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
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
                      {loading ? 'Adding...' : 'Add Asset'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Asset Type Modal */}
      {showAddAssetTypeModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Asset Type</h3>
              <button className="close-btn" onClick={() => {
                setShowAddAssetTypeModal(false);
                resetAssetTypeForm();
              }}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddAssetType}>
                {assetTypeError && <div className="error-message">{assetTypeError}</div>}
                
                <div className="form-group">
                  <label htmlFor="assetTypeName">Name *</label>
                  <input
                    type="text"
                    id="assetTypeName"
                    name="name"
                    value={newAssetType.name}
                    onChange={handleAssetTypeInputChange}
                    required
                    placeholder="e.g., Laptop, Monitor, Printer"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="assetTypeDescription">Description</label>
                  <textarea
                    id="assetTypeDescription"
                    name="description"
                    value={newAssetType.description}
                    onChange={handleAssetTypeInputChange}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => {
                      setShowAddAssetTypeModal(false);
                      resetAssetTypeForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="primary-btn"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Asset Type'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDepartmentModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Department</h3>
              <button className="close-btn" onClick={() => {
                setShowAddDepartmentModal(false);
                resetDepartmentForm();
              }}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddDepartment}>
                {departmentError && <div className="error-message">{departmentError}</div>}
                
                <div className="form-group">
                  <label htmlFor="departmentName">Name *</label>
                  <input
                    type="text"
                    id="departmentName"
                    name="name"
                    value={newDepartment.name}
                    onChange={handleDepartmentInputChange}
                    required
                    placeholder="e.g., IT, HR, Finance"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="departmentDescription">Description</label>
                  <textarea
                    id="departmentDescription"
                    name="description"
                    value={newDepartment.description}
                    onChange={handleDepartmentInputChange}
                    placeholder="Optional description"
                    rows={3}
                  />
                </div>
                
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => {
                      setShowAddDepartmentModal(false);
                      resetDepartmentForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="primary-btn"
                    disabled={loading}
                  >
                    {loading ? 'Adding...' : 'Add Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsPage;