import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import ExitSacco from '../pages/exitSacco';
import AdminPanel from '../admin/components/admin';
import Header from '../admin/components/Header';
import Footer from '../admin/components/Footer';
import Sidenav from '../admin/components/Sidenav';
import Users from '../admin/pages/Users';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Approve from '../admin/users/Approve';
import Roles from '../admin/users/Roles';
import Profile from '../admin/users/Profile';
import UserDetails from '../admin/users/userProfile';
import VehicleOwnerHome from '../users/VehicleOwner/Home';
import VehicleOwnerDashboard from '../users/components/VehicleOwnerDashboard';
import LoanApplication from '../users/VehicleOwner/financials/loans';
import VehicleRegistrationForm from '../users/VehicleOwner/matatus/registerVehicleForm';
import PaymentStatus from '../users/VehicleOwner/matatus/payments';
import Dashboard from '../staff/StaffDashboard';
import SalaryManagement from '../staff/SalaryManagement';
import ExpenseTracking from '../staff/ExpenseTracking';
import StaffDetailsForm from '../staff/StaffDetailsForm';
import Side_nav from '../staff/Side_nav';
import NewUserForm from '../admin/users/createUser';
import Fleet from '../admin/fleet/fleet';
import AssignDriver from '../admin/fleet/assignDriver';
import VehicleStatus from '../admin/fleet/vehicleStatus';
import UserReport from '../admin/reports/userReport';
import MatatuReport from '../admin/reports/matatuReport';
import FinancialReport from '../admin/reports/financialReport';
import AdminLoans from '../admin/financials/Loans';
import ShareholderPayment from '../users/pages/shareHolderPayment';
import RouteManagement from '../admin/fleet/matatuRoutes';
import UpdateStaffDetails from '../staff/updateStaff';
import ContactSupport from '../users/VehicleOwner/contactSupport';

// Define Admin layout
const AdminLayout = () => (
  <>
    <Header />
    <Sidenav />
    <Routes>
      <Route path="users" element={<Users />} />
      <Route path="adminpanel" element={<AdminPanel />} />
      <Route path="users/approve" element={<Approve />} />
      <Route path="users/roles" element={<Roles />} />
      <Route path="users/profiles" element={<Profile />} />
      <Route path="users/user_profile/:userId" element={<UserDetails />} />
      <Route path="users/new" element={<NewUserForm />} />
      <Route path="fleet" element={<Fleet />} />
      <Route path="fleet/assignments" element={<AssignDriver />} />
      <Route path="fleet/statuses" element={<VehicleStatus />} />
      <Route path="reports/user-details" element={<UserReport />} />
      <Route path="reports/vehicle-details" element={<MatatuReport />} />
      <Route path="reports/financial" element={<FinancialReport />} />
      <Route path="loans" element={<AdminLoans />} />
      <Route path="routes" element={<RouteManagement />} />
    </Routes>
    <Footer />
  </>
);

//User layout
const UserLayout = () => {
  const [showSupportModal, setShowSupportModal] = useState(false);

  const handleOpenSupport = () => setShowSupportModal(true);
  const handleCloseSupport = () => setShowSupportModal(false);

  return (
    <>
      <Navbar />
      <Sidebar />
      <Routes>
        <Route path="welcome" element={<ShareholderPayment />} />
        <Route path="home" element={<VehicleOwnerHome />} />
        <Route path="vehicles" element={<VehicleOwnerDashboard />} />
        <Route path="apply-loan" element={<LoanApplication />} />
        <Route path="addVehicle" element={<VehicleRegistrationForm />} />
        <Route path="payments" element={<PaymentStatus />} />
        <Route path="exit" element={<ExitSacco />} />
      </Routes>
      <button className="floating-help" onClick={handleOpenSupport}>
        Help
      </button>
      <ContactSupport show={showSupportModal} onClose={handleCloseSupport} />
    </>
  );
};

// Staff layout
const StaffLayout = () => (
  <>
    <Navbar />
    <Side_nav /> 
    <Routes>
    <Route path="dashboard" element={<Dashboard />} />
        <Route path="salary" element={<SalaryManagement />} />
        <Route path="expensetracking" element={<ExpenseTracking />} />
        <Route path="staffdetails" element={<StaffDetailsForm />} />
        <Route path="matatumanagement" element={<VehicleOwnerDashboard />} />
        <Route path="addVehicle" element={<VehicleRegistrationForm />} />
        <Route path="update" element={<UpdateStaffDetails />} />
        <Route path="loanmanagement" element={<AdminLoans />} />
        <Route path="reports" element={<FinancialReport />} />
        <Route path="users/user_profile/:userId" element={<UserDetails />} />
        {/* <Route path="/details" component={StaffDetailsPage} /> */}
    </Routes>
  </>
);

// Define routes
const routes = [
  {
    path: '/admin/*',
    element: <AdminLayout />,
    allowedRoles: [202], // Only admin role
  },
  {
    path: '/users/*',
    element: <UserLayout />,
    allowedRoles: [203, 202, 201], // all users
  },
  {
    path: '/staff/*',
    element: <StaffLayout />,
    allowedRoles: [201, 202], // Staff and admin roles
  },
];

export default routes;
