import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import AdvanceSalaryModal from "./AdvanceSalaryModal";
import Swal from "sweetalert2";
import {
  fetchSalary,
  fetchUserPosition,
  fetchStaffDetails,
  fetchSalaryAdvanceApplications,
  applyForAdvanceSalary,
  paySalary,
} from "./components/staffManagement";

const SalaryManagement = () => {
  const [staffDetails, setStaffDetails] = useState([]);
  const [salaryAdvanceApplications, setSalaryAdvanceApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [position, setPosition] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [salary, setSalary] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const userPosition = await fetchUserPosition();
        const userSalary = await fetchSalary();
        const staffDetailsData = await fetchStaffDetails();
        const salaryApplications = await fetchSalaryAdvanceApplications();

        setPosition(userPosition);
        setSalary(userSalary);
        setAdvanceAmount(userSalary / 2);
        setStaffDetails(staffDetailsData);
        setSalaryAdvanceApplications(salaryApplications);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    initializeData();
  }, []);

  const handleApply = async (event) => {
    event.preventDefault();
    try {
      if (!advanceAmount) {
        throw new Error("Advance amount is required");
      }

      const data = await applyForAdvanceSalary({
        amount: advanceAmount,
        userId,
      });

      Swal.fire({
        icon: "success",
        title: "Success",
        text: data.message || "Advance salary application submitted successfully",
        timer: 3000,
        timerProgressBar: true,
        onClose: () => setShowModal(false),
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while applying for advance salary",
      });
    }
  };

  const handlePaySalary = async () => {
    try {
      const result = await paySalary(staffDetails);

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Salaries Paid",
          text: result.message,
          showConfirmButton: true,
        });

        // Update the UI to reflect the salaries have been paid
        const updatedStaffDetails = staffDetails.map((staff) => ({
          ...staff,
          salaryPaid: true, // Adding a flag for indicating payment status
        }));
        setStaffDetails(updatedStaffDetails);

        // Optional: Trigger receipt printing
        console.log("Receipt:", result.receipt);
        // Implement your printing logic here if required
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Payment Error",
        text: error.message || "Failed to pay salaries",
      });
    }
  };

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="content-wrapper">
      <div className="container mt-5">
        <h2 className="text-center mb-4">Salary Management</h2>
  
        {position === "chairman" && (
          <>
            <div className="table-responsive mb-5">
              <h3 className="text-center mb-3">All Staff Details</h3>
              <table className="table table-bordered table-hover">
                <thead className="thead-light">
                  <tr>
                    <th>Name</th>
                    <th>Position</th>
                    <th>Salary</th>
                    <th>NHIF Number</th>
                    <th>Bank Name</th>
                    <th>Account Number</th>
                    <th>Pay Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {staffDetails.map((staff) => (
                    <tr key={staff.user_id}>
                      <td>{staff.user_id}</td>
                      <td>{staff.position}</td>
                      <td>{staff.salary}</td>
                      <td>{staff.nhif_number}</td>
                      <td>{staff.bank_name}</td>
                      <td>{staff.bank_account_number}</td>
                      <td>
                        <button
                          onClick={handlePaySalary}
                          className="btn btn-primary btn-sm"
                        >
                          Pay Salary
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
  
            <div className="table-responsive mb-5">
              <h3 className="text-center mb-3">Salary Advance Applications</h3>
              <table className="table table-bordered table-hover">
                <thead className="thead-light">
                  <tr>
                    <th>Expense Type</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryAdvanceApplications.map((application) => (
                    <tr key={application.expense_id}>
                      <td>{application.expense_type}</td>
                      <td>{application.amount}</td>
                      <td>{format(new Date(application.date), "yyyy-MM-dd")}</td>
                      <td>
                        <button className="btn btn-success btn-sm">Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
  
            <div className="text-center">
              <h3 className="mb-3">Advance Salary Application</h3>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                Apply for Advance Salary
              </button>
              <AdvanceSalaryModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                handleApply={handleApply}
                advanceAmount={advanceAmount}
              />
            </div>
          </>
        )}
  
        {["secretary", "treasurer", "chief whip"].includes(position) && (
          <div className="text-center">
            <h3 className="mb-3">Apply for Salary Advance</h3>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              Apply for Salary Advance
            </button>
            <AdvanceSalaryModal
              show={showModal}
              handleClose={() => setShowModal(false)}
              handleApply={handleApply}
              advanceAmount={advanceAmount}
            />
          </div>
        )}
  
        {!["chairman", "secretary", "treasurer", "chief whip"].includes(
          position
        ) && (
          <div className="text-center">
            <h3 className="mb-3">View Salary Details</h3>
            {/* Display personal salary details */}
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryManagement;