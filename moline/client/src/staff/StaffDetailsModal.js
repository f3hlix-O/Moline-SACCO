import React from 'react';
import { Modal } from 'react-bootstrap';
import StaffDetailsForm from './StaffDetailsForm';

const StaffDetailsModal = ({ showModal, closeModal }) => {
    return (
        <Modal show={showModal} onHide={closeModal} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Update Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <StaffDetailsForm closeModal={closeModal} />
            </Modal.Body>
        </Modal>
    );
};

export default StaffDetailsModal;
