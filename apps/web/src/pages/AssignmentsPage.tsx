// apps/web/src/pages/AssignmentsPage.tsx
import React, { useState, useEffect } from "react";
import "../styles/AssignmentsPage.css";
import { useAuth } from "../contexts/AuthContext";
import { formatDate } from "../utils/formatters";
import { getAssets, getUsers } from "../api/apiClient";
import {
  createAssignment,
  deleteAssignment,
  getAssignments,
  updateAssignment,
} from "../api/assignments";
// Will be used in future implementation
// import { createAssignment } from '../api/apiClient';

// Interface for Assignment objects
interface Assignment {
  id: string;
  asset: {
    id: string;
    name: string;
    assetTag: string;
    serialNumber: string;
    type: string;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
  assignedBy: {
    id: string;
    name: string;
    email: string;
  };
  assignmentDate: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  status: string;
  purpose: string;
  notes: string;
}

const AssignmentsPage: React.FC = () => {
  const { user } = useAuth();
  // const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [filter, setFilter] = useState("all");
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: "",
    expectedReturnDate: "",
    purpose: "",
    notes: "",
  });

  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersData, assetsData] = await Promise.all([
          getUsers(), // musisz mieć funkcję `getUsers`
          getAssets(), // musisz mieć funkcję `getAssets`
        ]);
        setUsers(usersData);
        setAssets(assetsData);
      } catch (err) {
        console.error("Failed to load users/assets:", err);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAssignments();
        setAssignments(data as Assignment[]);
      } catch (err) {
        console.error("Failed to load assignments:", err);
        setError("Failed to load assignments. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, []);

  const allAssignments = [...assignments];

  const filteredAssignments = allAssignments.filter((assignment) => {
    const statusMatch = filter === "all" || assignment.status === filter;

    // Filter by search term
    const searchMatch =
      searchTerm === "" ||
      assignment.asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.asset.assetTag
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      assignment.assignedTo.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  // Determine status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "status-active";
      case "overdue":
        return "status-overdue";
      case "scheduled_return":
        return "status-scheduled";
      default:
        return "";
    }
  };

  return (
    <div className="assignments-page">
      <header className="page-header">
        <h1>Asset Assignments</h1>
        <div className="header-actions">
          {user?.role === "admin" && (
            <button
              className="primary-btn"
              onClick={() => setShowAssignModal(true)}
            >
              + New Assignment
            </button>
          )}
        </div>

        {loading && <p>Loading assignments...</p>}
        {error && <p className="error-message">{error}</p>}
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
              {filteredAssignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>
                    <div className="asset-info">
                      <span className="asset-name">
                        {assignment.asset.name}
                      </span>
                      <span className="asset-tag">
                        {assignment.asset.assetTag}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="user-info">
                      <span className="user-name">
                        {assignment.assignedTo.name}
                      </span>
                      <span className="user-department">
                        {assignment.assignedTo.department}
                      </span>
                    </div>
                  </td>
                  <td>{formatDate(new Date(assignment.assignmentDate))}</td>
                  <td>{formatDate(new Date(assignment.expectedReturnDate))}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeClass(assignment.status)}`}
                    >
                      {assignment.status.replace("_", " ")}
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

        {/* New Assignment Modal */}
        {showNewAssignmentModal && (
          <div className="assignment-details-modal">
            <div className="modal-content">
              <h2>Create New Assignment</h2>
              <p className="note">This feature is under development</p>
              <p>In the full implementation, this form would allow you to:</p>
              <ul>
                <li>Select an asset from the available inventory</li>
                <li>Select a user to assign the asset to</li>
                <li>
                  Set assignment details like purpose and expected return date
                </li>
              </ul>
              <div className="modal-actions">
                <button
                  className="secondary-btn"
                  onClick={() => setShowNewAssignmentModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Details Modal */}
        {selectedAssignment && (
          <div className="assignment-details-modal">
            <div className="modal-content">
              <h2>Assignment Details</h2>

              {isEditing ? (
                <>
                  <label>Status:</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="active">Active</option>
                    <option value="scheduled_return">Scheduled Return</option>
                    <option value="overdue">Overdue</option>
                  </select>

                  <label>Expected Return Date:</label>
                  <input
                    type="date"
                    value={editFormData.expectedReturnDate.slice(0, 10)}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        expectedReturnDate: e.target.value,
                      }))
                    }
                  />

                  <label>Purpose:</label>
                  <input
                    type="text"
                    value={editFormData.purpose}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        purpose: e.target.value,
                      }))
                    }
                  />

                  <label>Notes:</label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                  />
                </>
              ) : (
                <div className="assignment-details">
                  <div className="detail-section">
                    <h3>Asset Information</h3>
                    <p>
                      <strong>Name:</strong> {selectedAssignment.asset.name}
                    </p>
                    <p>
                      <strong>Asset Tag:</strong>{" "}
                      {selectedAssignment.asset.assetTag}
                    </p>
                    <p>
                      <strong>Serial Number:</strong>{" "}
                      {selectedAssignment.asset.serialNumber}
                    </p>
                    <p>
                      <strong>Type:</strong> {selectedAssignment.asset.type}
                    </p>
                  </div>

                  <div className="detail-section">
                    <h3>Assignment Information</h3>
                    <p>
                      <strong>Assigned To:</strong>{" "}
                      {selectedAssignment.assignedTo.name}
                    </p>
                    <p>
                      <strong>Department:</strong>{" "}
                      {selectedAssignment.assignedTo.department}
                    </p>
                    <p>
                      <strong>Assigned By:</strong>{" "}
                      {selectedAssignment.assignedBy.name}
                    </p>
                    <p>
                      <strong>Assignment Date:</strong>{" "}
                      {formatDate(new Date(selectedAssignment.assignmentDate))}
                    </p>
                    <p>
                      <strong>Expected Return Date:</strong>{" "}
                      {formatDate(
                        new Date(selectedAssignment.expectedReturnDate)
                      )}
                    </p>
                    <p>
                      <strong>Status:</strong>
                      <span
                        className={`status-badge ${getStatusBadgeClass(selectedAssignment.status)}`}
                      >
                        {selectedAssignment.status.replace("_", " ")}
                      </span>
                    </p>
                  </div>

                  <div className="detail-section">
                    <h3>Additional Information</h3>
                    <p>
                      <strong>Purpose:</strong> {selectedAssignment.purpose}
                    </p>
                    <p>
                      <strong>Notes:</strong> {selectedAssignment.notes}
                    </p>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                {user?.role === "admin" && (
                  <>
                    <button
                      className="secondary-btn"
                      onClick={() => {
                        setIsEditing(true);
                        setEditFormData({
                          status: selectedAssignment.status,
                          expectedReturnDate:
                            selectedAssignment.expectedReturnDate,
                          purpose: selectedAssignment.purpose,
                          notes: selectedAssignment.notes,
                        });
                      }}
                    >
                      Edit Assignment
                    </button>
                    <button
                      className="secondary-btn danger-btn"
                      onClick={async () => {
                        if (!selectedAssignment) return;
                        if (
                          !window.confirm(
                            "Are you sure you want to delete this assignment?"
                          )
                        )
                          return;

                        try {
                          await deleteAssignment(selectedAssignment.id);
                          const updatedAssignments = await getAssignments();
                          setAssignments(updatedAssignments as Assignment[]);
                          setSelectedAssignment(null);
                        } catch (err) {
                          console.error("Delete failed", err);
                          alert("Failed to delete assignment.");
                        }
                      }}
                    >
                      End Assignment
                    </button>
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

      {showAssignModal && (
        <div className="assignment-details-modal">
          <div className="modal-content">
            <h2>Assign Asset to User</h2>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
            >
              <option value="">Select Asset</option>
              {assets.map((asset: any) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.assetTag})
                </option>
              ))}
            </select>

            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select User</option>
              {users.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>

            <button
              className="primary-btn"
              onClick={async () => {
                try {
                  if (!selectedAssetId || !selectedUserId) return;

                  const expectedReturnDate = new Date(
                    Date.now() + 7 * 24 * 3600 * 1000
                  ).toISOString();

                  await createAssignment({
                    assetId: selectedAssetId,
                    userId: selectedUserId,
                    expectedReturnDate,
                    purpose: "Standard issue", // Możesz też dodać pole input do tego
                  });

                  setShowAssignModal(false);

                  // Reload assignments
                  const data = await getAssignments();
                  setAssignments(data);
                } catch (error) {
                  console.error("Error creating assignment:", error);
                  alert("Failed to create assignment.");
                }
              }}
              disabled={!selectedAssetId || !selectedUserId}
            >
              Submit
            </button>
            <button
              className="secondary-btn"
              onClick={() => setShowAssignModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isEditing && (
        <button
          className="primary-btn"
          onClick={async () => {
            try {
              await updateAssignment(selectedAssignment!.id, {
                assetId: selectedAssignment!.asset.id,
                userId: selectedAssignment!.assignedTo.id,
                ...editFormData,
              });
              const updatedAssignments = await getAssignments();
              setAssignments(updatedAssignments as Assignment[]);
              setIsEditing(false);
              setSelectedAssignment(null);
            } catch (err) {
              console.error("Update failed", err);
              alert("Failed to update assignment.");
            }
          }}
        >
          Save Changes
        </button>
      )}
    </div>
  );
};

export default AssignmentsPage;
