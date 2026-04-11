import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import axiosInstance from "../../context/axiosInstance";

const ComplianceReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComplianceReport();
  }, []);

  const fetchComplianceReport = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/reports/compliance");
      setReportData(data);
    } catch (err) {
      console.error("Error fetching compliance report:", err);
      setError("Failed to load compliance report");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Make the API call to download the PDF
      const response = await axiosInstance.get("/reports/compliance/download", {
        responseType: "blob", // Important for handling binary data
      });

      // Check if the response is successful
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Create a blob from the response data
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = "Moline_Matatu_SACCO_Compliance_Report.pdf"; // Use the exact filename as specified
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading PDF:", err);

      // Try to extract error message from response if available
      let errorMessage = "Failed to download PDF. Please try again.";
      if (err.response && err.response.data) {
        try {
          const errorData = JSON.parse(await err.response.data.text());
          errorMessage = errorData.error || errorMessage;
        } catch (parseErr) {
          // If parsing fails, use default message
          console.error("Error parsing error response:", parseErr);
        }
      }

      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Compliance Report</h3>
              </div>
              <div className="card-body">
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <p className="mt-2">Loading compliance report...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Compliance Report</h3>
              </div>
              <div className="card-body">
                <div className="alert alert-danger">
                  <i className="fas fa-exclamation-triangle"></i> {error}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={fetchComplianceReport}
                >
                  <i className="fas fa-refresh"></i> Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper p-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="card-title mb-0">{reportData?.title}</h3>
                  <h5 className="text-muted mb-0">{reportData?.subtitle}</h5>
                </div>
                <button className="btn btn-success" onClick={handleDownloadPDF}>
                  <i className="fas fa-download"></i> Download PDF
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Report Header */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <strong>Reporting Period:</strong>{" "}
                  {reportData?.reportingPeriod}
                </div>
                <div className="col-md-6">
                  <strong>Assessment Result:</strong>{" "}
                  <span
                    className={`badge ${reportData?.assessmentResult === "Partially Compliant" ? "badge-warning" : "badge-success"}`}
                  >
                    {reportData?.assessmentResult}
                  </span>
                </div>
              </div>

              {/* Report Sections */}
              {reportData?.sections?.map((section, index) => (
                <div key={index} className="mb-4">
                  <h4 className="text-primary border-bottom pb-2">
                    {section.title}
                  </h4>
                  <p className="text-justify">{section.content}</p>
                </div>
              ))}

              {/* Approval Section */}
              {reportData?.approval && (
                <div className="mt-5">
                  <h4 className="text-primary border-bottom pb-2">Approval</h4>
                  <div className="row">
                    <div className="col-md-4">
                      <strong>Prepared By:</strong>
                      <br />
                      {reportData.approval.preparedBy}
                    </div>
                    <div className="col-md-4">
                      <strong>Reviewed By:</strong>
                      <br />
                      {reportData.approval.reviewedBy}
                    </div>
                    <div className="col-md-4">
                      <strong>Approved By:</strong>
                      <br />
                      {reportData.approval.approvedBy}
                    </div>
                  </div>
                  <div className="mt-3">
                    <strong>Date:</strong> {reportData.approval.date}
                  </div>
                </div>
              )}
            </div>
            <div className="card-footer">
              <button
                className="btn btn-success float-right"
                onClick={handleDownloadPDF}
              >
                <i className="fas fa-download"></i> Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceReport;
