import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faFileUpload,
  faMoneyBillWave,
  faHandshake,
  faMapMarkerAlt,
  faClipboardList,
  faCreditCard,
  faUserGraduate,
} from "@fortawesome/free-solid-svg-icons";
import "./HowToJoin.css"; // Custom styling

const HowToJoin = () => {
  const [logbook, setLogbook] = useState(null);

  const handleFileUpload = (event) => {
    setLogbook(event.target.files[0]);
  };

  return (
    <div className="container-body join-sacco-page my-5">
      {/* Hero Section */}
      <motion.div 
        className="text-center text-white bg-primary rounded p-5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
      </motion.div>
      <motion.div 
        className="text-center text-white bg-primary rounded p-5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="fw-bold">Join <span className="text-warning">Moline SACCO</span></h1>
        <p className="lead">Empowering Matatu Owners for a Brighter Future</p>
      </motion.div>

      {/* Membership Requirements */}
      <section className="mt-5">
        <h2 className="text-center text-success">Membership Requirements</h2>
        <div className="row mt-4">
          {[
            { text: "Own a matatu", icon: faCheckCircle },
            { text: "Licensed to operate on Kenyan roads", icon: faMapMarkerAlt },
            { text: "Meet KENHA requirements", icon: faClipboardList },
            { text: "Upload Logbook", icon: faFileUpload },
          ].map((req, index) => (
            <motion.div 
              key={index} 
              className="col-md-6 mb-3"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.2 }}
            >
              <Card className="shadow border-0 requirement-card">
                <Card.Body className="d-flex align-items-center">
                  <FontAwesomeIcon icon={req.icon} className="text-success me-3" size={24} />
                  <Card.Text className="m-0 fw-bold">{req.text}</Card.Text>
                </Card.Body>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Step-by-Step Guide */}
      <section className="mt-5">
        <h2 className="text-center text-primary">Step-by-Step Process</h2>
        <motion.ol 
          className="list-group list-group-numbered mt-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {[
            "Visit the SACCO office or website to register",
            "Complete the application form",
            "Submit required documents (ID, proof of residence, business registration)",
            "Pay share capital & fees",
            "Attend an orientation session",
          ].map((step, index) => (
            <motion.li 
              key={index} 
              className="list-group-item py-3"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.2 }}
            >
              {step}
            </motion.li>
          ))}
        </motion.ol>
      </section>

      {/* Cost Breakdown */}
      <section className="mt-5">
        <h2 className="text-center text-danger">Cost Breakdown</h2>
        <div className="row mt-4">
          {[
            { title: "Initial Share Capital", amount: "KES 15,000", icon: faMoneyBillWave },
            { title: "Daily Operation Fee", amount: "KES 250", icon: faCreditCard },
            { title: "Daily Insurance Remittance", amount: "KES 250", icon: faHandshake },
            { title: "Savings", amount: "Any Amount-(Loans)", icon: faUserGraduate },
          ].map((cost, index) => (
            <motion.div 
              key={index} 
              className="col-md-6 mb-3"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.2 }}
            >
              <Card className="shadow border-0 text-center cost-card">
                <Card.Body>
                  <FontAwesomeIcon icon={cost.icon} className="text-primary mb-2" size={32} />
                  <h5 className="card-title">{cost.title}</h5>
                  <p className="card-text text-success fw-bold">{cost.amount}</p>
                </Card.Body>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HowToJoin;
