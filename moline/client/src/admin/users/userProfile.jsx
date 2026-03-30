import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import axiosInstance from "../../context/axiosInstance";
import { format } from "date-fns";

function UserDetails() {
  const { userId } = useParams();
  const [user, setUser] = useState({});
  const [matatus, setMatatus] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [totalLoans, setTotalLoans] = useState(0);
  const [currentTab, setCurrentTab] = useState("home");

  useEffect(() => {
    fetchUserDetails();
    fetchMatatuDetails();
  }, []);

  useEffect(() => {
    const savings = matatus.reduce((sum, m) => sum + (m.savings || 0), 0);
    const loans = matatus.reduce((sum, m) => sum + (m.loan || 0), 0);
    setTotalSavings(savings);
    setTotalLoans(loans);
  }, [matatus]);

  const fetchUserDetails = async () => {
    try {
      const { data } = await axiosInstance.get(`/users/${userId}`);
      setUser(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMatatuDetails = async () => {
    try {
      const { data } = await axiosInstance.get(
        `/matatus/userMatatus/${userId}`
      );
      setMatatus(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get("/roles");
      const roles = await response.data;
      setRoles(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const calculateTotals = (matatus) => {
    let savings = 0;
    let loans = 0;
    matatus.forEach((matatu) => {
      savings += matatu.savings;
      loans += matatu.loan;
    });
    setTotalSavings(savings);
    setTotalLoans(loans);
  };

  const handleEditUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Edit User Details",
      html:
        `<input id="swal-input1" class="swal2-input" placeholder="First Name" value="${user.first_name}" />` +
        `<input id="swal-input2" class="swal2-input" placeholder="Last Name" value="${user.last_name}" />` +
        `<input id="swal-input3" class="swal2-input" placeholder="Email" value="${user.email}" />` +
        `<input id="swal-input4" class="swal2-input" placeholder="Phone" value="${user.phone}" />`,
      focusConfirm: false,
      preConfirm: () => {
        return [
          document.getElementById("swal-input1").value,
          document.getElementById("swal-input2").value,
          document.getElementById("swal-input3").value,
          document.getElementById("swal-input4").value,
        ];
      },
    });

    if (formValues) {
      const [firstName, lastName, email, phone] = formValues;
      try {
        await axiosInstance.put(`/users/${userId}/update`, {
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
        });
        setUser({
          ...user,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
        });
        Swal.fire("Updated!", "User details have been updated.", "success");
      } catch (error) {
        Swal.fire("Error", "Failed to update user details.", "error");
      }
    }
  };

  const handleEditRole = async () => {
    const { value: selectedRole } = await Swal.fire({
      title: "Edit User Role",
      input: "select",
      inputOptions: roles.reduce((acc, role) => {
        acc[role.id] = role.name;
        return acc;
      }, {}),
      inputPlaceholder: "Select a role",
      showCancelButton: true,
    });

    if (selectedRole) {
      try {
        await axiosInstance.put(`/users/${userId}/role`, {
          role_id: selectedRole,
        });
        setUser({
          ...user,
          role: roles.find((role) => role.id === selectedRole).name,
        });
        Swal.fire("Updated!", "User role has been updated.", "success");
      } catch (error) {
        Swal.fire("Error", "Failed to update user role.", "error");
      }
    }
  };

  const handleEditStatus = async () => {
    const { value: status } = await Swal.fire({
      title: "Edit User Status",
      input: "select",
      inputOptions: {
        pending: "pending",
        Approved: "Approved",
        Disapproved: "Disapproved",
      },
      inputPlaceholder: "Select a status",
      showCancelButton: true,
    });

    if (status) {
      try {
        await axiosInstance.put(`/users/${userId}/status`, { status });
        setUser({ ...user, status });
        Swal.fire("Updated!", "User status has been updated.", "success");
      } catch (error) {
        Swal.fire("Error", "Failed to update user status.", "error");
      }
    }
  };

  const handleResetProfile = async () => {
    try {
      await axiosInstance.put(`/users/${userId}/reset`);
      Swal.fire("Reset!", "User profile has been reset.", "success");
    } catch (error) {
      Swal.fire("Error", "Failed to reset user profile.", "error");
    }
  };

  const handleDeleteUser = async () => {
    const confirmation = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/users/${userId}/delete`);
      if (response.status >= 200 && response.status < 300) {
        Swal.fire({
          icon: "success",
          title: "User Deleted",
          text: "User account has been deleted successfully.",
          toast: true,
          position: "top-end",
          showConfirmButton: true,
          timer: 3000,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete the user account.",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting the user account. Please try again later.",
      });
    }
  };

  const handleEmailUser = async () => {
    const { value: emailContent } = await Swal.fire({
      title: "Email User",
      input: "textarea",
      inputPlaceholder: "Type your message here...",
      showCancelButton: true,
    });

    if (emailContent) {
      try {
        await axiosInstance.post(`/users/${userId}/email`, {
          content: emailContent,
        });
        Swal.fire("Sent!", "Email has been sent to the user.", "success");
      } catch (error) {
        Swal.fire("Error", "Failed to send email.", "error");
      }
    }
  };

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid">
          <form>
            <div className="row">
              {/* Profile image & header */}
              <div className="col-md-4 text-center">
                <FontAwesomeIcon icon={faUser} size="5x" className="my-4" />
              </div>
              <div className="col-md-6">
                <h5>
                  {user.first_name} {user.last_name}
                </h5>
                <h6>{user.roles}</h6>
                <p>
                  Status: <strong>{user.status}</strong>
                </p>

                {/* Nav tabs */}
                <ul className="nav nav-tabs" role="tablist">
                  {["home", "matatus", "savings", "loans"].map((tab) => (
                    <li className="nav-item" key={tab}>
                      <a
                        href="#!"
                        className={`nav-link ${
                          currentTab === tab ? "active" : ""
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentTab(tab);
                        }}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-md-2 d-flex align-items-start justify-content-end">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleEditUser}
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="row mt-4">
              <div className="col-md-4">
                <p>
                  Total Savings: <strong>KES {totalSavings}</strong>
                </p>
                <p>
                  Total Loans: <strong>KES {totalLoans}</strong>
                </p>
              </div>
              <div className="col-md-8">
                <div className="tab-content profile-tab" id="myTabContent">
                  {/* About */}
                  <div
                    className={
                      currentTab === "home"
                        ? "tab-pane fade show active"
                        : "tab-pane fade"
                    }
                  >
                    <div className="row">
                      {[
                        ["Name", `${user.first_name} ${user.last_name}`],
                        ["Email", user.email],
                        ["Phone", user.phone],
                        ["Role", user.roles],
                        ["Gender", user.gender],
                        ["Address", user.address],
                      ].map(([label, value]) => (
                        <React.Fragment key={label}>
                          <div className="col-md-6">
                            <label>{label}</label>
                          </div>
                          <div className="col-md-6">
                            <p>{value}</p>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Matatus */}
                  <div
                    className={
                      currentTab === "matatus"
                        ? "tab-pane fade show active"
                        : "tab-pane fade"
                    }
                  >
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Plate Number</th>
                          <th>Status</th>
                          <th>Savings</th>
                          <th>Loan</th>
                          <th>Insurance Expiry</th>
                          <th>Driver</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matatus.map((m) => (
                          <tr key={m.id}>
                            <td>{m.number_plate}</td>
                            <td>{m.status}</td>
                            <td>{m.savings}</td>
                            <td>{m.loan}</td>
                            <td>
                              {format(
                                new Date(m.insurance_expiry),
                                "yyyy-MM-dd"
                              )}
                            </td>
                            <td>
                              {m.driver_first_name
                                ? `${m.driver_first_name} ${m.driver_last_name}`
                                : "Not Assigned"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Savings */}
                  <div
                    className={
                      currentTab === "savings"
                        ? "tab-pane fade show active"
                        : "tab-pane fade"
                    }
                  >
                    <p>
                      Total Savings: <strong>KES {totalSavings}</strong>
                    </p>
                  </div>

                  {/* Loans */}
                  <div
                    className={
                      currentTab === "loans"
                        ? "tab-pane fade show active"
                        : "tab-pane fade"
                    }
                  >
                    <p>
                      Total Loans: <strong>KES {totalLoans}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions row */}
            <div className="row mt-4">
              <div className="col-md-2">
                <button
                  className="btn btn-secondary w-100"
                  onClick={handleEditRole}
                >
                  Edit Role
                </button>
              </div>
              <div className="col-md-2">
                <button
                  className="btn btn-secondary w-100"
                  onClick={handleEditStatus}
                >
                  Edit Status
                </button>
              </div>
              <div className="col-md-2">
                <button
                  className="btn btn-secondary w-100"
                  onClick={handleResetProfile}
                >
                  Reset Profile
                </button>
              </div>
              <div className="col-md-2">
                <button
                  className="btn btn-secondary w-100"
                  onClick={handleDeleteUser}
                >
                  Delete User
                </button>
              </div>
              <div className="col-md-2">
                <button
                  className="btn btn-secondary w-100"
                  onClick={handleEmailUser}
                >
                  Email User
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default UserDetails;
