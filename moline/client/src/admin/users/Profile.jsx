import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Dropdown, Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import {
  fetchApprovedUsers,
  deleteUser,
  editUser,
  resetPassword,
} from "../components/users";

const ID_IMAGE_PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="220" height="140" viewBox="0 0 220 140"><rect width="220" height="140" rx="14" fill="#e2e8f0"/><rect x="18" y="18" width="184" height="104" rx="10" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/><path d="M36 95l28-30 22 22 18-18 40 40H36z" fill="#94a3b8"/><circle cx="84" cy="52" r="12" fill="#94a3b8"/><text x="110" y="126" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#475569">Broken Image</text></svg>',
  );

const renderIdImageCell = (imageValue, name, onPreview) => {
  const imageSrc = getIdImageSrc(imageValue);

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={name}
        className="img-thumbnail"
        style={{
          width: "60px",
          height: "60px",
          objectFit: "cover",
          cursor: "pointer",
        }}
        loading="lazy"
        decoding="async"
        onError={(event) => {
          event.currentTarget.src = ID_IMAGE_PLACEHOLDER;
          event.currentTarget.style.cursor = "default";
        }}
        onClick={() => onPreview(imageSrc)}
      />
    );
  }

  return (
    <div className="d-inline-flex flex-column align-items-center gap-1">
      <img
        src={ID_IMAGE_PLACEHOLDER}
        alt={`Missing ID image for ${name}`}
        className="img-thumbnail"
        style={{
          width: "60px",
          height: "60px",
          objectFit: "cover",
          cursor: "default",
        }}
        aria-hidden="true"
      />
      <small className="text-muted text-center" style={{ maxWidth: "110px" }}>
        {name}
      </small>
    </div>
  );
};

const getIdImageSrc = (imageValue) => {
  if (!imageValue || typeof imageValue !== "string") {
    return null;
  }

  const trimmedValue = imageValue.trim().replace(/\\/g, "/");

  if (
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://")
  ) {
    return trimmedValue;
  }

  const normalizedValue = trimmedValue
    .replace(/^\/+/g, "")
    .replace(/^uploads\//i, "");

  return `http://localhost:5000/uploads/${normalizedValue}`;
};

function Profile() {
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState("");

  useEffect(() => {
    const initializeData = async () => {
      const approvedUsers = await fetchApprovedUsers();
      setApprovedUsers(approvedUsers);
    };
    initializeData();
  }, []);

  const openModal = (imageSrc) => {
    if (!imageSrc) {
      return;
    }

    setModalImageSrc(imageSrc);
    setShowModal(true);
  };

  const renderTable = (title, users, columns) => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="card-body">
        <table className="table table-bordered table-striped">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>
                  <Link to={`/admin/users/user_profile/${user.user_id}`}>
                    {user.user_id}
                  </Link>
                </td>
                <td>
                  {user.first_name} {user.last_name}
                </td>
                <td>{user.email}</td>
                {title === "Vehicle Owners" && (
                  <td>
                    {renderIdImageCell(
                      user.ID_image,
                      `${user.first_name} ${user.last_name}`,
                      openModal,
                    )}
                  </td>
                )}
                <td>
                  <Dropdown>
                    <Dropdown.Toggle
                      variant="light"
                      id={`dropdown-${user.user_id}`}
                    >
                      <FontAwesomeIcon icon={faCog} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item
                        onClick={() => editUser(user.user_id, setApprovedUsers)}
                      >
                        <FontAwesomeIcon icon="fas fa-pencil-alt" /> Edit
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => resetPassword(user.user_id)}
                      >
                        <FontAwesomeIcon icon="fas fa-key" /> Reset Password
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() =>
                          deleteUser(user.user_id, setApprovedUsers)
                        }
                      >
                        <FontAwesomeIcon icon="fas fa-trash-alt" /> Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const getUsersByRole = (roleName) =>
    approvedUsers.filter((user) => user.roles.includes(roleName));

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              {renderTable("Admins", getUsersByRole("Admin"), [
                "ID",
                "Name",
                "Email",
              ])}
              {renderTable("Vehicle Owners", getUsersByRole("Vehicle Owner"), [
                "ID",
                "Name",
                "Email",
                "ID Image",
              ])}
            </div>
          </div>
        </div>
      </section>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <img src={modalImageSrc} alt="ID Image" className="img-fluid" />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Profile;
