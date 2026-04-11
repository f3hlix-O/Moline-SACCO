import Swal from "sweetalert2";
import axiosInstance from "../../context/axiosInstance";

const fetchLoanApplications = async () => {
  try {
    const response = await axiosInstance.get("/matatus/allPendingLoans");

    if (response.status !== 200) {
      throw new Error("Failed to fetch loan applications");
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching loan applications:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to load loan applications. Please try again later.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    return [];
  }
};

const handleApproveLoan = (
  loanId,
  isEmergencyLoan,
  setAllLoans,
  setAllLoans2,
) => {
  Swal.fire({
    title: "Are you sure you want to approve this loan?",
    text: "The loan will be approved for the full requested amount.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, Approve",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      approveLoan(loanId, isEmergencyLoan, setAllLoans, setAllLoans2);
    }
  });
};

const approveLoan = async (
  loanId,
  isEmergencyLoan,
  setAllLoans,
  setAllLoans2,
) => {
  try {
    const endpoint = isEmergencyLoan ? "approveEmergencyLoan" : "approveLoan";
    const response = await axiosInstance.post(`/finance/${endpoint}`, {
      loanId: loanId,
    });

    if (response.status !== 200) {
      throw new Error("Failed to approve loan");
    }

    Swal.fire({
      icon: "success",
      title: "Loan Approved",
      text: "The loan has been approved and the amount issued.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    const data = await fetchLoanApplications();
    setAllLoans(data);
    // Note: User finance summary will update on their next page refresh or manual refresh
  } catch (error) {
    console.error("Error approving loan:", error);
    Swal.fire({
      icon: "error",
      title: "Approval Failed",
      text: "An error occurred while approving the loan. Please try again later.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }
};

const disapproveLoan = async (loanId, reason, isEmergencyLoan) => {
  try {
    const endpoint = isEmergencyLoan
      ? "disapproveEmergencyLoan"
      : "disapproveLoan";
    const response = await axiosInstance.post(`/finance/${endpoint}`, {
      loanId,
      reason,
    });

    if (response.status !== 200) {
      throw new Error("Failed to disapprove loan");
    }

    Swal.fire({
      icon: "success",
      title: "Loan Disapproved",
      text: "The loan has been disapproved and the user has been notified.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

    fetchLoanApplications();
  } catch (error) {
    console.error("Error disapproving loan:", error);
    Swal.fire({
      icon: "error",
      title: "Disapproval Failed",
      text: "An error occurred while disapproving the loan. Please try again later.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }
};

// Wrapper that updates UI state after disapproval so admin lists refresh
const handleDisapproveLoan = (
  loanId,
  isEmergencyLoan,
  setAllLoans,
  setAllLoans2,
) => {
  Swal.fire({
    title: "Enter reason for disapproval:",
    input: "textarea",
    inputAttributes: {
      autocapitalize: "off",
    },
    showCancelButton: true,
    confirmButtonText: "Disapprove",
    showLoaderOnConfirm: true,
    preConfirm: (reason) => {
      if (reason === "") {
        Swal.showValidationMessage("Please enter a reason for disapproval");
        return;
      }
      return disapproveLoan(loanId, reason, isEmergencyLoan)
        .then(() => sendDisapprovalEmail(loanId, reason, isEmergencyLoan))
        .then(async () => {
          // Refresh lists and update parent state
          const data = await fetchLoanApplications();
          setAllLoans(data);
        })
        .catch((error) => {
          Swal.showValidationMessage(`Request failed: ${error}`);
        });
    },
    allowOutsideClick: () => !Swal.isLoading(),
  });
};

const sendApprovalEmail = async (loanId, amountIssued, isEmergencyLoan) => {
  try {
    const endpoint = isEmergencyLoan
      ? "sendEmergencyApprovalEmail"
      : "sendNormalApprovalEmail";
    const disbursementMethod = "mpesa";
    await axiosInstance.post(`/notifications/${endpoint}`, {
      loanId,
      amountIssued,
      disbursementMethod,
    });
  } catch (error) {
    console.error("Error sending approval email:", error);
  }
};

const sendDisapprovalEmail = async (loanId, reason, isEmergencyLoan) => {
  try {
    const endpoint = isEmergencyLoan
      ? "sendEmergencyDisapprovalEmail"
      : "sendNormalDisapprovalEmail";
    await axiosInstance.post(`/notifications/${endpoint}`, {
      loanId,
      reason,
    });
  } catch (error) {
    console.error("Error sending disapproval email:", error);
  }
};

const fetchFinancialDetails = async () => {
  try {
    const response = await axiosInstance.get("/reports/financialDetails");
    const data = await response.data;
    return data;
  } catch (error) {
    console.error("error fetching financial details", error);
    return [];
  }
};

const fetchAllUserSavings = async () => {
  try {
    const response = await axiosInstance.get("/admin/savings");
    return response.data;
  } catch (error) {
    console.error("Error fetching user savings:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to load user savings. Please try again later.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    return [];
  }
};

export {
  handleApproveLoan,
  fetchLoanApplications,
  fetchFinancialDetails,
  fetchAllUserSavings,
  handleDisapproveLoan,
};
