import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Dropdown, Button, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { fetchApprovedUsers, deleteUser, editUser, resetPassword } from '../components/users';

function Profile() {
    const [approvedUsers, setApprovedUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalImageSrc, setModalImageSrc] = useState('');

    useEffect(() => {
        const initializeData = async () => {
            const approvedUsers = await fetchApprovedUsers();
            setApprovedUsers(approvedUsers);
        };
        initializeData();
    }, []);

    const openModal = (imageSrc) => {
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
                        {users.map(user => (
                            <tr key={user.user_id}>
                                <td><Link to={`/admin/users/user_profile/${user.user_id}`}>{user.user_id}</Link></td>
                                <td>{user.first_name} {user.last_name}</td>
                                <td>{user.email}</td>
                                {title === 'Vehicle Owners' && (
                                    <td>
                                        <img
                                            src={user.ID_image}
                                            alt={`${user.first_name} ${user.last_name}`}
                                            className="img-thumbnail"
                                            style={{ width: '50px', height: '50px', cursor: 'pointer' }}
                                            onClick={() => openModal(user.ID_image)}
                                        />
                                    </td>
                                )}
                                <td>
                                    <Dropdown>
                                        <Dropdown.Toggle variant="light" id={`dropdown-${user.user_id}`}>
                                            <FontAwesomeIcon icon={faCog} />
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <Dropdown.Item onClick={() => editUser(user.user_id, setApprovedUsers)}>
                                                <FontAwesomeIcon icon="fas fa-pencil-alt" /> Edit
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={() => resetPassword(user.user_id)}>
                                                <FontAwesomeIcon icon="fas fa-key" /> Reset Password
                                            </Dropdown.Item>
                                            <Dropdown.Item onClick={() => deleteUser(user.user_id, setApprovedUsers)}>
                                                <FontAwesomeIcon icon="fas fa-trash-alt" /> Delete
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index}>{col}</th>
                            ))}
                            <th>Actions</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );

    const getUsersByRole = (roleName) => approvedUsers.filter(user => user.roles.includes(roleName));

    return (
        <div className="content-wrapper">
            <section className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            {renderTable('Admins', getUsersByRole('Admin'), ['ID', 'Name', 'Email'])}
                            {renderTable('Staff', getUsersByRole('Staff'), ['ID', 'Name', 'Email'])}
                            {renderTable('Vehicle Owners', getUsersByRole('Vehicle Owner'), ['ID', 'Name', 'Email', 'ID Image'])}
                            {renderTable('Drivers', getUsersByRole('Driver'), ['ID', 'Name', 'Email'])}
                        </div>
                    </div>
                </div>
            </section>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                </Modal.Header>
                <Modal.Body>
                    <img src={modalImageSrc} alt="ID Image" className="img-fluid" />
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default Profile;
