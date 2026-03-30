import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Dropdown, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import {
    fetchPendingUsers,
    fetchApprovedUsers,
    fetchRoles,
    fetchUserRoles,
    assignRole,
    approveUser,
    disapproveUser
} from '../components/users';

function Users() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [approvedUsers, setApprovedUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [userRoles, setUserRoles] = useState({});

    useEffect(() => {
        const initializeData = async () => {
            setPendingUsers(await fetchPendingUsers());
            const approved = await fetchApprovedUsers();
            setApprovedUsers(approved);
            const rolesData = await fetchRoles();
            setRoles(rolesData);
            const userRolesData = await fetchUserRoles(approved.map(user => user.user_id));
            setUserRoles(userRolesData);
        };
        initializeData();
    }, []);

    return (
        <div className="p-1 bg-gray-100 min-h-screen content-wrapper">
            <section className="container mx-auto">
                <div className="mb-8">
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-xl font-semibold">Users Pending Approval</h3>
                        </div>
                        <div className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">ID Image</th>
                                            <th className="px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pendingUsers.map(user => (
                                            <tr key={user.user_id}>
                                                <td className="px-1 py-1 text-sm text-gray-900">{user.user_id}</td>
                                                <td className="px-1 py-1 text-sm text-gray-500">{user.first_name} {user.last_name}</td>
                                                <td className="px-1 py-1 text-sm text-gray-500">{user.email}</td>
                                                <td className="px-1 py-1 text-sm">
                                                    <img src={user.ID_image} alt={`${user.first_name} {user.last_name}`} className="w-8 h-8 object-cover rounded" />
                                                </td>
                                                <td className="px-1 py-1 text-sm font-medium">
                                                    <Dropdown>
                                                        <Dropdown.Toggle variant="light" id={`dropdown-${user.user_id}`} className="text-gray-600 hover:text-gray-900">
                                                            <FontAwesomeIcon icon={faCog} />
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            <Dropdown.Item onClick={() => approveUser(user.user_id, user.email, setPendingUsers)}>Approve</Dropdown.Item>
                                                            <Dropdown.Item onClick={() => disapproveUser(user.user_id, user.email, setPendingUsers)}>Disapprove</Dropdown.Item>
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
                <div>
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-xl font-semibold">Approved Users</h3>
                        </div>
                        <div className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">ID Image</th>
                                            <th className="px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Role</th>
                                            <th className="px-1 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {approvedUsers.map(user => (
                                            <tr key={user.user_id}>
                                                <td className="px-1 py-1 text-sm text-gray-900">{user.user_id}</td>
                                                <td className="px-1 py-1 text-sm text-gray-500">{user.first_name} {user.last_name}</td>
                                                <td className="px-1 py-1 text-sm text-gray-500">{user.email}</td>
                                                <td className="px-1 py-1 text-sm">
                                                    <img src={user.ID_image} alt={`${user.first_name} {user.last_name}`} className="w-8 h-8 object-cover rounded" />
                                                </td>
                                                <td className="px-1 py-1 text-sm text-gray-500">
                                                    {userRoles[user.user_id] ? userRoles[user.user_id].join(', ') : 'No role assigned'}
                                                </td>
                                                <td className="px-1 py-1 text-sm font-medium">
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                                                        <select
                                                            className="form-select block w-full sm:w-auto mt-1 border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50 text-sm"
                                                            onChange={(e) => user.selectedRole = e.target.value}
                                                        >
                                                            <option value="">Select Role</option>
                                                            {roles.map(role => (
                                                                <option key={role.role_id} value={role.role_id}>{role.role_name}</option>
                                                            ))}
                                                        </select>
                                                        <Button
                                                            onClick={() => assignRole(user.user_id, user.selectedRole)}
                                                            className="btn btn-primary text-sm btn-sm"
                                                        >
                                                            {userRoles[user.user_id] ? 'Add Role' : 'Assign Role'}
                                                        </Button>
                                                        <Dropdown>
                                                            <Dropdown.Toggle variant="light" id={`dropdown-${user.user_id}`} className="text-gray-600 hover:text-gray-900 text-sm">
                                                                <FontAwesomeIcon icon={faCog} />
                                                            </Dropdown.Toggle>
                                                            <Dropdown.Menu>
                                                                <Dropdown.Item onClick={() => approveUser(user.user_id, user.email, setPendingUsers)}>Approve</Dropdown.Item>
                                                                <Dropdown.Item onClick={() => disapproveUser(user.user_id, user.email, setPendingUsers)}>Disapprove</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Users;
