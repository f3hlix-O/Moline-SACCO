import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button, Form } from 'react-bootstrap';
import axiosInstance from '../../../context/axiosInstance';

const fetchUserData = async () => {
    try {
        const response = await axiosInstance.get('/finance/userFinance');

        if (response.status !== 200) {
            throw new Error('Failed to fetch user data');
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
};

const fetchMatatus = async () => {
    try {
        const response = await axiosInstance.get('/matatus/userMatatus');

        if (response.status !== 200) {
            throw new Error('Failed to fetch user matatus');
        }
        console.log("Matatu data",response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching user matatus:', error);
        return null;
    }
};

const fetchPendingLoans = async () => {
    try {
        const response = await axiosInstance.get('/finance/pendingLoans');

        if (response.status !== 200) {
            throw new Error('Failed to fetch pending loans');
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching pending loans:', error);
        return [];
    }
};

const fetchUsers = async () => {
    try {
        const response = await axiosInstance.get('/users');
        if (response.status !== 200) {
            throw new Error('Failed to fetch users');
        }
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};

function LoanApplication() {
    const [userData, setUserData] = useState(null);
    const [matatus, setMatatus] = useState([]);
    const [loanType, setLoanType] = useState(null);
    const [pendingLoans, setPendingLoans] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedMatatu, setSelectedMatatu] = useState(null);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedGuarantors, setSelectedGuarantors] = useState([]);

    useEffect(() => {
        fetchUserData().then(data => setUserData(data));
        fetchMatatus().then(matatus => setMatatus(matatus));
        fetchPendingLoans().then(data => setPendingLoans(data));
        fetchUsers().then(users => setUsers(users));
    }, []);

    const handleApplyLoan = (matatu_id, type) => {
        const selectedMatatu = matatus.find(matatu => matatu.matatu_id === matatu_id);
        const emergencyLoanPending = pendingLoans.some(loan => loan.loan_type === 'emergency');

        if (type === 'emergency' && emergencyLoanPending) {
            Swal.fire({
                icon: 'error',
                title: 'Unable to Apply',
                text: 'You cannot apply for another emergency loan before completing the previous emergency loan.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            return;
        }

        if (type === 'normal') {
            const hasPendingLoan = pendingLoans.some(loan => loan.matatu_id === matatu_id);
            if (hasPendingLoan || selectedMatatu.loan > selectedMatatu.savings) {
                Swal.fire({
                    icon: 'error',
                    title: 'Unable to Apply',
                    text: 'There is a pending loan.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
                return;
            }
        }

        setSelectedMatatu(selectedMatatu);
        setLoanType(type);
        setShowModal(true);
    };

    const handleGuarantorSearch = (event) => {
        const query = event.target.value.toLowerCase();
        const filtered = users.filter(user =>
            user.first_name.toLowerCase().includes(query) || user.last_name.toLowerCase().includes(query)
        );
        setFilteredUsers(filtered);
    };

    const handleGuarantorSelect = (event) => {
        const selectedOptions = Array.from(event.target.selectedOptions).map(option => ({
            user_id: option.value,
            name: option.text
        }));
        setSelectedGuarantors(prev => [...prev, ...selectedOptions]);
    };

    const handleSubmitApplication = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        formData.append('loanType', loanType);
        const loanAmount = parseFloat(formData.get('loanAmount'));

        if (loanAmount <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Loan Amount',
                text: 'The loan amount must be greater than zero.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            return;
        }

        if (loanType === 'normal') {
            formData.append('matatuId', selectedMatatu.matatu_id);
            if (loanAmount > selectedMatatu.savings) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Loan Amount',
                    text: 'The loan amount cannot exceed the savings balance.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
                return;
            }
        } else {
            if (loanAmount > 30000) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Loan Amount',
                    text: 'The loan amount for an emergency loan cannot exceed KES 30,000.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
                return;
            }
            const guarantorIds = selectedGuarantors.map(guarantor => guarantor.user_id);
            formData.append('guarantors', JSON.stringify(guarantorIds));
        }

        try {
            const response = await axiosInstance.post('/finance/applyLoan', formData);

            if (response.status >= 200 && response.status < 300) {
                Swal.fire({
                    icon: 'success',
                    title: 'Application Submitted',
                    text: 'Your loan application has been submitted successfully.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });

                fetchUserData().then(data => setUserData(data));
                fetchPendingLoans().then(loans => setPendingLoans(loans));
                setShowModal(false);
                setLoanType(null);
                setSelectedMatatu(null);
            } else {
                throw new Error('Failed to apply for loan');
            }
        } catch (error) {
            console.error('Error applying for loan:', error);
            Swal.fire({
                icon: 'error',
                title: 'Application Failed',
                text: 'An error occurred while submitting your loan application. Please try again later.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
        }
    };

    if (!userData || !matatus) {
        return <div className="text-center">Loading...</div>;
    }

    const { shareCapitalPaid, isFullyRegistered } = userData;
    const maxEmergencyLoan = 30000;

    return (
        <div className="content-wrapper">
            <section className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="card-header">
                                <h3 className="card-title">Matatu</h3>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="user-info mb-3">
                                <table className="table table-bordered table-hover">
                                    <thead>
                                        <tr>
                                            <th>Number Plate</th>
                                            <th>Savings</th>
                                            <th>Loan</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matatus.map(data => (
                                            <tr key={data.matatu_id}>
                                                <td>{data.number_plate}</td>
                                                <td>{data.total_savings}</td>
                                                <td>{data.loan}</td>
                                                <td>
                                                    <button
                                                        onClick={() => handleApplyLoan(data.matatu_id, 'normal')}
                                                        className="btn btn-primary mr-2"
                                                        style={{ cursor: data.savings === 0 ? 'not-allowed' : 'pointer' }}
                                                        disabled={data.savings === 0}
                                                    >
                                                        Apply for Loan
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Loan Application</h3>
                                </div>
                                <div className="card-body">
                                    <div className="user-info mb-3">
                                        <p><strong>Eligible for Emergency Loan:</strong> KES {maxEmergencyLoan}</p>
                                    </div>
                                    <div className="loan-buttons mb-3">
                                        <button
                                            onClick={() => handleApplyLoan(null, 'emergency')}
                                            className="btn btn-primary"
                                            disabled={pendingLoans.some(loan => loan.loan_type === 'emergency')}
                                        >
                                            Apply for Emergency Loan
                                        </button>
                                    </div>
                                    {pendingLoans.length > 0 && (
                                        <div className="pending-loans mt-4">
                                            <h4>Pending Loans</h4>
                                            <ul className="list-group">
                                                {pendingLoans.map(loan => (
                                                    <li key={loan.loan_id} className="list-group-item">
                                                        <strong>Loan Type:</strong> {loan.loan_type}<br />
                                                        <strong>Amount:</strong> KES {loan.amount_applied}<br />
                                                        <strong>Status:</strong> Pending Approval
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Loan Application Form</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmitApplication}>
                        <Form.Group controlId="loanAmount">
                            <Form.Label>Loan Amount</Form.Label>
                            <Form.Control type="number" name="loanAmount" required />
                        </Form.Group>
                        {loanType === 'normal' && (
                            <Form.Group controlId="matatuId">
                                <Form.Label>Matatu</Form.Label>
                                <Form.Control type="text" readOnly value={selectedMatatu?.number_plate || ''} />
                            </Form.Group>
                        )}
                        {loanType === 'emergency' && (
                            <>
                                <Form.Group controlId="guarantorSearch">
                                    <Form.Label>Guarantor Search</Form.Label>
                                    <Form.Control type="text" onChange={handleGuarantorSearch} placeholder="Search for guarantors by name" />
                                </Form.Group>
                                <Form.Group controlId="guarantors">
                                    <Form.Label>Select Guarantors</Form.Label>
                                    <Form.Control as="select" multiple onChange={handleGuarantorSelect}>
                                        {filteredUsers.map(user => (
                                            <option key={user.user_id} value={user.user_id}>
                                                {user.first_name} {user.last_name}
                                            </option>
                                        ))}
                                    </Form.Control>
                                </Form.Group>
                                <div>
                                    <h5>Selected Guarantors:</h5>
                                    <ul>
                                        {selectedGuarantors.map(guarantor => (
                                            <li key={guarantor.user_id}>{guarantor.name}</li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                        <Button variant="primary" type="submit">
                            Submit Application
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default LoanApplication;
