import React from "react";
import axiosInstance from "../../context/axiosInstance";
import Swal from "sweetalert2";

const fetchAllUsers = async () => {
  try {
    const response = await axiosInstance.get("/users");
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return [];
  }
};

const fetchUserRoleDetails = async (userIds) => {
  try {
    const { data = [] } = await axiosInstance.post("/roles/user-roles", {
      userIds,
    });
    return data.reduce((acc, role) => {
      if (!acc[role.user_id]) {
        acc[role.user_id] = [];
      }
      acc[role.user_id].push({
        role_id: role.role_id,
        role_name: role.role_name,
      });
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return {};
  }
};

const fetchUserRoles = async (userIds) => {
  const roleDetails = await fetchUserRoleDetails(userIds);
  return Object.entries(roleDetails).reduce((acc, [userId, roles]) => {
    acc[userId] = roles.map((role) => role.role_name);
    return acc;
  }, {});
};

const fetchPendingUsers = async () => {
  try {
    const response = await axiosInstance.get("/admin/users-pending-approval");
    return response.data;
  } catch (error) {
    console.error("Error fetching pending users:", error);
  }
};

const fetchApprovedUsers = async () => {
  try {
    const { data = [] } = await axiosInstance.get("/admin/users-approved");
    await fetchUserRoles(data.map((user) => user.user_id));
    return data;
  } catch (error) {
    console.error("Error fetching approved users:", error);
  }
};

const fetchWithdrawalRequests = async () => {
  try {
    const { data = [] } = await axiosInstance.get("/admin/withdrawals");
    return data;
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error);
    return [];
  }
};

const updateWithdrawalStatus = async (
  withdrawalId,
  status,
  refreshWithdrawals = null,
) => {
  const normalizedStatus = String(status || "").toLowerCase();
  const prettyStatus = normalizedStatus === "approved" ? "approve" : "reject";

  const confirmation = await Swal.fire({
    title: `Are you sure?`,
    text: `Do you want to ${prettyStatus} this withdrawal request?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: `Yes, ${prettyStatus} it!`,
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (!confirmation.isConfirmed) {
    return false;
  }

  try {
    const response = await axiosInstance.patch(
      `/admin/withdrawals/${withdrawalId}/status`,
      { status: normalizedStatus },
    );

    if (response.status !== 200) {
      throw new Error("Failed to update withdrawal status");
    }

    Swal.fire({
      icon: "success",
      title: `Withdrawal ${normalizedStatus}`,
      text:
        response.data?.message || `Withdrawal has been ${normalizedStatus}.`,
    });

    if (typeof refreshWithdrawals === "function") {
      await refreshWithdrawals();
    }

    return response.data?.withdrawal || true;
  } catch (error) {
    console.error("Error updating withdrawal status:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text:
        error.response?.data?.error ||
        "Failed to update withdrawal status. Please try again later.",
    });
    return false;
  }
};

const fetchRoles = async () => {
  try {
    const response = await axiosInstance.get("/roles");
    return (response.data || []).filter(
      (role) =>
        !["driver", "conductor", "staff"].includes(
          String(role.role_name || "").toLowerCase(),
        ),
    );
  } catch (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
};

const editUser = async (userId, setApprovedUsers) => {
  try {
    const response = await axiosInstance.get(`/users/${userId}`);
    const userData = response.data;

    const { value: formValues } = await Swal.fire({
      title: "Edit User Details",
      html:
        `<input id="firstName" class="swal2-input" placeholder="First Name" value="${userData.first_name}" />` +
        `<input id="lastName" class="swal2-input" placeholder="Last Name" value="${userData.last_name}" />` +
        `<input id="email" class="swal2-input" placeholder="Email" value="${userData.email}" />` +
        `<input id="phone" class="swal2-input" placeholder="Phone" value="${userData.phone}" />`,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      preConfirm: () => {
        return {
          first_name: document.getElementById("firstName").value,
          last_name: document.getElementById("lastName").value,
          email: document.getElementById("email").value,
          phone: document.getElementById("phone").value,
        };
      },
    });

    if (formValues) {
      const updateResponse = await axiosInstance.put(
        `/users/${userId}/update`,
        formValues,
      );

      if (updateResponse.status >= 200 && updateResponse.status < 300) {
        Swal.fire(
          "Changes Saved",
          "User information updated successfully",
          "success",
        );
      } else {
        throw new Error("Failed to update user information");
      }
      const updatedUsers = await fetchApprovedUsers();
      setApprovedUsers(updatedUsers);
    }
  } catch (error) {
    console.error("Error editing user:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while editing user information. Please try again later.",
    });
  }
};

const resetPassword = async (userId) => {
  const confirmation = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, reset it!",
    cancelButtonText: "No, cancel!",
  });

  if (!confirmation.isConfirmed) {
    return;
  }

  try {
    const response = await axiosInstance.post(`/users/${userId}/resetPassword`);
    if (response.status >= 200 && response.status < 300) {
      Swal.fire({
        icon: "success",
        title: "Password Reset",
        text: "Password has been reset successfully.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to reset the password.",
      });
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An error occurred while resetting the password. Please try again later.",
    });
  }
};

const deleteUser = async (userId, setApprovedUsers) => {
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
      const updatedUsers = await fetchApprovedUsers();
      setApprovedUsers(updatedUsers);
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

const approveUser = async (userId, email, refreshUsers = null) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `Do you want to approve ${email}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, approve it!",
    cancelButtonText: "No, cancel!",
    reverseButtons: true,
  });

  if (result.isConfirmed) {
    try {
      const response = await axiosInstance.post("/admin/approve-user", {
        userId,
        email,
      });
      if (response.status === 200) {
        Swal.fire({
          title: "Approved!",
          text: response.data?.message || `User ${email} has been approved.`,
          icon: "success",
        });
        if (typeof refreshUsers === "function") {
          await refreshUsers();
        }
      } else {
        throw new Error("Failed to approve user");
      }
    } catch (error) {
      console.error("Error approving user:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to approve user. Please try again later.",
        icon: "error",
      });
    }
  }
};

