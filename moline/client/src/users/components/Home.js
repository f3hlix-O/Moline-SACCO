import React from 'react';
import Navbar from '../../components/Navbar';
import './Home.css'
import Sidebar from '../../components/Sidebar';
import VehicleOwnerDashboard from '../../components/VehicleOwnerDashboard';
import ProfilePage from '../../components/ProfilePage';


function Home() {
  // Placeholder data
  const ownerName = "John Doe";
  const vehicles = [{ id: 1, name: "Car A" }, { id: 2, name: "Car B" }];
  const savingsBalance = 5000;
  const loanBalance = 3000;
  const nextInsuranceDue = "2024-06-15";
  const recentPayments = [{ id: 1, amount: 200, date: "2024-05-20" }];
  const notifications = [{ id: 1, message: "Insurance due soon" }];
  const userProfile = { name: "John Doe", email: "john@example.com" };

  // Placeholder functions
  const onAddVehicle = () => alert("Add Vehicle Clicked");
  const onApplyForLoan = () => alert("Apply for Loan Clicked");
  const onAssignDriver = () => alert("Assign Driver Clicked");
  const onLogout = () => alert("Logout Clicked");

  return (
    <div className="wrapper">
      <Navbar />      
      <Sidebar />
      <VehicleOwnerDashboard />
      <ProfilePage user_id={135}/>
    </div>
  );
}

export default Home;
