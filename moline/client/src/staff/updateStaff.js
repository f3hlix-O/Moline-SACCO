import React, { useState, useEffect } from "react";
import axiosInstance from "../context/axiosInstance";
import Swal from "sweetalert2";

const UpdateStaffDetails = ({ staffId, userId }) => {
  const [formValues, setFormValues] = useState({
    accountNumber: "",
    bankName: "",
    branch: "",
    kraPin: "",
    nhifNumber: "",
    passportPhoto: null,
    firstName: "",
    lastName: "",
    email: "",
    nationalId: "",
    nationalIdPhoto: null,
  });

  const [passwordValues, setPasswordValues] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const staffRes = await axiosInstance.get(`/staff/details/user`);
      setFormValues({
        accountNumber: staffRes.data.bank_account_number,
        bankName: staffRes.data.bank_name,
        branch: staffRes.data.branch,
        kraPin: staffRes.data.kra_pin,
        nhifNumber: staffRes.data.nhif_number,
        passportPhoto: null,
        firstName: staffRes.data.first_name,
        lastName: staffRes.data.last_name,
        email: staffRes.data.email,
        nationalId: staffRes.data.national_id,
        nationalIdPhoto: null,
      });
    } catch (err) {
      console.error("Error fetching details:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        html: `<div class="alert alert-danger">Failed to fetch details: ${err.message}</div>`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
    if (name in passwordValues) {
      setPasswordValues({ ...passwordValues, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      const name = e.target.name;
      if (name === "passportPhoto" || name === "nationalIdPhoto") {
        setFormValues({ ...formValues, [name]: file });
      }
    } else {
      alert("Please upload a valid image (jpg, jpeg, png).");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("bankName", formValues.bankName);
      formData.append("accountNumber", formValues.accountNumber);
      formData.append("kraPin", formValues.kraPin);
      formData.append("nhifNumber", formValues.nhifNumber);
      if (formValues.passportPhoto) {
        formData.append("passportPhoto", formValues.passportPhoto);
      }

      await axiosInstance.post("/staff/details/modify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Swal.fire({
        icon: "success",
        title: "Success",
        html: '<div class="alert alert-success">Details updated successfully</div>',
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Error updating details:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        html: `<div class="alert alert-danger">Failed to update: ${err.message}</div>`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/user/password/change", {
        userId,
        ...passwordValues,
      });
      Swal.fire({
        icon: "success",
        title: "Success",
        html: '<div class="alert alert-success">Password updated successfully</div>',
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Error updating password:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        html: `<div class="alert alert-danger">Failed to update password: ${err.message}</div>`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
    }
  };

  return (
    <div className="p-2 content-wrapper">
      <div className="container my-4">
        {/* Bank Details */}
        <div className="card mb-4">
          <div className="card-header">Details</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {[
                  "accountNumber",
                  "bankName",
                  "branch",
                  "kraPin",
                  "nhifNumber",
                ].map((field, index) => (
                  <div className="col-md-4" key={index}>
                    <label className="form-label text-capitalize">
                      {field.replace(/([A-Z])/g, " $1")}:
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name={field}
                      value={formValues[field]}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                ))}
                <div className="col-md-4">
                  <label className="form-label">Passport Photo:</label>
                  <input
                    type="file"
                    className="form-control"
                    name="passportPhoto"
                    accept="image/jpeg, image/png"
                    onChange={handleFileChange}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-3">
                Update Details
              </button>
            </form>
          </div>
        </div>

        {/* Password Change */}
        <div className="card mb-4">
          <div className="card-header">Change Password</div>
          <div className="card-body">
            <form onSubmit={handleChangePassword}>
              <div className="row g-3">
                {["currentPassword", "newPassword", "confirmNewPassword"].map(
                  (field, index) => (
                    <div className="col-md-4" key={index}>
                      <label className="form-label text-capitalize">
                        {field.replace(/([A-Z])/g, " $1")}:
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        name={field}
                        value={passwordValues[field]}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )
                )}
              </div>
              <button type="submit" className="btn btn-warning mt-3">
                Update Password
              </button>
            </form>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="card mb-4">
          <div className="card-header">Edit Profile</div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {["firstName", "lastName", "email", "nationalId"].map(
                  (field, index) => (
                    <div className="col-md-4" key={index}>
                      <label className="form-label text-capitalize">
                        {field.replace(/([A-Z])/g, " $1")}:
                      </label>
                      <input
                        type={field === "email" ? "email" : "text"}
                        className="form-control"
                        name={field}
                        value={formValues[field]}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )
                )}
                <div className="col-md-4">
                  <label className="form-label">National ID Photo:</label>
                  <input
                    type="file"
                    className="form-control"
                    name="nationalIdPhoto"
                    accept="image/jpeg, image/png"
                    onChange={handleFileChange}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-success mt-3">
                Update Profile
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateStaffDetails;
