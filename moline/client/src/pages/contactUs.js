import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Form } from "react-bootstrap";
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faPhoneAlt,
  faMapMarkerAlt,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faTwitter,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import "./contactUs.css";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    Swal.fire({
      icon: "success",
      title: "Message sent",
      text: "Your message has been send succesfully",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  return (
    <div className="container contact-page my-5">
      {/* Hero Section */}
      <motion.div
        className="text-center text-white bg-primary rounded p-5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      ></motion.div>

      <motion.div
        className="text-center text-white bg-primary rounded p-5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="fw-bold">
          Get in Touch with <span className="text-warning"> Moline SACCO</span>
        </h1>
        <p className="lead">
          We’re here to help! Contact us for any inquiries or support.
        </p>
      </motion.div>

      {/* Contact Details Section */}
      <section className="mt-5">
        <h2 className="text-center text-success">Contact Information</h2>
        <div className="row mt-4">
          {[
            { text: "info@molinesacco.com", icon: faEnvelope },
            { text: "+254 700 000 000", icon: faPhoneAlt },
            { text: "Nairobi, Kenya", icon: faMapMarkerAlt },
          ].map((info, index) => (
            <motion.div
              key={index}
              className="col-md-4 mb-3"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.2 }}
            >
              <Card className="shadow border-0 contact-card text-center">
                <Card.Body>
                  <FontAwesomeIcon
                    icon={info.icon}
                    className="text-primary mb-2"
                    size={32}
                  />
                  <h5 className="card-title">{info.text}</h5>
                </Card.Body>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section className="mt-5">
        <h2 className="text-center text-primary">Send Us a Message</h2>
        <motion.div
          className="contact-form mt-4 p-4 bg-light rounded shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Your Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Your Message</Form.Label>
              <Form.Control
                as="textarea"
                name="message"
                rows={3}
                value={formData.message}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Button variant="success" type="submit">
              Send Message{" "}
              <FontAwesomeIcon icon={faPaperPlane} className="ms-2" />
            </Button>
          </Form>
        </motion.div>
      </section>

      {/* Google Maps Section */}
      <section className="mt-5">
        <h2 className="text-center text-danger">Visit Our Office</h2>
        <motion.div
          className="map-container mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <iframe
            title="Moline SACCO Location"
            width="100%"
            height="400"
            frameBorder="0"
            style={{
              border: 0,
              borderRadius: "12px",
              boxShadow: "0px 0px 10px rgba(0,0,0,0.2)",
            }}
            src="https://www.google.com/maps/embed/v1/place?q=Nairobi,Kenya&key=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao"
            allowFullScreen
          ></iframe>
        </motion.div>
      </section>

      {/* Social Media Links */}
      <section className="mt-5 text-center">
        <h2 className="text-primary">Follow Us on Social Media</h2>
        <div className="social-links mt-3">
          <a href="#" className="social-icon">
            <FontAwesomeIcon icon={faFacebook} size="2x" />
          </a>
          <a href="#" className="social-icon">
            <FontAwesomeIcon icon={faTwitter} size="2x" />
          </a>
          <a href="#" className="social-icon">
            <FontAwesomeIcon icon={faLinkedin} size="2x" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
