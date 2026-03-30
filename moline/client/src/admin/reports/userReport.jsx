import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { exportData, printData } from '../../utils/export';
import axiosInstance from '../../context/axiosInstance';
import { Form } from 'react-bootstrap';

const Profile = () => {
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [userRoles, setUserRoles] = useState({});
  const [filterRole, setFilterRole] = useState('All');

  // Fetch users and roles on mount
  useEffect(() => {
    fetchApprovedUsers();
    fetchRoles();
  }, []);

  const fetchApprovedUsers = async () => {
    try {
      const { data } = await axiosInstance.get('/admin/users-approved');
      console.log('Approved Users:', data);
      setApprovedUsers(data);
      fetchUserRoles(data.map(u => u.user_id));
    } catch (err) {
      console.error('Error fetching approved users:', err);
    }
  };

  const fetchUserRoles = async (userIds) => {
    try {
      const { data } = await axiosInstance.post('/roles/user-roles', { userIds });
      // Build map: { user_id: ['Admin','Staff', ...], ... }
      const map = data.reduce((acc, r) => {
        acc[r.user_id] = acc[r.user_id] ?? [];
        acc[r.user_id].push(r.role_name);
        return acc;
      }, {});
      setUserRoles(map);
    } catch (err) {
      console.error('Error fetching user roles:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await axiosInstance.get('/roles');
      setRoles(data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  // Filter logic
  const filteredUsers = filterRole === 'All'
    ? approvedUsers
    : approvedUsers.filter(u => userRoles[u.user_id]?.includes(filterRole));

  // Prepare data for export: include a `roles` field
  const exportList = filteredUsers.map(u => ({
    first_name:     u.first_name,
    last_name:      u.last_name,
    email:          u.email,
    phone:          u.phone,
    roles:          (userRoles[u.user_id] || []).join(', '),
    status:         u.status,
    created_at:     u.created_at,
  }));

  // Define columns for export/print
  const columns = [
    { header: 'First Name',   field: 'first_name' },
    { header: 'Last Name',    field: 'last_name' },
    { header: 'Email',        field: 'email' },
    { header: 'Phone',        field: 'phone' },
    { header: 'Roles',        field: 'roles' },
    { header: 'Status',       field: 'status' },
    { header: 'Created At',   field: 'created_at' },
  ];

  return (
    <div className="content-wrapper p-4">
      {/* Filter Card */}
      <div className="row mb-3">
        <div className="col-md-6">
          <div className="card card-primary">
            <div className="card-header">
              <h3 className="card-title">Filter Users</h3>
            </div>
            <div className="card-body">
              <Form.Group controlId="roleFilter">
                <Form.Label>Select Role</Form.Label>
                <Form.Control
                  as="select"
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                >
                  <option value="All">All</option>
                  {roles.map(r => (
                    <option key={r.role_id} value={r.role_name}>
                      {r.role_name}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title">Approved Users ({filteredUsers.length})</h3>
              <div className="btn-group">
                {['txt','csv','xlsx','pdf'].map(type => (
                  <button
                    key={type}
                    className="btn btn-info btn-sm"
                    onClick={() => exportData(type, exportList, columns, 'Approved Users')}
                  >
                    <i className="fas fa-download"></i> {type.toUpperCase()}
                  </button>
                ))}
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => printData(exportList, columns)}
                >
                  <i className="fas fa-print"></i> Print
                </button>
              </div>
            </div>
            <div className="card-body">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.user_id}>
                      <td>{u.first_name}</td>
                      <td>{u.last_name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td>{(userRoles[u.user_id] || []).join(', ')}</td>
                      <td>{u.status}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan="7">Total Users: {filteredUsers.length}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
