import React, { useState, useEffect } from 'react';
import { format, isBefore, addDays } from 'date-fns';
import { exportData, printData } from '../../utils/export';
import axiosInstance from '../../context/axiosInstance';

const MatatuReport = () => {
  const [matatuDetails, setMatatuDetails] = useState([]);
  const [filters, setFilters] = useState({
    loan: false,
    statusActive: false,
    statusInactive: false,
    statusSuspended: false,
    insuranceExpiryDue: false,
    zeroSavings: false,
    loanMoreThanSavings: false,
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await axiosInstance.get('/reports/matatuDetails');
        setMatatuDetails(resp.data);
      } catch (err) {
        console.error('Error fetching matatu data:', err);
      }
    })();
  }, []);

  const toggleDropdown = () => setDropdownOpen(o => !o);

  const handleFilterChange = key =>
    setFilters(f => ({ ...f, [key]: !f[key] }));

  const applyFilters = () => setDropdownOpen(false);

  const filtered = matatuDetails.filter(m => {
    if (filters.loan && m.loan <= 0) return false;
    if (filters.statusActive && m.status !== 'active') return false;
    if (filters.statusInactive && m.status !== 'inactive') return false;
    if (filters.statusSuspended && m.status !== 'suspended') return false;
    if (
      filters.insuranceExpiryDue &&
      isBefore(new Date(m.insurance_expiry), addDays(new Date(), 7))
    )
      return false;
    if (filters.zeroSavings && m.savings > 0) return false;
    if (filters.loanMoreThanSavings && m.loan <= m.savings) return false;
    return true;
  });

  const columns = [
    { header: 'Owner Name',      field: 'owner_first_name' }, // render full name manually
    { header: 'Plate Number',    field: 'number_plate' },
    { header: 'Status',          field: 'status' },
    { header: 'Insurance Expiry',field: 'insurance_expiry' },
    { header: 'Loan (KES)',      field: 'loan' },
    { header: 'Savings (KES)',   field: 'savings' },
    { header: 'Driver',          field: 'driver_first_name' }, // render manually
  ];

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid">

          {/* Filter Card */}
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="card card-primary">
                <div className="card-header">
                  <h3 className="card-title">Filter Options</h3>
                </div>
                <div className="card-body">
                  <button
                    className="btn btn-secondary mb-3"
                    onClick={toggleDropdown}
                  >
                    {dropdownOpen ? 'Hide Filters' : 'Show Filters'}
                  </button>
                  {dropdownOpen && (
                    <div className="p-2 border rounded">
                      {Object.keys(filters).map((key) => (
                        <div className="form-check" key={key}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={key}
                            checked={filters[key]}
                            onChange={() => handleFilterChange(key)}
                          />
                          <label className="form-check-label" htmlFor={key}>
                            {(() => {
                              switch (key) {
                                case 'loan': return 'Has Loan';
                                case 'statusActive': return 'Active Status';
                                case 'statusInactive': return 'Inactive Status';
                                case 'statusSuspended': return 'Suspended';
                                case 'insuranceExpiryDue': return 'Insurance Expiry ≤1wk';
                                case 'zeroSavings': return 'Zero Savings';
                                case 'loanMoreThanSavings': return 'Loan > Savings';
                                default: return key;
                              }
                            })()}
                          </label>
                        </div>
                      ))}
                      <button
                        className="btn btn-success btn-block mt-2"
                        onClick={applyFilters}
                      >
                        Apply Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Data Card */}
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h3 className="card-title">Matatu Details</h3>
                  <div className="btn-group">
                    {['txt','csv','xlsx','pdf'].map(type => (
                      <button
                        key={type}
                        className="btn btn-info btn-sm"
                        onClick={() =>
                          exportData(type, filtered, columns, 'Matatu Details')
                        }
                      >
                        <i className="fas fa-download"></i> {type.toUpperCase()}
                      </button>
                    ))}
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => printData(filtered, columns)}
                    >
                      <i className="fas fa-print"></i> Print
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>Owner Name</th>
                        <th>Plate Number</th>
                        <th>Status</th>
                        <th>Insurance Expiry</th>
                        <th>Loan (KES)</th>
                        <th>Savings (KES)</th>
                        <th>Driver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((m, i) => (
                        <tr key={i}>
                          <td>{m.owner_first_name} {m.owner_last_name}</td>
                          <td>{m.number_plate}</td>
                          <td>{m.status.charAt(0).toUpperCase() + m.status.slice(1)}</td>
                          <td>{format(new Date(m.insurance_expiry), 'yyyy-MM-dd')}</td>
                          <td>{m.loan.toLocaleString()}</td>
                          <td>{m.savings.toLocaleString()}</td>
                          <td>
                            {m.driver_first_name
                              ? `${m.driver_first_name} ${m.driver_last_name}`
                              : 'Not Assigned'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan="4">Totals</th>
                        <th>
                          {filtered.reduce((sum, m) => sum + m.loan, 0).toLocaleString()}
                        </th>
                        <th>
                          {filtered.reduce((sum, m) => sum + m.savings, 0).toLocaleString()}
                        </th>
                        <th></th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default MatatuReport;