const disapproveUser = async (userId, email, refreshUsers = null) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: `Do you want to disapprove ${email}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, disapprove it!",
    cancelButtonText: "No, cancel!",
    reverseButtons: true,
  });

  if (result.isConfirmed) {
    try {
      const response = await axiosInstance.post("/admin/disapprove-user", {
        userId,
        email,
      });
      if (response.status === 200) {
        Swal.fire({
          title: "Moved to Pending!",
          text:
            response.data?.message ||
            `User ${email} has been moved back to pending.`,
          icon: "success",
        });
        if (typeof refreshUsers === "function") {
          await refreshUsers();
        }
      } else {
        throw new Error("Failed to disapprove user");
      }
    } catch (error) {
      console.error("Error disapproving user:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to disapprove user. Please try again later.",
        icon: "error",
      });
    }
  }
};

const assignRole = async (
  userId,
  roleId,
  position = null,
  setUserRoles = null,
  refreshRoles = null,
) => {
  if (!userId || !roleId) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Please select a valid user and role.",
    });
    return false;
  }

  try {
    const response = await axiosInstance.post(`/roles/${userId}/assignRole`, {
      roleId,
      position,
    });
    if (response.status !== 200 || response.data?.success === false) {
      throw new Error(response.data?.error || "Failed to assign role");
    }
    Swal.fire({
      icon: "success",
      title: "Role Assigned",
      text:
        response.data?.message || "The role has been assigned successfully.",
    });

    if (typeof refreshRoles === "function") {
      await refreshRoles();
      return;
    }

    if (typeof setUserRoles === "function") {
      const newRoles = await fetchUserRoleDetails([userId]);
      setUserRoles((prevUserRoles) => ({
        ...prevUserRoles,
        [userId]: newRoles[userId],
      }));
    }
    return true;
  } catch (error) {
    console.error("Error assigning role:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text:
        error.response?.data?.error ||
        "Failed to assign the role. Please try again later.",
    });
    return false;
  }
};

const unassignRole = async (userId, roleId, refreshRoles = null) => {
  const confirmation = await Swal.fire({
    title: "Remove role?",
    text: "Are you sure you want to remove this role from this user?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, remove it",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (!confirmation.isConfirmed) {
    return false;
  }

  try {
    const response = await axiosInstance.post(`/roles/${userId}/unassignRole`, {
      roleId,
    });

    if (response.data?.success === false) {
      throw new Error(response.data?.error || "Failed to remove the role");
    }

    Swal.fire({
      icon: "success",
      title: "Role Removed",
      text: response.data?.message || "The role has been removed successfully.",
    });

    if (typeof refreshRoles === "function") {
      await refreshRoles();
    }
    return true;
  } catch (error) {
    console.error("Error removing role:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text:
        error.response?.data?.error ||
        "Failed to remove the role. Please try again later.",
    });
    return false;
  }
};

const checkEmailExists = async (email) => {
  try {
    const response = await axiosInstance.post("/users/check-email", { email });
    return response.data.exists;
  } catch (error) {
    console.error("Error checking email:", error);
    return false;
  }
};

const handleUserRegistration = async (formData) => {
  const {
    phone,
    national_id,
    password,
    confirmPassword,
    email,
    first_name,
    last_name,
    address,
    gender,
  } = formData;

  // Validation checks
  if (phone.length !== 10) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Phone should be ten digits.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
    });
    return Promise.reject(new Error("Phone should be ten digits."));
  }

  if (national_id.length < 8 || national_id.length > 9) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "National ID should be 8-9 digits",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
    });
    return Promise.reject(new Error("National ID should be 8-9 digits."));
  }

  if (password !== confirmPassword) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Passwords do not match.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
    });
    return Promise.reject(new Error("Passwords do not match."));
  }

  if (!first_name || !last_name || !gender || !address) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "All fields required.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
    });
    return Promise.reject(new Error("All fields are required."));
  }

  const emailExists = await checkEmailExists(email);
  if (emailExists) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Email already exists.",
      toast: true,
      position: "top-end",
      showConfirmButton: true,
      timer: 5000,
      timerProgressBar: true,
    });
    return Promise.reject(new Error("Email already exists."));
  }

  // Prepare FormData for submission
  const dataToSend = new FormData();
  for (const [key, value] of Object.entries(formData)) {
    if (key !== "confirmPassword") {
      dataToSend.append(key, value);
    }
  }

  try {
    const response = await axiosInstance.post("/users/signup", dataToSend);
    if (response.status === 200) {
      Swal.fire({
        icon: "success",
        title: "Signup Successful!",
        text: "You have successfully signed up.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return response;
    } else {
      Swal.fire({
        icon: "error",
        title: "Signup Failed",
        text:
          response.data.error ||
          "There was an error signing up. Please try again later.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
      return Promise.reject(new Error("Signup failed"));
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "An unexpected error occurred. Please try again later.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
    });
    return Promise.reject(error);
  }
};

export {
  fetchAllUsers,
  fetchUserRoles,
  fetchUserRoleDetails,
  fetchPendingUsers,
  fetchApprovedUsers,
  fetchWithdrawalRequests,
  updateWithdrawalStatus,
  fetchRoles,
  editUser,
  resetPassword,
  deleteUser,
  approveUser,
  disapproveUser,
  assignRole,
  unassignRole,
  checkEmailExists,
  handleUserRegistration,
};
