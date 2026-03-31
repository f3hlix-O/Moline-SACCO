import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "../styles/dashboard.css";

const DashboardLayout = ({ children, pageTitle }) => {
  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="main-content">
        <Header pageTitle={pageTitle} />
        <div className="content-area">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
