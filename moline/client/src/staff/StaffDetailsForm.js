import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
// import SpinnerComponent from './Spinner';
import axiosInstance from '../context/axiosInstance';

const StaffDetailsForm = ({ closeModal }) => {
    const [details, setDetails] = useState({
        bank_name: '',
        bank_account_number: '',
        nhif_number: '',
    });
    const [editMode, setEditMode] = useState(false);
    const [updatedDetails, setUpdatedDetails] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await axiosInstance.get('/staff/details/user');

                if (!response.data) {
                    throw new Error('User details not found.');
                }

                setDetails(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching staff details:', error);
                setLoading(false);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `Failed to fetch staff details: ${error.message}`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 5000,
                    timerProgressBar: true,
                });
            }
        };

        fetchDetails();
    }, []);

    const handleEdit = () => {
        setEditMode(true);
        // Initialize updatedDetails with current details
        setUpdatedDetails({ ...details });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUpdatedDetails({ ...updatedDetails, [name]: value });
    };

    const handleSave = async () => {
        try {
            const response = await axiosInstance.put('/staff/details/update');

            if (!response.data) {
                throw new Error('Failed to update staff details.');
            }

            // Update details with updatedDetails
            setDetails({ ...updatedDetails });
            setEditMode(false);
            closeModal(); // Close modal after saving

            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Staff details updated successfully',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error('Error updating staff details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: `Failed to update staff details: ${error.message}`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
            });
        }
    };

    if (loading) {
        return <SpinnerComponent />;
    }

    return (
        <div>
            <div className="row">
                <div className="col-md-6">
                    <label>Bank Name</label>
                </div>
                <div className="col-md-6">
                    {editMode ? (
                        <input
                            type="text"
                            name="bank_name"
                            value={updatedDetails.bank_name}
                            onChange={handleInputChange}
                            className="form-control"
                        />
                    ) : (
                        <p>{details.bank_name}</p>
                    )}
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <label>Bank Account Number</label>
                </div>
                <div className="col-md-6">
                    {editMode ? (
                        <input
                            type="text"
                            name="bank_account_number"
                            value={updatedDetails.bank_account_number}
                            onChange={handleInputChange}
                            className="form-control"
                        />
                    ) : (
                        <p>{details.bank_account_number}</p>
                    )}
                </div>
            </div>
            <div className="row">
                <div className="col-md-6">
                    <label>NHIF Number</label>
                </div>
                <div className="col-md-6">
                    {editMode ? (
                        <input
                            type="text"
                            name="nhif_number"
                            value={updatedDetails.nhif_number}
                            onChange={handleInputChange}
                            className="form-control"
                        />
                    ) : (
                        <p>{details.nhif_number}</p>
                    )}
                </div>
            </div>

            <div className="text-right mt-3">
                {!editMode && (
                    <button className="btn btn-primary" onClick={handleEdit}>Edit</button>
                )}
                {editMode && (
                    <>
                        <button className="btn btn-success mr-2" onClick={handleSave}>Save</button>
                        <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default StaffDetailsForm;
