import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import axiosInstance from "../../../context/axiosInstance";

const fetchUserData = async (matatuId = null) => {
  try {
    const params = matatuId ? { matatu_id: matatuId } : {};
    const response = await axiosInstance.get("/finance/userFinance", {
      params,
    });

    if (response.status !== 200) {
      throw new Error("Failed to fetch user data");
    }
    return response.data || {};
  } catch (error) {
    console.error("Error fetching user data:", error);
    return {};
  }
};

const fetchMatatus = async () => {
  try {
    const response = await axiosInstance.get("/matatus/userMatatus");

    if (response.status !== 200) {
      throw new Error("Failed to fetch user matatus");
    }
    // Ensure we always return an array
    const data = response.data || [];
    console.log("Matatu data", data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching user matatus:", error);
    return [];
  }
};

const fetchPendingLoans = async () => {
  try {
    // Fetch active loans (includes pending and approved/outstanding)
    const response = await axiosInstance.get("/finance/activeLoans");

    if (response.status !== 200) {
      throw new Error("Failed to fetch active loans");
    }
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("Error fetching active/pending loans:", error);
    return [];
  }
};

const fetchUsers = async () => {
  try {
    const response = await axiosInstance.get("/users");
    if (response.status !== 200) {
      throw new Error("Failed to fetch users");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

const fetchCurrentUser = async () => {
  try {
    const response = await axiosInstance.get("/users/userDetails");
    if (response.status !== 200)
      throw new Error("Failed to fetch current user");
    return response.data || {};
  } catch (error) {
    console.error("Error fetching current user:", error);
    return {};
  }
};

const fetchUserSummary = async () => {
  try {
    const response = await axiosInstance.get("/finance/userSummary");
    if (response.status !== 200) {
      throw new Error("Failed to fetch user summary");
    }
    return response.data.summary || {};
  } catch (error) {
    console.error("Error fetching user summary:", error);
    return {};
  }
};

function LoanApplication() {
  const [userData, setUserData] = useState(null);
  const [matatus, setMatatus] = useState([]);
  const [loanType, setLoanType] = useState(null);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedMatatu, setSelectedMatatu] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedGuarantors, setSelectedGuarantors] = useState([]);
  const [guarantorStaffInput, setGuarantorStaffInput] = useState("");
  const [repaymentMonths, setRepaymentMonths] = useState(1);
  const [guarantorPreview, setGuarantorPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSummary, setUserSummary] = useState(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      try {
        const [mats, pending, usrs, cu, summary] = await Promise.all([
          fetchMatatus(),
          fetchPendingLoans(),
          fetchUsers(),
          fetchCurrentUser(),
          fetchUserSummary(),
        ]);

        if (!mounted) return;
        setMatatus(Array.isArray(mats) ? mats : []);
        setPendingLoans(Array.isArray(pending) ? pending : []);
        setUsers(Array.isArray(usrs) ? usrs : []);
        setCurrentUser(cu || {});
        setUserSummary(summary || {});

        // Fetch user data with matatu_id if available
        const matatuId =
          Array.isArray(mats) && mats.length > 0 ? mats[0].matatu_id : null;
        const ud = await fetchUserData(matatuId);
        if (!mounted) return;
        setUserData(ud || {});
      } catch (err) {
        console.error("Error initializing loan page:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Refetch data when page becomes visible (e.g., after admin approval)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          const [pending, summary] = await Promise.all([
            fetchPendingLoans(),
            fetchUserSummary(),
          ]);
          setPendingLoans(Array.isArray(pending) ? pending : []);
          setUserSummary(summary || {});
        } catch (err) {
          console.error("Error refetching on visibility change:", err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Debounced lookup: when a staff number is typed, attempt to resolve the user
  React.useEffect(() => {
    if (!guarantorStaffInput || guarantorStaffInput.trim() === "") {
      setGuarantorPreview(null);
      setPreviewError(null);
      setIsPreviewLoading(false);
      return;
    }

    let cancelled = false;
    const id = setTimeout(async () => {
      setIsPreviewLoading(true);
      setPreviewError(null);
      try {
        const staff = guarantorStaffInput.trim();
        const resp = await axiosInstance.get(
          `/users/by-staff/${encodeURIComponent(staff)}`,
        );
        if (cancelled) return;
        if (resp && resp.status === 200 && resp.data) {
          setGuarantorPreview(resp.data);
        } else {
          setGuarantorPreview(null);
          setPreviewError("Guarantor not found");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Staff lookup error:", err);
        setGuarantorPreview(null);
        setPreviewError("Guarantor not found");
      } finally {
        if (!cancelled) setIsPreviewLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [guarantorStaffInput]);

  const handleApplyLoan = (matatu_id, type) => {
    const foundMatatu =
      matatus.find((matatu) => matatu.matatu_id === matatu_id) || null;

    // Normal loans require a registered vehicle selection. We do not block
    // multiple normal loan applications here; amount validation happens on submit.
    if (type === "normal") {
      if (!foundMatatu) {
        Swal.fire({
          icon: "error",
          title: "Unable to Apply",
          text: "Selected vehicle not found. Please select a registered vehicle.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        return;
      }
    }

    setSelectedMatatu(foundMatatu);
    setLoanType(type);
    // default repayment months depending on loan type
    setRepaymentMonths(type === "emergency" ? 1 : 1);
    setShowModal(true);
  };

  const handleGuarantorSearch = (event) => {
    const query = event.target.value.toLowerCase();
    const filtered = users.filter(
      (user) =>
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query),
    );
    setFilteredUsers(filtered);
  };

  const handleGuarantorSelect = (event) => {
    const selectedOptions = Array.from(event.target.selectedOptions).map(
      (option) => ({
        user_id: option.value,
        name: option.text,
      }),
    );
    setSelectedGuarantors((prev) => [...prev, ...selectedOptions]);
  };

  const handleAddGuarantorByStaff = async () => {
    const staff = (guarantorStaffInput || "").trim();
    if (!staff)
      return Swal.fire({
        icon: "error",
        title: "Error",
        text: "Enter a guarantor staff number",
      });

    // Prefer the previewed user (from debounced lookup) to avoid duplicate fetch
    const user =
      guarantorPreview &&
      (guarantorPreview.staff_number === staff ||
        String(guarantorPreview.user_id) === staff)
        ? guarantorPreview
        : null;

    if (!user)
      return Swal.fire({
        icon: "error",
        title: "Not found",
        text: "Guarantor not found",
      });
    if (currentUser && user.user_id === currentUser.user_id) {
      return Swal.fire({
        icon: "error",
        title: "Invalid",
        text: "You cannot nominate yourself as guarantor",
      });
    }
    if (
      selectedGuarantors.some((g) => Number(g.user_id) === Number(user.user_id))
    ) {
      return Swal.fire({
        icon: "info",
        title: "Already added",
        text: "This guarantor is already selected",
      });
    }
    // Fetch guarantor's matatus to calculate their total savings
    let guarantorSavings = 0;
    try {
      const resp = await axiosInstance.get(
        `/matatus/userMatatus/${user.user_id}`,
      );
      if (resp && resp.status === 200 && Array.isArray(resp.data)) {
        guarantorSavings = resp.data.reduce(
          (acc, m) => acc + Number(m.total_savings || 0),
          0,
        );
      }
    } catch (err) {
      console.warn("Could not fetch guarantor matatus for savings:", err);
      guarantorSavings = 0;
    }

    setSelectedGuarantors((prev) => [
      ...prev,
      {
        user_id: user.user_id,
        name: `${user.first_name} ${user.last_name}`,
        staff_number: user.staff_number || staff,
        total_savings: guarantorSavings,
      },
    ]);
    setGuarantorStaffInput("");
    setGuarantorPreview(null);
  };

  const handleRemoveGuarantor = (userId) => {
    setSelectedGuarantors((prev) =>
      prev.filter((g) => Number(g.user_id) !== Number(userId)),
    );
  };

  const handleSubmitApplication = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    formData.append("loanType", loanType);
    formData.append("repaymentMonths", repaymentMonths);
    const loanAmount = parseFloat(formData.get("loanAmount"));
    console.log("Submitting loan application with data:", {
      loanType,
      loanAmount,
      selectedMatatu,
      selectedGuarantors,
    });
    if (loanAmount <= 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid Loan Amount",
        text: "The loan amount must be greater than zero.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    // Frontend: ensure user's own savings exist and cover the requested amount
    const applicantSavings = Number(userData?.savings || 0);
    const hasSavingsRecord =
      userData &&
      typeof userData.savings !== "undefined" &&
      userData.savings !== null;
    if (!hasSavingsRecord) {
      Swal.fire({
        icon: "error",
        title: "Insufficient Savings",
        text: "Loan amount cannot be greater than your savings balance.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }
    if (loanAmount > applicantSavings) {
      Swal.fire({
        icon: "error",
        title: "Invalid Loan Amount",
        text: "Loan amount cannot be greater than your savings balance.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    if (loanType === "normal") {
      // Normal loans: ensure vehicle is selected and the requested amount
      // does not exceed the vehicle's savings balance.
      formData.append("matatu_id", selectedMatatu.matatu_id);
      const savings = Number(selectedMatatu?.total_savings || 0);
      if (loanAmount > savings) {
        Swal.fire({
          icon: "error",
          title: "Invalid Loan Amount",
          text: "The loan amount cannot exceed the savings balance.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        return;
      }
    } else {
      const EMERGENCY_CAP = 30000;
      if (loanAmount > EMERGENCY_CAP) {
        Swal.fire({
          icon: "error",
          title: "Invalid Loan Amount",
          text: `The loan amount for an emergency loan cannot exceed KES ${EMERGENCY_CAP}.`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        return;
      }

      // Emergency loans require at least one guarantor
      if (
        !Array.isArray(selectedGuarantors) ||
        selectedGuarantors.length === 0
      ) {
        Swal.fire({
          icon: "error",
          title: "Missing Guarantor",
          text: "Emergency loans require at least one guarantor. Please add a guarantor before submitting.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4000,
        });
        return;
      }

      // Combined savings check: applicant savings + sum(guarantors savings) >= requested amount
      const applicantSavings = Number(userData?.savings || 0);
      const guarantorsSavings = selectedGuarantors.reduce(
        (acc, g) => acc + Number(g.total_savings || 0),
        0,
      );

      if (applicantSavings + guarantorsSavings < loanAmount) {
        Swal.fire({
          icon: "error",
          title: "Insufficient Combined Savings",
          text: `Applicant + guarantor(s) combined savings must be at least KES ${loanAmount}. You have KES ${applicantSavings + guarantorsSavings} available.`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 4500,
        });
        return;
      }

      const guarantorIds = selectedGuarantors.map(
        (guarantor) => guarantor.user_id,
      );
      formData.append("guarantors", JSON.stringify(guarantorIds));
    }

    // Client-side validation: repaymentMonths must be within allowed range
    const months = Number(repaymentMonths || 0);
    if (loanType === "emergency" && (months < 1 || months > 3)) {
      return Swal.fire({
        icon: "error",
        title: "Invalid repayment months",
        text: "Emergency loans allow 1-3 months repayment",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
    if (loanType === "normal" && (months < 1 || months > 6)) {
      return Swal.fire({
        icon: "error",
        title: "Invalid repayment months",
        text: "Normal loans allow 1-6 months repayment",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }

    try {
      const response = await axiosInstance.post("/finance/applyLoan", formData);
      if (response.status >= 200 && response.status < 300) {
        Swal.fire({
          icon: "success",
          title: "Application Submitted",
          text: "Your loan application has been submitted successfully.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });

        fetchUserData().then((data) => setUserData(data));
        fetchPendingLoans().then((loans) => setPendingLoans(loans));
        fetchUserSummary().then((summary) => setUserSummary(summary || {}));
        setShowModal(false);
        setLoanType(null);
        setSelectedMatatu(null);
      } else {
        throw new Error("Failed to apply for loan");
      }
    } catch (error) {
      console.error("Error applying for loan:", error);
      // Try to surface a server-provided message when available
      let message =
        "An error occurred while submitting your loan application. Please try again later.";
      if (error && error.response && error.response.data) {
        const data = error.response.data;
        message = data.error || data.message || JSON.stringify(data) || message;
      } else if (error && error.message) {
        message = error.message;
      }
      Swal.fire({
        icon: "error",
        title: "Application Failed",
        text: message,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
      });
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  const { shareCapitalPaid, isFullyRegistered } = userData;
  const maxEmergencyLoan = 30000;

  return (
    <div className="page-content">
      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card-header">
                <h3 className="card-title">Matatu</h3>
              </div>
            </div>
            <div className="card-body">
              <div className="user-info mb-3">
                {matatus.length === 0 ? (
                  <div className="alert alert-info">
                    You have no registered vehicles yet. Register a vehicle to
                    apply for loans.
                    <div className="mt-2">
                      <Link
                        to="/users/addVehicle"
                        className="btn btn-sm btn-primary"
                      >
                        Register Vehicle
                      </Link>
                    </div>
                  </div>
                ) : (
                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        <th>Number Plate</th>
                        <th>Savings</th>
                        <th>Loan</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matatus.map((data) => {
                        return (
                          <tr key={data.matatu_id}>
                            <td>{data.number_plate}</td>
                            <td>{data.total_savings}</td>
                            <td>{data.loan}</td>
                            <td>
                              <button
                                onClick={() =>
                                  handleApplyLoan(data.matatu_id, "normal")
                                }
                                className="btn btn-primary mr-2"
                                style={{
                                  cursor:
                                    Number(data.total_savings || 0) === 0
                                      ? "not-allowed"
                                      : "pointer",
                                }}
                                disabled={Number(data.total_savings || 0) === 0}
                              >
                                Apply for Loan
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Loan Application</h3>
                </div>
                <div className="card-body">
                  <div className="user-info mb-3">
                    <p>
                      <strong>Eligible for Emergency Loan:</strong> KES{" "}
                      {userSummary?.eligibleEmergencyLoanAmount ||
                        maxEmergencyLoan}
                    </p>
                    <p>
                      <strong>Approved Emergency Loan Total:</strong> KES{" "}
                      {userSummary?.totalApprovedEmergencyLoan || 0}
                    </p>
                    <p>
                      <strong>Total Savings:</strong> KES{" "}
                      {userSummary?.totalSavings || 0}
                    </p>
                    <p className="small text-muted mb-0">
                      Emergency loans are independent from normal loans. You may
                      apply for an emergency loan (requires guarantor, up to KES
                      30,000) and still apply for a normal loan for a registered
                      vehicle.
                    </p>
                  </div>
                  <div className="loan-buttons mb-3">
                    <button
                      onClick={() => handleApplyLoan(null, "emergency")}
                      className="btn btn-primary"
                    >
                      Apply for Emergency Loan
                    </button>
                  </div>
                  {pendingLoans.length > 0 && (
                    <div className="pending-loans mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4>Loan Applications</h4>
                        <button
                          onClick={async () => {
                            setLoading(true);
                            try {
                              const [loans, summary] = await Promise.all([
                                fetchPendingLoans(),
                                fetchUserSummary(),
                              ]);
                              setPendingLoans(
                                Array.isArray(loans) ? loans : [],
                              );
                              setUserSummary(summary || {});
                            } catch (err) {
                              console.error(
                                "Error refreshing loans and summary:",
                                err,
                              );
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="btn btn-sm btn-outline-primary"
                          disabled={loading}
                        >
                          {loading ? "Refreshing..." : "Refresh"}
                        </button>
                      </div>
                      <ul className="list-group">
                        {pendingLoans.map((loan) => (
                          <li key={loan.loan_id} className="list-group-item">
                            <strong>Loan Type:</strong> {loan.loan_type}
                            <br />
                            <strong>Amount:</strong> KES {loan.amount_applied}
                            <br />
                            <strong>Status:</strong>{" "}
                            {(() => {
                              if (loan.status)
                                return (
                                  loan.status.charAt(0).toUpperCase() +
                                  loan.status.slice(1)
                                );
                              if (Number(loan.amount_issued) === 0)
                                return "Pending Approval";
                              if (Number(loan.amount_due) > 0)
                                return "Approved";
                              return "Unknown";
                            })()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Loan Application Form</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitApplication}>
            <Form.Group controlId="loanAmount">
              <Form.Label>Loan Amount</Form.Label>
              <Form.Control type="number" name="loanAmount" required />
            </Form.Group>
            {loanType === "normal" && (
              <Form.Group controlId="matatuId">
                <Form.Label>Matatu</Form.Label>
                <Form.Control
                  type="text"
                  readOnly
                  value={selectedMatatu?.number_plate || ""}
                />
              </Form.Group>
            )}
            {loanType === "emergency" && (
              <>
                <Form.Group controlId="guarantorStaffNumber">
                  <Form.Label>Guarantor Staff Number</Form.Label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Form.Control
                      type="text"
                      placeholder="Enter guarantor staff number (e.g., STF000123)"
                      value={guarantorStaffInput}
                      onChange={(e) => setGuarantorStaffInput(e.target.value)}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleAddGuarantorByStaff}
                      disabled={isPreviewLoading || !guarantorPreview}
                    >
                      Add
                    </Button>
                  </div>
                  {isPreviewLoading ? (
                    <div className="mt-2">
                      <small>Looking up staff number...</small>
                    </div>
                  ) : guarantorPreview ? (
                    <div className="mt-2 alert alert-secondary py-1">
                      {guarantorPreview.first_name} {guarantorPreview.last_name}{" "}
                      (
                      {guarantorPreview.staff_number ||
                        `STF${String(guarantorPreview.user_id).padStart(6, "0")}`}
                      )
                    </div>
                  ) : previewError && guarantorStaffInput.trim() !== "" ? (
                    <div className="mt-2 text-danger small">{previewError}</div>
                  ) : null}
                </Form.Group>
                <div>
                  <h5>Selected Guarantors:</h5>
                  <ul>
                    {selectedGuarantors.map((guarantor) => (
                      <li key={guarantor.user_id} style={{ marginBottom: 6 }}>
                        {guarantor.name} ({guarantor.staff_number || "—"}){" "}
                        <small className="text-muted">
                          - Savings: KES {guarantor.total_savings || 0}
                        </small>
                        <Button
                          variant="link"
                          onClick={() =>
                            handleRemoveGuarantor(guarantor.user_id)
                          }
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            {loanType && (
              <Form.Group controlId="repaymentMonths" className="mt-2">
                <Form.Label>Repayment Months</Form.Label>
                <Form.Control
                  as="select"
                  value={repaymentMonths}
                  onChange={(e) => setRepaymentMonths(Number(e.target.value))}
                >
                  {(loanType === "emergency"
                    ? [1, 2, 3]
                    : [1, 2, 3, 4, 5, 6]
                  ).map((m) => (
                    <option key={m} value={m}>
                      {m} month{m > 1 ? "s" : ""}
                    </option>
                  ))}
                </Form.Control>
                <small className="text-muted">
                  Select repayment period (monthly)
                </small>
              </Form.Group>
            )}

            <Button variant="primary" type="submit">
              Submit Application
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default LoanApplication;
