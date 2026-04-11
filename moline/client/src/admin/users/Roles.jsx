import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import {
  assignRole,
  fetchAllUsers,
  fetchRoles,
  fetchUserRoleDetails,
  unassignRole,
} from "../components/users";

function Roles() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoleDetails, setUserRoleDetails] = useState({});
  const [selectedRoles, setSelectedRoles] = useState({});
  const [loading, setLoading] = useState(false);

  const userIds = useMemo(() => users.map((user) => user.user_id), [users]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsersData, rolesData] = await Promise.all([
        fetchAllUsers(),
        fetchRoles(),
      ]);

      setUsers(allUsersData || []);
      setRoles(rolesData || []);

      const rolesByUser = await fetchUserRoleDetails(
        (allUsersData || []).map((user) => user.user_id),
      );
      setUserRoleDetails(rolesByUser || {});
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Load failed",
        text: "Unable to load role management data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshRoles = async () => {
    if (userIds.length === 0) {
      setUserRoleDetails({});
      return;
    }

    const rolesByUser = await fetchUserRoleDetails(userIds);
    setUserRoleDetails(rolesByUser || {});
  };

  const handleAssign = async (userId) => {
    const roleId = selectedRoles[userId];
    if (!roleId) {
      Swal.fire({
        icon: "error",
        title: "Select a role",
        text: "Please choose a role before assigning it.",
      });
      return;
    }

    const currentRoles = userRoleDetails[userId] || [];
    const alreadyAssigned = currentRoles.some(
      (role) => String(role.role_id) === String(roleId),
    );
    if (alreadyAssigned) {
      Swal.fire({
        icon: "error",
        title: "Duplicate role",
        text: "This user already has the selected role.",
      });
      return;
    }

    const success = await assignRole(userId, roleId, null, null, refreshRoles);
    if (success) {
      setSelectedRoles((prev) => ({
        ...prev,
        [userId]: "",
      }));
    }
  };

  const handleUnassign = async (userId, roleId) => {
    await unassignRole(userId, roleId, refreshRoles);
  };

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid py-3">
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <div>
                    <h3 className="card-title mb-0">Role Management</h3>
                    <small className="text-muted">
                      Assign and remove roles for users
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={loadData}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover mb-0 align-middle">
                      <thead className="thead-light">
                        <tr>
                          <th style={{ width: "70px" }}>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th style={{ minWidth: "260px" }}>Current Roles</th>
                          <th style={{ minWidth: "260px" }}>Assign Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 && (
                          <tr>
                            <td
                              colSpan="6"
                              className="text-center text-muted py-4"
                            >
                              No users found.
                            </td>
                          </tr>
                        )}

                        {users.map((user) => {
                          const assignedRoles =
                            userRoleDetails[user.user_id] || [];
                          const assignedRoleIds = new Set(
                            assignedRoles.map((role) => String(role.role_id)),
                          );
                          const selectedRole =
                            selectedRoles[user.user_id] || "";
                          const selectedRoleIsDuplicate =
                            selectedRole &&
                            assignedRoleIds.has(String(selectedRole));

                          return (
                            <tr key={user.user_id}>
                              <td>{user.user_id}</td>
                              <td>
                                {user.first_name} {user.last_name}
                              </td>
                              <td>{user.email}</td>
                              <td>
                                <span
                                  className={`badge ${user.status === "approved" ? "badge-success" : user.status === "pending" ? "badge-warning" : "badge-secondary"}`}
                                >
                                  {user.status || "unknown"}
                                </span>
                              </td>
                              <td>
                                {assignedRoles.length > 0 ? (
                                  <div
                                    className="d-flex flex-wrap"
                                    style={{ gap: "0.5rem" }}
                                  >
                                    {assignedRoles.map((role) => (
                                      <span
                                        key={`${user.user_id}-${role.role_id}`}
                                        className="badge badge-primary d-inline-flex align-items-center"
                                        style={{
                                          gap: "0.35rem",
                                          padding: "0.45rem 0.65rem",
                                        }}
                                      >
                                        <span>{role.role_name}</span>
                                        <button
                                          type="button"
                                          className="btn btn-link btn-sm p-0 text-white"
                                          style={{
                                            lineHeight: 1,
                                            textDecoration: "none",
                                          }}
                                          onClick={() =>
                                            handleUnassign(
                                              user.user_id,
                                              role.role_id,
                                            )
                                          }
                                          title={`Remove ${role.role_name}`}
                                        >
                                          ×
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted">
                                    No roles assigned
                                  </span>
                                )}
                              </td>
                              <td>
                                <div
                                  className="d-flex flex-column flex-md-row align-items-md-center"
                                  style={{ gap: "0.5rem" }}
                                >
                                  <select
                                    className="form-control form-control-sm"
                                    value={selectedRoles[user.user_id] || ""}
                                    onChange={({ target: { value } }) => {
                                      setSelectedRoles((prev) => ({
                                        ...prev,
                                        [user.user_id]: value,
                                      }));
                                    }}
                                  >
                                    <option value="">Select role</option>
                                    {roles.map((role) => {
                                      const isAlreadyAssigned =
                                        assignedRoleIds.has(
                                          String(role.role_id),
                                        );
                                      return (
                                        <option
                                          key={role.role_id}
                                          value={role.role_id}
                                          disabled={isAlreadyAssigned}
                                        >
                                          {role.role_name}
                                          {isAlreadyAssigned
                                            ? " (assigned)"
                                            : ""}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <button
                                    type="button"
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleAssign(user.user_id)}
                                    disabled={
                                      !selectedRole || selectedRoleIsDuplicate
                                    }
                                  >
                                    Assign Role
                                  </button>
                                </div>
                                {selectedRoleIsDuplicate && (
                                  <small className="text-danger d-block mt-2">
                                    This role is already assigned to the
                                    selected user.
                                  </small>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Roles;
