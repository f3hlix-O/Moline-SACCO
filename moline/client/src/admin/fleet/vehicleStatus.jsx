import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import axiosInstance from '../../context/axiosInstance';
import { fetchMatatuDetais, resetStatus, approveMatatu } from '../components/matatus';

function VehicleStatus() {
    const [matatus, setMatatus] = useState([]);

    useEffect(() => {
        const initializeData = async () => {
            const matatus = await fetchMatatuDetais();
            setMatatus(matatus);
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
                                    <h3 className="card-title">Matatu Fleet</h3>
                                </div>
                                <div className="card-body">
                                    <table className="table table-bordered table-hover">
                                        <thead>
                                            <tr>
                                                <th>Plate Number</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matatus.map(matatu => (
                                                <tr key={matatu.matatu_id}>
                                                    <td>{matatu.number_plate}</td>
                                                    <td>{matatu.status}</td>
                                                    <td>
                                                        <button onClick={() => approveMatatu(matatu.matatu_id, setMatatus)} className="btn btn-success btn-sm mr-2">
                                                            <i className="fas fa-check"></i> Approve
                                                        </button>
                                                        <button onClick={() => resetStatus(matatu.matatu_id, setMatatus)} className="btn btn-warning btn-sm mr-2">
                                                            <i className="fas fa-sync"></i> Reset Status
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

export default VehicleStatus;
