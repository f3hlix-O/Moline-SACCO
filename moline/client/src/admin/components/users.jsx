import React from "react";
import axiosInstance from "../../context/axiosInstance";
import Swal from "sweetalert2";

const fetchAllUsers = async () => {
  try {
    const response = await axiosInstance.get("/users");
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
  }
};

const fetchUserRoles = async (userIds) => {
  try {
    const response = await axiosInstance.post("/roles/user-roles", { userIds });
    const data = response.data;
    return data.reduce((acc, role) => {
      if (!acc[role.user_id]) {
        acc[role.user_id] = [];
      }
      acc[role.user_id].push(role.role_name);
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching user roles:", error);
  }
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
    const response = await axiosInstance.get("/admin/users-approved");
    const data = response.data;
    await fetchUserRoles(data.map((user) => user.user_id));
    return data;
  } catch (error) {
    console.error("Error fetching approved users:", error);
  }
};

const fetchRoles = async () => {
  try {
    const response = await axiosInstance.get("/roles");
    return response.data;
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
        formValues
      );

      if (updateResponse.status >= 200 && updateResponse.status < 300) {
        Swal.fire(
          "Changes Saved",
          "User information updated successfully",
          "success"
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

const approveUser = async (userId, email, setPendingUsers) => {
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
          text: `User ${email} has been approved.`,
          icon: "success",
        });
        const pendingUsers = await fetchPendingUsers();
        setPendingUsers(pendingUsers);
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

const disapproveUser = async (userId, email, setPendingUsers) => {
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
          title: "Disapproved!",
          text: `User ${email} has been disapproved.`,
          icon: "success",
        });
        const pendingUsers = await fetchPendingUsers();
        setPendingUsers(pendingUsers);
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

const assignRole = async (userId, roleId, position, setUserRoles) => {
  if (!roleId || (roleId === "staff" && !position)) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Please select a role and position if the role is staff.",
    });
    return;
  }

  try {
    const response = await axiosInstance.post(`/roles/${userId}/assignRole`, {
      roleId,
      position,
    });
    if (response.status !== 200) {
      const errorMessage = await response.data;
      throw new Error(
        `HTTP error! Status: ${response.status}, Message: ${errorMessage}`
      );
    }
    Swal.fire({
      icon: "success",
      title: "Role Assigned",
      text: "The role has been assigned successfully.",
    });

    const newRoles = await fetchUserRoles([userId]);
    setUserRoles((prevUserRoles) => ({
      ...prevUserRoles,
      [userId]: newRoles[userId],
    }));
  } catch (error) {
    console.error("Error assigning role:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to assign the role. Please try again later.",
    });
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
        text: response.data.error || "There was an error signing up. Please try again later.",
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
  fetchPendingUsers,
  fetchApprovedUsers,
  fetchRoles,
  editUser,
  resetPassword,
  deleteUser,
  approveUser,
  disapproveUser,
  assignRole,
  checkEmailExists,
  handleUserRegistration,
};
