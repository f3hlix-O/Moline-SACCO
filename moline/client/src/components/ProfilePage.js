import React, { useState, useEffect } from "react";
import "./ProfilePage.css";
import { Modal, Button } from "react-bootstrap";
import Swal from "sweetalert2";
import axiosInstance from "../context/axiosInstance";
import { streetNames } from "../pages/auth/Register";

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [updatedUserData, setUpdatedUserData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axiosInstance.get("/matatus/profile");

        if (response.status !== 200) {
          throw new Error("Failed to fetch user data");
        }

        const userData = response.data;
        setUserData(userData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `Failed to fetch user data: ${error.message}`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
        });
      }
    };

    fetchUserData();
  }, []);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleEdit = () => {
    setEditMode(true);
    setUpdatedUserData({
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
      national_id: userData.national_id,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUserData({ ...updatedUserData, [name]: value });
  };

  const handleSave = async () => {
    try {
      const response = await axiosInstance.put(
        "matatus/profile/update",
        updatedUserData,
      );

      if (response.status !== 200) {
        throw new Error("Failed to update user data");
      }

      // Re-fetch the full profile from the server so we preserve fields
      // that are not part of the editable form (for example `staff_number`).
      try {
        const refreshed = await axiosInstance.get("/matatus/profile");
        if (refreshed && refreshed.status === 200 && refreshed.data) {
          setUserData(refreshed.data);
        } else {
          setUserData((prev) => ({ ...prev, ...updatedUserData }));
        }
      } catch (err) {
        // Fallback: merge updated fields into existing state
        setUserData((prev) => ({ ...prev, ...updatedUserData }));
      }

      setEditMode(false);
      setShowModal(false);

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "User profile updated successfully",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Error updating user data:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Failed to update user profile: ${error.message}`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
    }
  };

  if (loading) {
    return <p>Loading user data...</p>;
  }

  return (
    <section className="content content-wrapper">
      <div className="container emp-profile">
        {/* Profile Information */}
        <div className="profile-info">
          {userData ? (
            <>
              <div className="row">
                <div className="col-md-6">
                  <label>Name</label>
                </div>
                <div className="col-md-6">
                  {editMode ? (
                    <input
                      type="text"
                      name="first_name"
                      value={updatedUserData.first_name}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <p>{`${userData.first_name} ${userData.last_name}`}</p>
                  )}
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <label>Email</label>
                </div>
                <div className="col-md-6">
                  {editMode ? (
                    <input
                      type="text"
                      name="email"
                      value={updatedUserData.email}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <p>{userData.email}</p>
                  )}
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <label>Phone</label>
                </div>
                <div className="col-md-6">
                  {editMode ? (
                    <input
                      type="text"
                      name="phone"
                      value={updatedUserData.phone}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <p>{userData.phone}</p>
                  )}
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <label>Address</label>
                </div>
                <div className="col-md-6">
                  {editMode ? (
                    <select
                      name="address"
                      value={updatedUserData.address}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    >
                      <option value="">Select Address</option>
                      {streetNames.map((s, i) => (
                        <option key={i} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p>{userData.address}</p>
                  )}
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <label>National ID number</label>
                </div>
                <div className="col-md-6">
                  {editMode ? (
                    <input
                      type="text"
                      name="national_id"
                      value={updatedUserData.national_id}
                      onChange={handleInputChange}
                      className="form-control"
                    />
                  ) : (
                    <p>{userData.national_id}</p>
                  )}
                </div>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <label>Staff Number</label>
                </div>
                <div className="col-md-6">
                  {editMode ? (
                    <input
                      type="text"
                      name="staff_number"
                      value={
                        userData.staff_number ||
                        `STF${String(userData.user_id).padStart(6, "0")}`
                      }
                      readOnly
                      className="form-control"
                    />
                  ) : (
                    <p>
                      {userData.staff_number ||
                        `STF${String(userData.user_id).padStart(6, "0")}`}
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p>No user data found.</p>
          )}
        </div>

        {/* Edit Profile Button */}
        {!editMode && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleEdit}
          >
            Edit Profile
          </button>
        )}

        {/* Save Button */}
        {editMode && (
          <button
            type="button"
            className="btn btn-success"
            onClick={handleSave}
          >
            Save
          </button>
        )}

        {/* Cancel Button */}
        {editMode && (
          <button
            type="button"
            className="btn btn-secondary ml-2"
            onClick={() => {
              setEditMode(false);
              setShowModal(false);
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </section>
  );
};

export default ProfilePage;
