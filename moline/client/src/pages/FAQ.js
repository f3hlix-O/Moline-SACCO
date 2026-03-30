import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, Container } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";
import "./FAQ.css"; // Custom CSS for FAQ-specific styling

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  // Toggle FAQ answer visibility
  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  // Sample FAQ data
  const faqs = [
    {
      question: "What is the Moline Matatu SACCO System?",
      answer:
        "The Moline Matatu SACCO System is a centralized platform designed to automate financial and administrative operations for Matatu SACCOs in Kenya. It streamlines daily remittances, loan processing, payroll management, vehicle insurance tracking, and real-time reporting.",
    },
    {
      question: "How do I register as a SACCO member?",
      answer:
        "To register, visit the registration page on our website, provide your personal details (e.g., national ID, email, phone), and submit the form. An admin will review and approve your account, after which you’ll receive an approval email with login instructions.",
    },
    {
      question: "Can I track my loan application status?",
      answer:
        "Yes, once logged in, navigate to the 'Loans' section on your dashboard. You can view the status of your loan application (e.g., pending, approved, disbursed) and receive real-time notifications for updates.",
    },
    {
      question: "How does the system handle vehicle insurance?",
      answer:
        "The system automatically tracks insurance payments for each vehicle. If insurance expires, the vehicle’s status is updated to 'suspended,' and notifications are sent to the owner and driver to renew the policy.",
    },
    {
      question: "Is my data secure in the Moline SACCO System?",
      answer:
        "Absolutely. The system uses JWT (JSON Web Tokens) for secure authentication, encrypts sensitive data, and complies with data protection standards to ensure your personal and financial information is safe.",
    },
  ];

  return (
    <Container className="faq-page my-5">
      {/* Hero Section */}
      <motion.div
        className="text-center text-white bg-primary rounded p-5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* <h1 className="fw-bold">
          Frequently Asked Questions about{" "}
          <span className="text-warning">Moline SACCO</span>
        </h1>
        <p className="lead">
          Find answers to common questions about our system and services.
        </p> */}
      </motion.div>
      <motion.div
        className="text-center text-white bg-primary rounded p-5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="fw-bold">
          Frequently Asked Questions about{" "}
          <span className="text-warning">Moline SACCO</span>
        </h1>
        <p className="lead">
          Find answers to common questions about our system and services.
        </p>
      </motion.div>

      {/* FAQ Section */}
      <section className="mt-5">
        <h2 className="text-center text-success">Your Questions, Answered</h2>
        <motion.div
          className="faq-list mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {faqs.map((faq, index) => (
            <Card
              key={index}
              className="shadow border-0 mb-3 faq-card"
            >
              <Card.Header
                className="d-flex justify-content-between align-items-center bg-light cursor-pointer"
                onClick={() => toggleFAQ(index)}
              >
                <h5 className="mb-0 text-primary">{faq.question}</h5>
                <FontAwesomeIcon
                  icon={activeIndex === index ? faMinus : faPlus}
                  className="text-success"
                />
              </Card.Header>
              {activeIndex === index && (
                <Card.Body>
                  <p>{faq.answer}</p>
                </Card.Body>
              )}
            </Card>
          ))}
        </motion.div>
      </section>
    </Container>
  );
};

export default FAQ;