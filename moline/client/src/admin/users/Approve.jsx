import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { Dropdown, Button, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog } from "@fortawesome/free-solid-svg-icons";
import {
  fetchPendingUsers,
  fetchApprovedUsers,
  approveUser,
  disapproveUser,
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
          width: "110px",
          height: "70px",
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
          width: "110px",
          height: "70px",
          objectFit: "cover",
          cursor: "default",
        }}
        aria-hidden="true"
      />
      <small className="text-muted text-center" style={{ maxWidth: "120px" }}>
        {name}
      </small>
    </div>
  );
};

const getIdImageSrc = (imageValue) => {
  if (!imageValue) {
    return null;
  }

  if (typeof imageValue !== "string") {
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

function Approve() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const openImagePreview = (imageSrc) => {
    if (!imageSrc) {
      return;
    }

    setPreviewImage(imageSrc);
    setShowImageModal(true);
  };

  const refreshUsers = async () => {
    const approved = await fetchApprovedUsers();
    const pending = await fetchPendingUsers();

    setApprovedUsers(approved || []);
    setPendingUsers(pending || []);
  };

  useEffect(() => {
    const initializeData = async () => {
      await refreshUsers();
    };
    initializeData();
  }, []);

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Users Pending Approval</h3>
                </div>
                <div className="card-body">
                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>ID Image</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((user) => (
                        <tr key={user.user_id}>
                          <td>{user.user_id}</td>
                          <td>
                            {user.first_name} {user.last_name}
                          </td>
                          <td>{user.email}</td>
                          <td>
                            {renderIdImageCell(
                              user.ID_image,
                              `${user.first_name} ${user.last_name}`,
                              openImagePreview,
                            )}
                          </td>
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
                                  onClick={() =>
                                    approveUser(
                                      user.user_id,
                                      user.email,
                                      refreshUsers,
                                    )
                                  }
                                >
                                  <FontAwesomeIcon icon="fas fa-pencil-alt" />
                                  Approve
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() =>
                                    disapproveUser(
                                      user.user_id,
                                      user.email,
                                      refreshUsers,
                                    )
                                  }
                                >
                                  <FontAwesomeIcon icon="fas fa-key" />{" "}
                                  Disapprove
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
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Approved Users</h3>
                </div>
                <div className="card-body">
                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>ID Image</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvedUsers.map((user) => (
                        <tr key={user.user_id}>
                          <td>{user.user_id}</td>
                          <td>
                            {user.first_name} {user.last_name}
                          </td>
                          <td>{user.email}</td>
                          <td>
                            {renderIdImageCell(
                              user.ID_image,
                              `${user.first_name} ${user.last_name}`,
                              openImagePreview,
                            )}
                          </td>
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
                                  onClick={() =>
                                    approveUser(
                                      user.user_id,
                                      user.email,
                                      refreshUsers,
                                    )
                                  }
                                >
                                  <FontAwesomeIcon icon="fas fa-pencil-alt" />
                                  Approve
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() =>
                                    disapproveUser(
                                      user.user_id,
                                      user.email,
                                      refreshUsers,
                                    )
                                  }
                                >
                                  <FontAwesomeIcon icon="fas fa-key" />{" "}
                                  Disapprove
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
            </div>
          </div>
        </div>
      </section>

      <Modal
        show={showImageModal}
        onHide={() => setShowImageModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>ID Image Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center bg-light">
          <img
            src={previewImage}
            alt="ID preview"
            className="img-fluid rounded"
            style={{ maxHeight: "75vh", objectFit: "contain" }}
            onError={(event) => {
              event.currentTarget.src = ID_IMAGE_PLACEHOLDER;
            }}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Approve;
