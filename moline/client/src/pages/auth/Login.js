import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import "./Register.css";
import { useAuth } from "../../context/AuthProvider";
import matisLogo from "../../assets/matis-logo.png";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.status === "approved") {
          const profileResponse = await fetch(
            "http://localhost:5000/api/users/userDetails",
            {
              headers: {
                Authorization: `Bearer ${data.token}`,
              },
            },
          );
          const profile = profileResponse.ok
            ? await profileResponse.json()
            : null;
          login(
            data.token,
            profile,
            data.user.role_id === 202 ? "admin" : "user",
          );
          Swal.fire({
            icon: "success",
            title: data.message,
            text: "You have been successfully logged in.",
            toast: true,
            position: "top-end",
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
        } else if (data.user && data.user.status === "pending") {
          const profileResponse = await fetch(
            "http://localhost:5000/api/users/userDetails",
            {
              headers: {
                Authorization: `Bearer ${data.token}`,
              },
            },
          );
          const profile = profileResponse.ok
            ? await profileResponse.json()
            : null;
          login(
            data.token,
            profile,
            data.user.role_id === 202 ? "admin" : "user",
          );
          Swal.fire({
            icon: "warning",
            title: "Account Pending",
            text: "Shareholder capital not paid. Please pay to access the system.",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
          });
          switch (data.user.role_id) {
            case 201:
              navigate("/staff/welcome");
              break;
            case 203:
              navigate("/users/welcome");
              break;
            case 202:
              navigate("/admin/welcome");
              break;
            default:
              navigate("/users/welcome");
              break;
          }
        }
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: errorData.error || "An unexpected error occurred",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error || "An unexpected error occurred",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
      console.error("Error during login:", error);
    }
  };

  return (
    <div>
      <section className="text-center">
        <div
          className="p-5 bg-image"
          style={{
            backgroundImage: `url(${matisLogo})`,
            height: 300,
          }}
        />
        <div className="signup-card-container">
          <div
            className="card mx-4 mx-md-5 signup-card shadow-5-strong bg-body-tertiary"
            style={{ marginTop: "-100px", backdropFilter: "blur(30px)" }}
          >
            <div className="card-body py-5 px-md-5">
              <div className="row d-flex justify-content-center">
                <div className="col-lg-30">
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
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            className="form-control custom-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                          />
                          <label className="form-label" htmlFor="password">
                            Password
                          </label>
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? "🙈" : "👁️"}
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary btn-block mb-2"
                    >
                      Login
                    </button>
                    <div className="mt-3">
                      <p>
                        Forgot password?
                        <Link to="/reset" className="text-decoration-none">
                          Reset
                        </Link>
                      </p>
                      <p>
                        Don't have an account?
                        <Link to="/register" className="text-decoration-none">
                          Register here
                        </Link>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
