import React from "react";
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandshake, faBullseye, faUsers, faLightbulb, faTrophy, faChartLine, faBuilding, faWallet } from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import "./aboutUs.css"; 
import businessMeeting from "../assets/businessMeeting.png";

const AboutUs = () => {
  return (
    <div className="container-body my-5">
      {/* Header Section */}

      <motion.div login className="text-center mb-5"
        className="text-center mb-5"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-primary font-weight-bold">About <span className="text-success">Moline SACCO</span></h1>
        <p className="lead text-muted">Empowering financial growth for a better future.</p>
      </motion.div>

      <motion.div 
        className="text-center mb-5"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-primary font-weight-bold">About <span className="text-success">Moline SACCO</span></h1>
        <p className="lead text-muted">Empowering financial growth for a better future.</p>
      </motion.div>

      {/* About Section */}
      <motion.div 
        className="card-about shadow-lg p-4 mb-4 about-section"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="row align-items-center">
          <div className="col-md-6">
            <h3><FontAwesomeIcon icon={faHandshake} className="text-success" /> About Moline SACCO</h3>
            <p>
              Moline SACCO is a cooperative dedicated to empowering its members through financial growth. Our mission is to
              foster financial success by offering innovative saving and investment solutions.
            </p>
          </div>
          <div className="col-md-6 text-center">
            <img src={businessMeeting} alt="SACCO Meeting" className="img-fluid rounded shadow-lg" />
          </div>
        </div>
      </motion.div>

      {/* Strategic Plan Section */}
      <motion.div 
        className="card-about shadow-lg p-4 mb-4"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3><FontAwesomeIcon icon={faBullseye} className="text-warning" /> Our Strategic Plan</h3>
        <p>We aim to expand our financial services to a broader community while maintaining sustainable operations.</p>
        <ul>
          <li><FontAwesomeIcon icon={faWallet} className="text-primary" /> Enhancing digital financial services for ease of access.</li>
          <li><FontAwesomeIcon icon={faChartLine} className="text-success" /> Increasing investment opportunities.</li>
          <li><FontAwesomeIcon icon={faBuilding} className="text-info" /> Expanding our reach through partnerships.</li>
          <li><FontAwesomeIcon icon={faLightbulb} className="text-danger" /> Strengthening financial literacy programs.</li>
        </ul>
      </motion.div>

      {/* Core Values Section */}
      <motion.div 
        className="card-about shadow-lg p-4 mb-4"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3><FontAwesomeIcon icon={faUsers} className="text-info" /> Our Core Values</h3>
        <ul>
          <li><strong>Integrity:</strong> Transparency and honesty in all dealings.</li>
          <li><strong>Innovation:</strong> Continuously improving our services.</li>
          <li><strong>Inclusivity:</strong> Welcoming members from all backgrounds.</li>
          <li><strong>Commitment:</strong> Dedicated to financial success.</li>
        </ul>
      </motion.div>

      {/* Key Milestones Section */}
      <motion.div 
        className="card-about shadow-lg p-4 mb-4"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3><FontAwesomeIcon icon={faTrophy} className="text-danger" /> Key Milestones</h3>
        <p>Since our inception, Moline SACCO has achieved remarkable progress:</p>
        <ul>
          <li>Providing <strong>zero-interest loans</strong> to over 5,000 members.</li>
          <li>Expanding to multiple regions, enhancing accessibility.</li>
          <li>Growing our investment portfolio for long-term sustainability.</li>
          <li>Launching a <strong>mobile banking platform</strong> for easy transactions.</li>
        </ul>
      </motion.div>

      {/* Mission & Vision Section */}
      <div className="row">
        <motion.div 
          className="col-md-6 mb-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card-about shadow-lg text-center p-4 h-100">
            <h3><FontAwesomeIcon icon={faBullseye} className="text-success" /> Our Mission</h3>
            <p>
              To empower members with affordable financial solutions and investment opportunities, ensuring economic independence.
            </p>
          </div>
        </motion.div>

        <motion.div 
          className="col-md-6 mb-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card-about shadow-lg text-center p-4 h-100">
            <h3><FontAwesomeIcon icon={faChartLine} className="text-primary" /> Our Vision</h3>
            <p>
              To be Africa’s leading SACCO, transforming lives through innovative financial solutions and wealth-building opportunities.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutUs;
