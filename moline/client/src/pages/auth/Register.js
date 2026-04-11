import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import axiosInstance from "../../context/axiosInstance";
import matisLogo from "../../assets/matis-logo.png";
import "./Register.css";

export const streetNames = [
  "Moi Avenue",
  "Kenyatta Avenue",
  "Digo Road",
  "Uganda Road",
  "Kenyatta Street",
  "Jomo Kenyatta Highway",
];

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    national_id: "",
    address: "",
    password: "",
    confirmPassword: "",
    gender: "",
    ID_image: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: files ? files[0] : value,
    }));

    if (name === "password") {
      setPasswordRules({
        length: value.length >= 8,
        lowercase: /[a-z]/.test(value),
        uppercase: /[A-Z]/.test(value),
        number: /\d/.test(value),
        specialChar: /[@$!%*?&]/.test(value),
      });
    }
  };

  const checkEmailExists = async (email) => {
    try {
      const response = await axiosInstance.post("/users/check-email", {
        email,
      });
      return response.data.exists;
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const {
      phone,
      national_id,
      password,
      confirmPassword,
      email,
      first_name,
      last_name,
      address,
      gender,
      ID_image,
    } = formData;

    if (phone.length !== 10) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Phone should be ten digits.",
      });
      return;
    }
    if (national_id.length < 8 || national_id.length > 9) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "National ID should be 8-9 digits",
      });
      return;
    }

    const missingRules = [];
    if (!passwordRules.length) missingRules.push("Minimum 8 characters");
    if (!passwordRules.lowercase)
      missingRules.push("At least one lowercase letter");
    if (!passwordRules.uppercase)
      missingRules.push("At least one uppercase letter");
    if (!passwordRules.number) missingRules.push("At least one number");
    if (!passwordRules.specialChar)
      missingRules.push("At least one special character (@$!%*?&)");

    if (missingRules.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Password Requirements Not Met",
        html: `<ul style="text-align:left;">${missingRules.map((rule) => `<li>${rule}</li>`).join("")}</ul>`,
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Passwords do not match.",
      });
      return;
    }
    if (!first_name || !last_name || !gender || !ID_image || !address) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "All fields required.",
      });
      return;
    }

    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Email already exists.",
      });
      return;
    }

    const dataToSend = new FormData();
    for (const [key, value] of Object.entries(formData)) {
      dataToSend.append(key, value);
    }

    try {
      const response = await axiosInstance.post("/users/signup", dataToSend);
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Signup Successful!",
          text: "You have successfully signed up.",
        });
        navigate("/Login");
      } else {
        Swal.fire({
          icon: "error",
          title: "Signup Failed",
          text: response.data.error || "There was an error signing up.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An unexpected error occurred.",
      });
    }
  };

  return (
    <div>
      <section className="text-center">
        <div
          className="p-5 bg-image"
          style={{ backgroundImage: `url(${matisLogo})`, height: 300 }}
        />
        <div className="signup-card-container">
          <div
            className="card mx-4 mx-md-5 signup-card shadow-5-strong bg-body-tertiary"
            style={{ marginTop: "-100px", backdropFilter: "blur(30px)" }}
          >
            <div className="card-body py-5 px-md-5">
              <div className="row d-flex justify-content-center">
                <div className="col-lg-30">
                  <h2 className="fw-bold mb-5">Sign up now</h2>
                  <form onSubmit={handleSubmit} encType="multipart/form-data">
                    {/* Form fields (styled) */}
                    <div className="row">
                      <div className="col-md-6 mb-4">
                        <div className="form-outline">
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                          />
                          <label className="form-label">First Name</label>
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <div className="form-outline">
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                          />
                          <label className="form-label">Last Name</label>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-4">
                        <div className="form-outline">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                          />
                          <label className="form-label">Email</label>
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <div className="form-outline">
                          <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                          />
                          <label className="form-label">Phone</label>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-4">
                        <div className="form-outline">
                          <input
                            type="number"
                            name="national_id"
                            value={formData.national_id}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                          />
                          <label className="form-label">National ID</label>
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <div className="form-outline">
                          <input
                            type="file"
                            name="ID_image"
                            onChange={handleChange}
                            className="form-control"
                            accept=".jpg,.jpeg,.png"
                            required
                          />
                          <label className="form-label">Upload ID Image</label>
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-4">
                        <div className="form-outline">
                          <select
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="form-control"
                            required
                          >
                            <option value="">Select Address</option>
                            {streetNames.map((street, index) => (
                              <option key={index} value={street}>
                                {street}
                              </option>
                            ))}
                          </select>
                          <label className="form-label">Address</label>
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <div className="form-outline">
                          <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            className="form-control"
                            required
                          >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Prefer not to say</option>
                          </select>
                          <label className="form-label">Gender</label>
                        </div>
                      </div>
                    </div>

                    {/* Password Fields */}
                    <div className="row">
                      <div className="col-md-6 mb-4">
                        <div className="form-outline">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                          />
                          <label className="form-label">Password</label>
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? "🙈" : "👁️"}
                          </button>
                        </div>
                      </div>

                      <div className="col-md-6 mb-4">
                        <div className="form-outline">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="form-control"
                            placeholder=" "
                            required
                          />
                          <label className="form-label">Confirm Password</label>
                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            aria-label={
                              showConfirmPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showConfirmPassword ? "🙈" : "👁️"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Rules */}
                    <div className="mb-3">
                      <ul className="list-unstyled">
                        <li
                          style={{
                            color: passwordRules.length ? "green" : "red",
                          }}
                        >
                          {passwordRules.length ? "✔" : "✖"} Minimum 8
                          characters
                        </li>
                        <li
                          style={{
                            color: passwordRules.lowercase ? "green" : "red",
                          }}
                        >
                          {passwordRules.lowercase ? "✔" : "✖"} At least one
                          lowercase letter
                        </li>
                        <li
                          style={{
                            color: passwordRules.uppercase ? "green" : "red",
                          }}
                        >
                          {passwordRules.uppercase ? "✔" : "✖"} At least one
                          uppercase letter
                        </li>
                        <li
                          style={{
                            color: passwordRules.number ? "green" : "red",
                          }}
                        >
                          {passwordRules.number ? "✔" : "✖"} At least one number
                        </li>
                        <li
                          style={{
                            color: passwordRules.specialChar ? "green" : "red",
                          }}
                        >
                          {passwordRules.specialChar ? "✔" : "✖"} At least one
                          special character (@$!%*?&)
                        </li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100 mb-2"
                    >
                      Sign up
                    </button>

                    <div className="mt-3 text-center">
                      <p>Already have an account?</p>
                      <Link to="/Login" className="text-decoration-none">
                        Sign In
                      </Link>
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

export default Register;
