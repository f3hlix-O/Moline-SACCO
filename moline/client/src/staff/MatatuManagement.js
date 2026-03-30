import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Modal, Form, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../context/axiosInstance';
import { format } from 'date-fns';

function VehicleOwnerDashboard({ onAssignDriver }) {
    const [ownerInfo, setOwnerInfo] = useState(null);
    const [error, setError] = useState(null);
    const [showAssignDriver, setShowAssignDriver] = useState(false);
    const [driver, setDriver] = useState('');
    const [currentMatatuId, setCurrentMatatuId] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    useEffect(() => {
        fetchOwnerInfo();
    }, []);

    const fetchOwnerInfo = async () => {
        try {
            const [userInfo, matatus] = await Promise.all([
                axiosInstance.get('/matatus/profile'),
                axiosInstance.get('/matatus/userMatatus')
            ]);

            setOwnerInfo({
                userInfo: userInfo.data,
                matatus: matatus.data
            });
        } catch (error) {
            console.error('Error fetching owner information:', error);
            setError('Failed to fetch owner information');
        }
    };

    const toggleDropdown = (index) => {
        setOpenDropdownId(openDropdownId === index ? null : index);
    };

    const handleAssignDriver = (matatuId) => {
        // Mock function for demonstration, replace with actual logic
        console.log(`Assigning driver ${driver} to matatu ID ${matatuId}`);
        setShowAssignDriver(false);
    };

    const openAssignDriverModal = (matatuId) => {
        setCurrentMatatuId(matatuId);
        setShowAssignDriver(true);
    };

    const handlePay = async (plateNumber, matatu_id) => {
        const { value: formValues } = await Swal.fire({
            title: 'Enter Payment Details',
            html:
                '<input id="swal-input1" class="swal2-input" placeholder="Phone Number" required>' +
                '<input id="swal-input2" class="swal2-input" placeholder="Amount" required>',
            focusConfirm: false,
            preConfirm: () => {
                const phoneNumber = document.getElementById('swal-input1').value;
                const amount = document.getElementById('swal-input2').value;
                if (!phoneNumber || !amount) {
                    Swal.showValidationMessage('All fields are required');
                    return null;
                }
    
                const phoneNumberPattern = /^07\d{8}$/;
                if (!phoneNumberPattern.test(phoneNumber)) {
                    Swal.showValidationMessage('Invlid phone number');
                    return null;
                }
    
                if (isNaN(amount) || amount <= 0) {
                    Swal.showValidationMessage('Invalid amount');
                    return null;
                }
    
                return [phoneNumber, amount];
            }
        });
    
        if (formValues) {
            const [phoneNumber, amount] = formValues;
            try {
                // Send the payment request to the server
                const response = await axiosInstance.post('/finance/processPayment', {
                    amount,
                    phone: phoneNumber,
                    vehicleRegistrationNumber: plateNumber,
                    matatu_id
                });
    
                const result = response.data;
    
                if (response.status === 200) {
                    // Show success message with the response message
                    Swal.fire('Success', result.message, 'success');
    
                    // Optionally, you can poll the server to check for the callback response
                    const checkPaymentStatus = async (checkoutRequestId) => {
                        const statusResponse = await axiosInstance.get(`/finance/checkPaymentStatus?CheckoutRequestID=${checkoutRequestId}`);
                        return statusResponse.data;
                    };
    
                    let paymentStatus = null;
                    const maxRetries = 10;
                    let retries = 0;
    
                    while (retries < maxRetries) {
                        paymentStatus = await checkPaymentStatus(result.CheckoutRequestID);
                        if (paymentStatus.status === 'completed') {
                            break;
                        }
                        await new Promise(resolve => setTimeout(resolve, 5000)); 
                        retries++;
                    }
    
                    if (paymentStatus && paymentStatus.status === 'completed') {
                        Swal.fire('Success', `Payment of KES ${amount} processed successfully with Mpesa receipt number ${paymentStatus.mpesaReceiptNumber}`, 'success');
                    } else {
                        Swal.fire('Error', 'Payment processing timeout or failed', 'error');
                    }
                } else {
                    Swal.fire('Error', result.error || 'Failed to initiate payment', 'error');
                }
            } catch (error) {
                console.error('Error processing payment:', error);
                Swal.fire('Error', 'Failed to process payment', 'error');
            }
        }
    };

    return (
        <div className="content-wrapper">
            <section className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col-sm-6">
                            <h1>Dashboard</h1>
                        </div>
                        <div className="col-sm-6">
                            <Link to="/users/addVehicle">
                                <Button variant="primary" className="float-right">Register Vehicle</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="content">
                <div className="container-fluid">
                    {error && <div className="alert alert-danger">Error fetching owner information: {error}</div>}
                    {ownerInfo && (
                        <div className="row">
                            {ownerInfo.matatus.length > 0 ? (
                                ownerInfo.matatus.map((matatu, index) => (
                                    <div key={index} className="col-lg-12 mb-3">
                                        <div className="card">
                                            <div className="card-body">
                                                <div className="row">
                                                    <div className="col-md-2">
                                                        <strong>Plate Number:</strong>
                                                        <p>{matatu.number_plate}</p>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <strong>Driver:</strong>
                                                        <p>{matatu.driver_first_name ? `${matatu.driver_first_name} ${matatu.driver_last_name}` : 'Not Assigned'}</p>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <strong>Savings:</strong>
                                                        <p>KES {matatu.savings}</p>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <strong>Loan:</strong>
                                                        <p>KES {matatu.loan || 'No Loan'}</p>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <strong>Next Insurance Expiry:</strong>
                                                        <p>{format(new Date(matatu.insurance_expiry), 'yyyy-MM-dd')}</p>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <strong>Status:</strong>
                                                        <p>{matatu.status}</p>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <strong>Actions:</strong>
                                                        <p>
                                                        <Dropdown show={openDropdownId === index} onToggle={() => toggleDropdown(index)}>
                                                            <Dropdown.Toggle variant="light" id={`dropdown-${index}`}>
                                                                <FontAwesomeIcon icon={faCog} />
                                                            </Dropdown.Toggle>
                                                            <Dropdown.Menu>
                                                                {!matatu.driver_first_name && (
                                                                    <Dropdown.Item onClick={() => openAssignDriverModal(matatu.matatu_id)}>Assign Driver</Dropdown.Item>
                                                                )}
                                                                <Dropdown.Item onClick={() => handlePay(matatu.number_plate, matatu.matatu_id)}>Pay</Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown></p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>No registered vehicles found.</p>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <Modal show={showAssignDriver} onHide={() => setShowAssignDriver(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Assign Driver</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>Driver ID</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter Driver ID"
                                value={driver}
                                onChange={e => setDriver(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAssignDriver(false)}>
                        Close
                    </Button>
                    <Button variant="warning" onClick={() => handleAssignDriver(currentMatatuId)}>
                        Assign Driver
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default VehicleOwnerDashboard;