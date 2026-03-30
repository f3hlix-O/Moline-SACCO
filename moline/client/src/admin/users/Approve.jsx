import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Dropdown, Button, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import {
    fetchPendingUsers,
    fetchApprovedUsers,
    approveUser,
    disapproveUser
} from '../components/users';

function Approve() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [approvedUsers, setApprovedUsers] = useState([]);

    useEffect(() => {
        const initializeData = async () => {
            const approvedUsers = await fetchApprovedUsers();
            setApprovedUsers(approvedUsers);

            const pendingUsers = await fetchPendingUsers();
            setPendingUsers(pendingUsers);
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
                                            {pendingUsers.map(user => (
                                                <tr key={user.user_id}>
                                                    <td>{user.user_id}</td>
                                                    <td>{user.first_name} {user.last_name}</td>
                                                    <td>{user.email}</td>
                                                    <td><img src={user.ID_image} alt={`${user.first_name} ${user.last_name}`} className="img-thumbnail" style={{ width: '100px', height: '50px' }} /></td>
                                                    <td>
                                                        <Dropdown>
                                                            <Dropdown.Toggle variant="light" id={`dropdown-${user.user_id}`}>
                                                                <FontAwesomeIcon icon={faCog} />
                                                            </Dropdown.Toggle>
                                                            <Dropdown.Menu>
                                                                <Dropdown.Item onClick={() => approveUser(user.user_id, user.email, setPendingUsers)}>
                                                                    <FontAwesomeIcon icon="fas fa-pencil-alt" />Approve
                                                                </Dropdown.Item>
                                                                <Dropdown.Item onClick={() => disapproveUser(user.user_id, user.email, setPendingUsers)}>
                                                                    <FontAwesomeIcon icon="fas fa-key" /> Disapprove
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
                                            {approvedUsers.map(user => (
                                                <tr key={user.user_id}>
                                                    <td>{user.user_id}</td>
                                                    <td>{user.first_name} {user.last_name}</td>
                                                    <td>{user.email}</td>
                                                    <td><img src={user.ID_image} alt={`${user.first_name} ${user.last_name}`} className="img-thumbnail" style={{ width: '100px', height: '50px' }} /></td>
                                                    <td>
                                                        <Dropdown>
                                                            <Dropdown.Toggle variant="light" id={`dropdown-${user.user_id}`}>
                                                                <FontAwesomeIcon icon={faCog} />
                                                            </Dropdown.Toggle>
                                                            <Dropdown.Menu>
                                                                <Dropdown.Item onClick={() => approveUser(user.user_id, user.email, setPendingUsers)}>
                                                                    <FontAwesomeIcon icon="fas fa-pencil-alt" />Approve
                                                                </Dropdown.Item>
                                                                <Dropdown.Item onClick={() => disapproveUser(user.user_id, user.email, setPendingUsers)}>
                                                                    <FontAwesomeIcon icon="fas fa-key" /> Disapprove
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
        </div>
    );
}

export default Approve;
