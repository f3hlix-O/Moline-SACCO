import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchMatatuDetais, fetchDrivers, assignDrivers } from '../components/matatus';
import Swal from 'sweetalert2';

function AssignDriver() {
    const [matatus, setMatatus] = useState([]);
    const [drivers, setDrivers] = useState([]);

    // Fetch matatus and drivers when the component mounts
    
    useEffect(() => {
        const initializeData = async () => {
            const fetchedMatatus = await fetchMatatuDetais();
            const fetchedDrivers = await fetchDrivers();
            setMatatus(fetchedMatatus);
            setDrivers(fetchedDrivers);
        };
        initializeData();
    }, []);

    return (
        <div className="content-wrapper">
            <section className="content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Assign Driver to Matatu</h3>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Owner</th>
                                                <th>Plate Number</th>
                                                <th>Status</th>
                                                <th>Insurance Status</th>
                                                <th>Loan/Savings</th>
                                                <th>Driver</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matatus.map(matatu => (
                                                <tr key={matatu.matatu_id}>
                                                    <td>{matatu.matatu_id}</td>
                                                    <td>{matatu.owner}</td>
                                                    <td>{matatu.number_plate}</td>
                                                    <td>{matatu.status}</td>
                                                    <td>{matatu.insurance_status}</td>
                                                    <td>{matatu.loan_or_savings}</td>
                                                    <td>{matatu.driver}</td>
                                                    <td>
                                                        <button onClick={() => assignDrivers(matatu.matatu_id, drivers, setMatatus)} className="btn btn-info btn-sm mr-2">
                                                            <i className="fas fa-user"></i> Assign Driver
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AssignDriver;
