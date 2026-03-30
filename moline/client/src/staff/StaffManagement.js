import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchStaffMembers, updateSalary, paySalary, payAdvance } from '/components/staffManagement'; 

const StaffManagement = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [salary, setSalary] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    bankAccount: '',
    nhifNumber: '',
    passportPhoto: null
  });

  useEffect(() => {
    // Fetch available staff members on component mount
    const getStaffMembers = async () => {
      const staffData = await fetchStaffMembers();
      setStaffMembers(staffData);
    };
    getStaffMembers();
  }, []);

  // Handle selection of staff member
  const handleStaffSelect = (staff) => {
    setSelectedStaff(staff);
    setSalary(staff.salary);
    setBankDetails({
      bankName: staff.bankName || '',
      bankAccount: staff.bankAccount || '',
      nhifNumber: staff.nhifNumber || '',
      passportPhoto: staff.passportPhoto || null
    });
  };

  // Handle updating staff salary
  const handleUpdateSalary = async () => {
    await updateSalary(selectedStaff.id, salary);
    alert('Salary updated successfully');
    // Refresh staff data after update
    const staffData = await fetchStaffMembers();
    setStaffMembers(staffData);
  };

  // Handle paying full salary (with NHIF deduction)
  const handlePaySalary = async () => {
    const nhifDeduction = 0.02 * salary; // Example 2% NHIF deduction
    await paySalary(selectedStaff.id, salary - nhifDeduction);
    alert('Salary paid successfully with NHIF deduction');
  };

  // Handle paying advance salary (half of the current salary)
  const handlePayAdvance = async () => {
    const advanceAmount = salary / 2;
    await payAdvance(selectedStaff.id, advanceAmount);
    alert('Advance salary paid successfully');
  };

  return (
    <div className="container my-5">
      <h3>Staff Management</h3>
      <div className="row">
        <div className="col-md-4">
          <h5>Available Staff Members</h5>
          <ul className="list-group">
            {staffMembers.map(staff => (
              <li
                key={staff.id}
                className={`list-group-item ${selectedStaff?.id === staff.id ? 'active' : ''}`}
                onClick={() => handleStaffSelect(staff)}
                style={{ cursor: 'pointer' }}
              >
                {staff.firstName} {staff.lastName}
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-8">
          {selectedStaff && (
            <div className="card">
              <div className="card-header">
                <h4>Manage {selectedStaff.firstName} {selectedStaff.lastName}</h4>
              </div>
              <div className="card-body">
                <h5>Salary Management</h5>
                <div className="form-group">
                  <label>Salary Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                  />
                  <button className="btn btn-primary mt-2" onClick={handleUpdateSalary}>Update Salary</button>
                </div>

                <h5 className="mt-4">Bank and NHIF Details</h5>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Bank Account Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bankDetails.bankAccount}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankAccount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>NHIF Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={bankDetails.nhifNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, nhifNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Passport Photo</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setBankDetails({ ...bankDetails, passportPhoto: e.target.files[0] })}
                  />
                </div>

                <h5 className="mt-4">Salary Payment Options</h5>
                <button className="btn btn-success mr-2" onClick={handlePaySalary}>Pay Full Salary</button>
                <button className="btn btn-warning" onClick={handlePayAdvance}>Pay Advance Salary</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
