import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchApprovedUsers, fetchRoles, fetchUserRoles, assignRole } from '../components/users';

function Roles() {
    const [approvedUsers, setApprovedUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [userRoles, setUserRoles] = useState({});
    const [selectedRoles, setSelectedRoles] = useState({});
    const [selectedPositions, setSelectedPositions] = useState({});

    const positions = ["Chairperson", "Secretary", "Treasurer", "Chief Whip"];

    useEffect(() => {
        const initializeData = async () => {
            const approvedUsersData = await fetchApprovedUsers();
            setApprovedUsers(approvedUsersData);

            const rolesData = await fetchRoles();
            setRoles(rolesData);

            const userRolesData = await fetchUserRoles(approvedUsersData.map(user => user.user_id));
            setUserRoles(userRolesData);
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
                                    <h3 className="card-title">Approved Users - Role Management</h3>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Current Roles</th>
                                                <th>Add Additional Role</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {approvedUsers.map(user => (
                                                <tr key={user.user_id}>
                                                    <td>{user.user_id}</td>
                                                    <td>{user.first_name} {user.last_name}</td>
                                                    <td>{user.email}</td>
                                                    <td>
                                                        {userRoles[user.user_id] ? userRoles[user.user_id].join(', ') : 'No additional roles assigned'}
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="form-control mr-2"
                                                            onChange={(e) => {
                                                                const selectedRole = e.target.value;
                                                                const newSelectedRoles = { ...selectedRoles };
                                                                newSelectedRoles[user.user_id] = selectedRole;
                                                                setSelectedRoles(newSelectedRoles);

                                                                if (selectedRole !== 'staff') {
                                                                    const newSelectedPositions = { ...selectedPositions };
                                                                    delete newSelectedPositions[user.user_id];
                                                                    setSelectedPositions(newSelectedPositions);
                                                                }
                                                            }}
                                                        >
                                                            <option value="">Select Role to Add</option>
                                                            {roles.map(role => (
                                                                <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                                                            ))}
                                                        </select>
                                                        {selectedRoles[user.user_id] === 'staff' && (
                                                            <>
                                                                <label className="mt-2">Select Position</label>
                                                                <select
                                                                    className="form-control mr-2 mt-2"
                                                                    onChange={(e) => {
                                                                        const newSelectedPositions = { ...selectedPositions };
                                                                        newSelectedPositions[user.user_id] = e.target.value;
                                                                        setSelectedPositions(newSelectedPositions);
                                                                    }}
                                                                >
                                                                    <option value="">Select Position</option>
                                                                    {positions.map(position => (
                                                                        <option key={position} value={position}>{position}</option>
                                                                    ))}
                                                                </select>
                                                            </>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                const roleToAdd = selectedRoles[user.user_id];
                                                                const position = selectedPositions[user.user_id] || null;
                                                                if (roleToAdd) {
                                                                    assignRole(user.user_id, roleToAdd, position, setUserRoles);
                                                                }
                                                            }}
                                                            className="btn btn-primary btn-sm mt-2"
                                                        >
                                                            Add Role
                                                        </button>
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
        </div>
    );
}

export default Roles;
