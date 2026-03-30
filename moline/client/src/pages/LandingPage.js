import React from "react";
import { Link } from "react-router-dom";
import heroImage from "../assets/hero-image.jpg";
import testimonialImage from "../assets/testimonial.png";
import "./LandingPage.css";

const LandingPage = () => {
  return (
    <div className="landing-page mt-25">
      {/* Hero Section */}
      <header
        className="landing-header text-center text-white py-5"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container">
          <h1 className="display-5 fw-bold">
            Empowering Your Financial Future
          </h1>
          <p className="lead">
            Join Moline SACCO for secure savings and flexible loans.
          </p>
          <div className="mt-4">
            <Link to="/login" className="btn btn-primary btn-lg mx-2">
              Login
            </Link>
            <Link to="/register" className="btn btn-success btn-lg mx-2">
              Join Us
            </Link>
          </div>
        </div>
      </header>

      {/* About Section */}
      <section className="container text-center my-5">
        <h2 className="mb-3">Moline SACCO: Where Growth Meets Opportunity</h2>
        <p className="text-muted">
          At Moline SACCO, we empower matatu owners with financial stability,
          seamless operations, and a future full of possibilities. Whether
          you're looking to expand your business, secure your investments, or
          access exclusive financial benefits, we are here to support you every
          step of the way.
        </p>
      </section>

      {/* Benefits Section */}
      <section className="container my-5">
        <h2 className="text-center mb-4">Why Choose Us?</h2>
        <div className="row text-center">
          <div className="col-md-4 mb-4">
            <div className="card h-100 shadow">
              <div className="card-body">
                <h4 className="card-title">Low-Interest Loans</h4>
                <p className="card-text">
                  Access affordable loans with flexible repayment plans.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card h-100 shadow">
              <div className="card-body">
                <h4 className="card-title">High-Return Savings</h4>
                <p className="card-text">
                  Grow your wealth with our competitive savings options.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card h-100 shadow">
              <div className="card-body">
                <h4 className="card-title">Member Support</h4>
                <p className="card-text">
                  We are here to guide you every step of the way.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container text-center my-5">
        <h2 className="mb-4">What Our Members Say</h2>
        <div className="card shadow mx-auto" style={{ maxWidth: "600px" }}>
          <div className="card-body">
            <img
              src={testimonialImage}
              alt="Testimonial"
              className="rounded-circle mb-3"
              style={{ width: "80px", height: "80px" }}
            />
            <blockquote className="blockquote">
              <p>
                “Moline SACCO helped me start my business. The support was
                amazing!”
              </p>
              <footer className="blockquote-footer">
                John Doe, Member since 2018
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="text-center py-5 bg-light">
        <h2 className="mb-3">Join Us Today</h2>
        <p className="text-muted">Your Journey to Success starts Here.</p>
        <Link to="/register" className="btn btn-success btn-lg">
          Get Started
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-4">
        <div className="container text-center">
          <p>
            &copy; {new Date().getFullYear()} Moline SACCO. All rights reserved.
          </p>
          <p>Email: info@molinasacco.com | Phone: +254 700 000 000</p>
          <div>
            <a href="#" className="text-white me-3">
              Facebook
            </a>
            <a href="#" className="text-white me-3">
              Twitter
            </a>
            <a href="#" className="text-white">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
