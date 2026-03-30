import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchMatatuDetais, deleteMatatu, editMatatu } from '../components/matatus';

function Fleet() {
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
                                                <th>ID</th>
                                                <th>Owner</th>
                                                <th>Plate Number</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matatus.map(matatu => (
                                                <tr key={matatu.matatu_id}>
                                                    <td>{matatu.matatu_id}</td>
                                                    <td>{matatu.owner_first_name} {matatu.owner_last_name}</td>
                                                    <td>{matatu.number_plate}</td>
                                                    <td>{matatu.status}</td>
                                                    <td>
                                                        <button onClick={() => editMatatu(matatu, setMatatus)} className="btn btn-info btn-sm mr-2">
                                                            <i className="fas fa-pencil-alt"></i> Edit
                                                        </button>
                                                        {/* <button onClick={() => resetStatus(matatu.matatu_id)} className="btn btn-warning btn-sm mr-2">
                                                            <i className="fas fa-key"></i> Reset Status
                                                        </button> */}
                                                        <button onClick={() => deleteMatatu(matatu.matatu_id)} className="btn btn-warning btn-sm mr-2">
                                                            <i className="fas fa-trash-alt"></i> Delete
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

export default Fleet;
