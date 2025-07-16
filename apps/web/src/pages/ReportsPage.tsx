import React, { useEffect, useState } from "react";
import "../styles/ReportsPage.css";
import { useAuth } from "../contexts/AuthContext";
import {
  generateReport,
  downloadReport,
  listUserReports,
  LisUserReportsResponse,
} from "../api/reports";

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  // const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedType, setSelectedType] = useState("warranty");
  const [isGenerating, setIsGenerating] = useState(false);
  const [filter, setFilter] = useState("all");

  const [userReports, setUserReports] = useState<LisUserReportsResponse[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user?.id) return;
      try {
        const response = await listUserReports(user.id);
        console.log("USER REPORTS: ", response);

        setUserReports(response);
      } catch (error) {
        console.error("Failed to fetch user reports", error);
      }
    };

    fetchReports();
  }, [user]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Determine status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "status-completed";
      case "scheduled":
        return "status-scheduled";
      case "in_progress":
        return "status-in-progress";
      default:
        return "";
    }
  };

  const handleGenerateReport = async () => {
    if (!user?.id || !selectedType) return;

    try {
      setIsGenerating(true);
      await generateReport(user.id, selectedType);

      const res = await listUserReports(user.id);
      setUserReports(res);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to generate report", err);
      alert("Error generating report");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (file: string) => {
    if (!user?.id || !file) return;
    try {
      await downloadReport(user.id, file);
    } catch (err) {
      console.error("Failed to download report", err);
      alert("Error downloading report");
    }
  };

  return (
    <div className="reports-page">
      <header className="page-header">
        <h1>Reports</h1>
        <div className="header-actions">
          {user?.role === "admin" && (
            <button
              className="primary-btn"
              onClick={() => setShowCreateModal(true)}
            >
              + Create New Report
            </button>
          )}
        </div>
      </header>

      <div className="reports-content">
        <div className="reports-controls">
          <div className="filter-section">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select
              id="status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Reports</option>
              {/* <option value="completed">Completed</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option> */}
            </select>
          </div>
          {/* <input
            type="text"
            placeholder="Search reports..."
            className="search-input"
          /> */}
        </div>

        <div className="reports-grid">
          {userReports.map((report) => (
            <div key={report.file} className="report-card">
              <div className="report-card-header">
                <h3>{report.file}</h3>
                {/* <span
                  className={`status-badge ${getStatusBadgeClass(report.status)}`}
                >
                  {report.status}
                </span> */}
              </div>
              <div className="report-card-body">
                <p className="report-description">{report.downloadUrl}</p>
                {/* <div className="report-details">
                  <div className="report-detail">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{report.type}</span>
                  </div>
                  <div className="report-detail">
                    <span className="detail-label">Frequency:</span>
                    <span className="detail-value">{report.frequency}</span>
                  </div>
                  <div className="report-detail">
                    <span className="detail-label">Last Generated:</span>
                    <span className="detail-value">
                      {formatDate(report.lastGenerated)}
                    </span>
                  </div>
                  <div className="report-detail">
                    <span className="detail-label">Generated By:</span>
                    <span className="detail-value">{report.generatedBy}</span>
                  </div>
                </div> */}
              </div>
              <div className="report-card-actions">
                <button
                  className="action-btn"
                  onClick={() => setSelectedReport(report)}
                >
                  View Details
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => handleDownloadReport(report.file)}
                >
                  Download Report
                </button>
                {/* {user?.role === "admin" && (
                  <button
                    className="secondary-btn"
                    onClick={handleDownloadReport}
                  >
                    Generate Now
                  </button>
                )} */}
              </div>
            </div>
          ))}
        </div>

        {selectedReport && (
          <div className="report-details-modal">
            <div className="modal-content">
              <h2>Report Details: {selectedReport.name}</h2>
              <div className="report-modal-details">
                <div className="detail-section">
                  <h3>Report Information</h3>
                  <p>
                    <strong>Name:</strong> {selectedReport.name}
                  </p>
                  <p>
                    <strong>Description:</strong> {selectedReport.description}
                  </p>
                  <p>
                    <strong>Type:</strong> {selectedReport.type}
                  </p>
                </div>
                <div className="detail-section">
                  <h3>Generation Details</h3>
                  <p>
                    <strong>Frequency:</strong> {selectedReport.frequency}
                  </p>
                  <p>
                    <strong>Last Generated:</strong>{" "}
                    {formatDate(selectedReport.lastGenerated)}
                  </p>
                  <p>
                    <strong>Generated By:</strong> {selectedReport.generatedBy}
                  </p>
                  <p>
                    <strong>Status:</strong>
                    <span
                      className={`status-badge ${getStatusBadgeClass(selectedReport.status)}`}
                    >
                      {selectedReport.status}
                    </span>
                  </p>
                </div>
              </div>
              <div className="modal-actions">
                <button className="primary-btn">Download Report</button>
                <button
                  className="secondary-btn"
                  onClick={() => setSelectedReport(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreateModal && (
          <div className="add-department-modal">
            <div className="modal-content">
              <h2>Create New Report</h2>
              <div className="form-group">
                <label htmlFor="reportType">Select Report Type:</label>
                <select
                  id="reportType"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="warranty">Warranty Expiration</option>
                  <option value="inventory">Asset Inventory</option>
                  <option value="department">Department</option>
                  <option value="user_assignment">User Assignment</option>
                  <option value="utilization">Asset Utilization</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  className="secondary-btn"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  className="primary-btn"
                  disabled={isGenerating}
                  onClick={handleGenerateReport}
                >
                  {isGenerating ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
