import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button, Modal, Form, Card, Collapse } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faMoneyBillWave,
  faUserPlus,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import axiosInstance from "../../context/axiosInstance";
import { getUserDetails } from "./fleet";

function VehicleOwnerDashboard({ onAssignDriver }) {
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [error, setError] = useState(null);
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [driver, setDriver] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    driverLicenseNumber: "",
  });
  const [currentMatatuId, setCurrentMatatuId] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);

  // Predefined addresses for selection
  const addressOptions = [
    "Nairobi CBD",
    "Westlands",
    "Kilimani",
    "Lang'ata",
    "Karen",
  ];

  useEffect(() => {
    fetchOwnerInfo();
  }, []);

  const fetchOwnerInfo = async () => {
    try {
      const [userInfo, matatus] = await Promise.all([
        axiosInstance.get("/matatus/profile"),
        axiosInstance.get("/matatus/userMatatus"),
      ]);

      setOwnerInfo({
        userInfo: userInfo.data,
        matatus: matatus.data,
      });
    } catch (error) {
      console.error("Error fetching owner information:", error);
      setError("Failed to fetch owner information");
    }
  };

  const handleAssignDriver = async (matatuId) => {
    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "phone",
      "address",
      "driverLicenseNumber",
    ];
    for (const field of requiredFields) {
      if (!driver[field] || driver[field].toString().trim() === "") {
        Swal.fire("Error", `Please provide ${field}`, "error");
        return;
      }
    }

    // Map frontend driver object to backend expected field names
    const payload = {
      // backend expects matatu id in the URL param, but include for clarity
      matatuId,
      first_name: driver.firstName,
      last_name: driver.lastName,
      phone: driver.phone,
      address: driver.address,
      driver_license_number: driver.driverLicenseNumber,
    };

    console.log("Sending driver assignment payload:", payload);

    try {
      // Exact backend route is POST /matatus/:id/assignDriver
      const response = await axiosInstance.post(
        `/matatus/${matatuId}/assignDriver`,
        payload,
      );

      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Driver Assigned",
          text:
            response.data?.message ||
            "The driver has been successfully assigned.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        fetchOwnerInfo();
        setShowAssignDriver(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Assignment Failed",
          text:
            response.data?.error || "There was an error assigning the driver.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      }
    } catch (error) {
      console.error("Error assigning driver:", error);
      const serverMsg =
        error.response?.data?.error ||
        error.message ||
        "There was an error assigning the driver.";
      Swal.fire({
        icon: "error",
        title: "Assignment Failed",
        text: serverMsg,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  const openAssignDriverModal = (matatuId) => {
    setCurrentMatatuId(matatuId);
    setShowAssignDriver(true);
  };

  const handleDriverChange = (e) => {
    const { name, value } = e.target;
    setDriver((prevDriver) => ({
      ...prevDriver,
      [name]: value,
    }));
  };

  const handlePay = async (plateNumber, matatu_id) => {
    try {
      const userDetails = await getUserDetails();
      const userPhoneNumber = userDetails?.phone || "";

      const { value: formValues } = await Swal.fire({
        title: "Enter Payment Details",
        html:
          `<input id="swal-input1" class="swal2-input" placeholder="Phone Number" value="${userPhoneNumber}" required>` +
          '<input id="swal-input2" class="swal2-input" placeholder="Amount" required>',
        focusConfirm: false,
        preConfirm: () => {
          const phoneNumber = document.getElementById("swal-input1").value;
          const amount = document.getElementById("swal-input2").value;

          if (!phoneNumber || !amount) {
            Swal.showValidationMessage("All fields are required");
            return null;
          }

          const phoneNumberPattern = /^07\d{8}$/;
          if (!phoneNumberPattern.test(phoneNumber)) {
            Swal.showValidationMessage("Invalid phone number");
            return null;
          }

          if (isNaN(amount) || amount <= 0) {
            Swal.showValidationMessage("Invalid amount");
            return null;
          }

          return [phoneNumber, amount];
        },
      });

      if (formValues) {
        const [phoneNumber, amount] = formValues;

        try {
          const response = await axiosInstance.post("/finance/processPayment", {
            amount,
            phone: phoneNumber,
            vehicleRegistrationNumber: plateNumber,
            matatu_id,
          });

          const result = response.data;

          if (response.status === 200) {
            Swal.fire("Success", result.message, "success");

            const checkPaymentStatus = async (checkoutRequestId) => {
              const statusResponse = await axiosInstance.get(
                `/finance/checkPaymentStatus?CheckoutRequestID=${checkoutRequestId}`,
              );
              return statusResponse.data;
            };

            let paymentStatus = null;
            const maxRetries = 10;
            let retries = 0;

            while (retries < maxRetries) {
              paymentStatus = await checkPaymentStatus(
                result.CheckoutRequestID,
              );
              if (paymentStatus.status === "completed") break;
              await new Promise((resolve) => setTimeout(resolve, 5000));
              retries++;
            }

            if (paymentStatus?.status === "completed") {
              Swal.fire(
                "Success",
                `Payment of KES ${amount} processed successfully with Mpesa receipt number ${paymentStatus.mpesaReceiptNumber}`,
                "success",
              );
            } else {
              Swal.fire(
                "Error",
                "Payment processing timeout or failed",
                "error",
              );
            }
          } else {
            Swal.fire(
              "Error",
              result.error || "Failed to initiate payment",
              "error",
            );
          }
        } catch (error) {
          console.error("Error processing payment:", error);
          Swal.fire("Error", "Failed to process payment", "error");
        }
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      Swal.fire("Error", "Failed to fetch user details", "error");
    }
  };

  const toggleCard = (index) => {
    setExpandedCardId(expandedCardId === index ? null : index);
  };

  return (
    <div className="content-wrapper">
      <section className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1>Dashboard</h1>
            </div>
            <div className="col-sm-6 text-sm-right mt-2 mt-sm-0">
              <Link to="/users/addVehicle">
                <Button variant="primary">Register Vehicle</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="content">
        <div className="container-fluid">
          {error && (
            <div className="alert alert-danger">
              Error fetching owner information: {error}
            </div>
          )}
          {ownerInfo && (
            <div className="row">
              {ownerInfo.matatus.length > 0 ? (
                ownerInfo.matatus.map((matatu, index) => (
                  <div key={index} className="col-md-6 mb-4">
                    <Card>
                      <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <FontAwesomeIcon icon={faCar} className="me-2" />
                            <strong>{matatu.number_plate}</strong>
                          </div>
                          <div>
                            <Button
                              variant="light"
                              onClick={() => toggleCard(index)}
                            >
                              <FontAwesomeIcon
                                icon={
                                  expandedCardId === index
                                    ? faChevronUp
                                    : faChevronDown
                                }
                              />
                            </Button>
                          </div>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>Status:</strong> {matatu.status}
                          </div>
                          <div>
                            <Button
                              variant="success"
                              onClick={() =>
                                handlePay(matatu.number_plate, matatu.matatu_id)
                              }
                            >
                              <FontAwesomeIcon
                                icon={faMoneyBillWave}
                                className="me-2"
                              />
                              Make Daily Remittance
                            </Button>
                            {!matatu.driver_first_name && (
                              <Button
                                variant="warning"
                                className="ms-2"
                                onClick={() =>
                                  openAssignDriverModal(matatu.matatu_id)
                                }
                              >
                                <FontAwesomeIcon
                                  icon={faUserPlus}
                                  className="me-2"
                                />
                                Assign Driver
                              </Button>
                            )}
                          </div>
                        </div>
                        <Collapse in={expandedCardId === index}>
                          <div className="mt-3">
                            <div>
                              <strong>Driver:</strong>{" "}
                              {matatu.driver_first_name
                                ? `${matatu.driver_first_name} ${matatu.driver_last_name}`
                                : "Not Assigned"}
                            </div>
                            <div>
                              <strong>Savings:</strong> KES{" "}
                              {matatu.total_savings}
                            </div>
                            <div>
                              <strong>Loan:</strong> KES{" "}
                              {matatu.loan || "No Loan"}
                            </div>
                            <div>
                              <strong>Next Insurance Expiry:</strong>{" "}
                              {format(
                                new Date(matatu.insurance_expiry),
                                "yyyy-MM-dd",
                              )}
                            </div>
                            <div>
                              <strong>Insurance:</strong> 3000/6500 (46.15%
                              paid)
                            </div>
                          </div>
                        </Collapse>
                      </Card.Body>
                    </Card>
                  </div>
                ))
              ) : (
                <p className="col-12">No registered vehicles found.</p>
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
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter First Name"
                name="firstName"
                value={driver.firstName}
                onChange={handleDriverChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Last Name"
                name="lastName"
                value={driver.lastName}
                onChange={handleDriverChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Phone"
                name="phone"
                value={driver.phone}
                onChange={handleDriverChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Address</Form.Label>
              <Form.Select
                name="address"
                value={driver.address}
                onChange={handleDriverChange}
              >
                <option value="">Select Address</option>
                {addressOptions.map((addr, idx) => (
                  <option key={idx} value={addr}>
                    {addr}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Driver License Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter Driver License Number"
                name="driverLicenseNumber"
                value={driver.driverLicenseNumber}
                onChange={handleDriverChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAssignDriver(false)}
          >
            Close
          </Button>
          <Button
            variant="warning"
            onClick={() => handleAssignDriver(currentMatatuId)}
          >
            Assign Driver
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default VehicleOwnerDashboard;
