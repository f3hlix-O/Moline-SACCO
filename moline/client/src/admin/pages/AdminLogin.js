import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useAuth } from '../../context/AuthProvider';

function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch('http://localhost:5000/api/users/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user && data.user.status === 'approved') {
                    login(data.token);
                    Swal.fire({
                        icon: 'success',
                        title: data.message,
                        text: 'You have been successfully logged in.',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                    });
                    switch (data.user.role_id) {
                        case 201:
                            navigate("/staff/dashboard");
                            break;
                        case 203:
                            navigate("/users/home");
                            break;
                        case 202:
                            navigate("/admin/adminpanel");
                            break;
                        default:
                            navigate("/users/home");
                            break;
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Login Failed',
                        text: 'Your account has not been approved yet. Please contact the administrator.',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 5000,
                        timerProgressBar: true,
                    });
                }
            } else {
                const errorData = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: errorData.error || 'An unexpected error occurred',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 5000,
                    timerProgressBar: true,
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An unexpected error occurred',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 5000,
                timerProgressBar: true,
            });
            console.error('Error during login:', error);
        }
    };

    return (
        <div>
            <section className="text-center">
                <div
                    className="p-5 bg-image"
                    style={{
                        backgroundImage: 'url("https://mdbootstrap.com/img/new/textures/full/171.jpg")',
                        height: 300,
                    }}
                />
                <div
                    className="max-w-lg mx-auto rounded-lg shadow-2xl bg-body-tertiary"
                    style={{ marginTop: "-100px", backdropFilter: "blur(30px)" }}
                >
                    <div className="py-5 px-6">
                        <div className="row d-flex justify-content-center">
                            <div className="col-lg-8">
                                <h2 className="fw-bold mb-5">Login</h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-12 mb-4">
                                            <div className="form-outline custom-input">
                                                <input
                                                    type="email"
                                                    name="email"
                                                    id="email"
                                                    className="form-control custom-input"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                                <label className="form-label" htmlFor="email">
                                                    Email
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-12 mb-4">
                                            <div className="form-outline custom-input">
                                                <input
                                                    type="password"
                                                    id="password"
                                                    name="password"
                                                    className="form-control custom-input"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                                <label className="form-label" htmlFor="password">
                                                    Password
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-block mb-2">
                                        Login
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default AdminLogin;
