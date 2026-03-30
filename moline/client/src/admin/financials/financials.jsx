import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillAlt, faPiggyBank, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import {fetchFinancialDetails } from '../components/financial';

function FinancialReport() {
    const [financialDetails, setFinancialDetails] = useState([]);

    useEffect(() => {
        const initializeData = async () => {
            const financialDetails = await fetchFinancialDetails();
            setFinancialDetails(financialDetails);
        };
        initializeData();
    }, []);

    const [activeTab, setActiveTab] = useState('loans');

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    // Filter data for loans and savings
    const filteredLoansData = financialDetails.filter((detail) => detail.loan_id !== null);
    const filteredSavingsData = financialDetails.filter((detail) => detail.savings_amount !== null);

    // Define columns and titles for each tab
    const loansColumns = ['Loan ID', 'Vehicle Plate Number', 'Amount issued (KES)', 'Loan Type', 'Amount due (KES)', 'Date Issued'];
    const loansTitle = 'Loans Report';
    const savingsColumns = ['Vehicle Plate Number', 'Savings Balance (KES)'];
    const savingsTitle = 'Savings Report';
    const insuranceColumns = ['Vehicle Plate Number', 'Insurance Paid (KES)', 'Next Renewal Date', 'Status'];
    const insuranceTitle = 'Insurance Report';

    return (
        <div className="content-wrapper">
            <section className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="d-flex justify-content-around mb-4">
                                <div
                                    className={`icon-box ${activeTab === 'loans' ? 'active' : ''}`}
                                    onClick={() => handleTabClick('loans')}
                                >
                                    <FontAwesomeIcon icon={faMoneyBillAlt} size="3x" />
                                    <p className="mt-2">Loans</p>
                                </div>
                                <div
                                    className={`icon-box ${activeTab === 'savings' ? 'active' : ''}`}
                                    onClick={() => handleTabClick('savings')}
                                >
                                    <FontAwesomeIcon icon={faPiggyBank} size="3x" />
                                    <p className="mt-2">Savings</p>
                                </div>
                                <div
                                    className={`icon-box ${activeTab === 'insurance' ? 'active' : ''}`}
                                    onClick={() => handleTabClick('insurance')}
                                >
                                    <FontAwesomeIcon icon={faShieldAlt} size="3x" />
                                    <p className="mt-2">Insurance</p>
                                </div>
                            </div>

                            {activeTab === 'loans' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Loans</h3>
                                    </div>
                                    <div className="card-body">
                                        <table className="table table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    {loansColumns.map((col, index) => (
                                                        <th key={index}>{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredLoansData.map((loan, index) => (
                                                    <tr key={index}>
                                                        <td>{loan.loan_id}</td>
                                                        <td>{loan.number_plate}</td>
                                                        <td>{loan.loan_amount_issued}</td>
                                                        <td>{loan.loan_type}</td>
                                                        <td>{loan.loan_amount_due}</td>
                                                        <td>{format(new Date(loan.loan_created_at), 'yyyy-MM-dd')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th>Total</th>
                                                    <th></th>
                                                    <th>{filteredLoansData.reduce((total, loan) => total + loan.loan_amount_issued, 0)}</th>
                                                    <th></th>
                                                    <th>{filteredLoansData.reduce((total, loan) => total + loan.loan_amount_due, 0)}</th>
                                                    <th></th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'savings' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Savings</h3>
                                    </div>
                                    <div className="card-body">
                                        <table className="table table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    {savingsColumns.map((col, index) => (
                                                        <th key={index}>{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredSavingsData.map((savings, index) => (
                                                    <tr key={index}>
                                                        <td>{savings.number_plate}</td>
                                                        <td>{savings.savings_amount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <th>Total</th>
                                                    <th>{filteredSavingsData.reduce((total, savings) => total + savings.savings_amount, 0)}</th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'insurance' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">Insurance</h3>
                                    </div>
                                    <div className="card-body">
                                        <table className="table table-bordered table-hover">
                                            <thead>
                                                <tr>
                                                    {insuranceColumns.map((col, index) => (
                                                        <th key={index}>{col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {financialDetails.map((insurance, index) => (
                                                    <tr key={index}>
                                                        <td>{insurance.number_plate}</td>
                                                        <td>{insurance.insurance_amount}</td>
                                                        <td>{format(new Date(insurance.insurance_expiry), 'yyyy-MM-dd')}</td>
                                                        <td>{insurance.status}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    {insuranceColumns.map((col, index) => (
                                                        <th key={index}>{col}</th>
                                                    ))}
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default FinancialReport;
