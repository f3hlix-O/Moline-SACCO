import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button, Form, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../context/axiosInstance";
import { getUserDetails } from "../components/fleet";

const ShareholderPayment = () => {
  const [amount, setAmount] = useState(15000);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState(""); 
  const [userEmail, setUserEmail] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // user details to get the phone number and full name
    const fetchUserDetails = async () => {
      try {
        const userDetails = await getUserDetails();
        setPhoneNumber(userDetails?.phone || "");
        const fullName = `${userDetails?.first_name || ""} ${userDetails?.last_name || ""}`.trim();
        setUserName(fullName); 
        setUserEmail(userDetails?.email || "");
      } catch (error) {
        console.error("Error fetching user details:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch user details. Please try again later.",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    };

    fetchUserDetails();
  }, []);

  const handlePayment = async () => {
    if (!phoneNumber || !userEmail) {
      Swal.fire({
        icon: "error",
        title: "Missing data",
        text: "Please enter a valid phone number.",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      return;
    }

    try {
      const response = await axiosInstance.post("finance/payments/shareholder", {
        amount,
        phone: phoneNumber,
        user: userName, 
        email: userEmail,
      });

      if (response.status === 200) {
        setIsPaid(true);
        Swal.fire({
          icon: "success",
          title: "Payment Successful",
          text: "Your shareholder capital payment has been received.",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        }).then(() => {
          navigate("/users/home");
        });
      } else {
        throw new Error("Payment failed");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text: "An error occurred while processing your payment. Please try again.",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    }
  };

  return (
    <Modal show={showModal} centered backdrop="static" keyboard={false}>
      <Modal.Header>
        <Modal.Title>Shareholder Capital Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card className="p-4 shadow-sm">
          <Card.Body>
            <p className="text-center mb-4">
              You must pay KSH 15,000 to access the system.
            </p>
            <Form.Group controlId="paymentPhoneNumber" className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <Form.Control
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </Form.Group>
            <Form.Group controlId="paymentAmount">
              <Form.Label>Amount (KSH)</Form.Label>
              <Form.Control type="number" value={amount} disabled />
            </Form.Group>
            <div className="d-grid mt-4">
              <Button variant="primary" onClick={handlePayment}>
                Pay KSH 15,000
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Modal.Body>
    </Modal>
  );
};

export default ShareholderPayment;
