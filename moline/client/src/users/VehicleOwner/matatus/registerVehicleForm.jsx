import React, { useEffect, useState } from "react";
import { registerVehicle } from "../../components/fleet";
import { useNavigate } from "react-router-dom";
import "../../../pages/auth/Register.css";
import matisLogo from "../../../assets/matis-logo.png";

const vehicleTypes = [
  "Toyota HiAce",
  "Nissan van",
  "Isuzu NQR",
  "Mitsubishi Rosa",
];
const seatingCapacities = [14, 15, 25, 33, 34];

// ✅ Year of Make from 2018 to 2025
const yearsOfMake = Array.from({ length: 8 }, (_, i) => 2018 + i);

// ✅ Hardcoded routes (2–5 routes)
const mockRoutes = [
  {
    route_id: 1,
    route_name: "CBD - Westlands",
    start_location: "CBD",
    end_location: "Westlands",
  },
  {
    route_id: 2,
    route_name: "CBD - Rongai",
    start_location: "CBD",
    end_location: "Rongai",
  },
  {
    route_id: 3,
    route_name: "CBD - Thika",
    start_location: "CBD",
    end_location: "Thika",
  },
  {
    route_id: 4,
    route_name: "Westlands - Kasarani",
    start_location: "Westlands",
    end_location: "Kasarani",
  },
];

function VehicleRegistrationForm() {
  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState({
    numberPlate: "",
    vehicleLogbook: null,
    vehicleType: "",
    seatingCapacity: "",
    chassisNumber: "",
    yearOfMake: "",
    route_id: "",
  });

  const navigate = useNavigate();

  // ✅ Load mock routes
  useEffect(() => {
    setRoutes(mockRoutes);
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await registerVehicle(formData);
      if (response && (response.status === 200 || response.status === 201)) {
        navigate("/users/vehicles");
      } else {
        console.error("Vehicle registration failed", response);
      }
    } catch (err) {
      console.error("Error registering vehicle:", err);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="row">
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
                    <h2 className="fw-bold mb-5">Register Vehicle</h2>

                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                      {/* Number Plate + Logbook */}
                      <div className="row">
                        <div className="col-md-6 mb-4">
                          <input
                            type="text"
                            name="numberPlate"
                            className="form-control"
                            placeholder="Number Plate"
                            value={formData.numberPlate}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-4">
                          <input
                            type="file"
                            name="vehicleLogbook"
                            className="form-control"
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {/* Vehicle Type + Seating */}
                      <div className="row">
                        <div className="col-md-6 mb-4">
                          <select
                            name="vehicleType"
                            className="form-control"
                            value={formData.vehicleType}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select Vehicle Type</option>
                            {vehicleTypes.map((type, index) => (
                              <option key={index} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6 mb-4">
                          <select
                            name="seatingCapacity"
                            className="form-control"
                            value={formData.seatingCapacity}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select Seating Capacity</option>
                            {seatingCapacities.map((capacity, index) => (
                              <option key={index} value={capacity}>
                                {capacity}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Chassis + Year */}
                      <div className="row">
                        <div className="col-md-6 mb-4">
                          <input
                            type="text"
                            name="chassisNumber"
                            className="form-control"
                            placeholder="Chassis Number"
                            value={formData.chassisNumber}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="col-md-6 mb-4">
                          <select
                            name="yearOfMake"
                            className="form-control"
                            value={formData.yearOfMake}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select Year</option>
                            {yearsOfMake.map((year, index) => (
                              <option key={index} value={year}>
                                {year}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Routes Dropdown */}
                      <div className="row">
                        <div className="col-md-6 mb-4">
                          <select
                            name="route_id"
                            className="form-control"
                            value={formData.route_id}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select Route</option>
                            {routes.map((route) => (
                              <option
                                key={route.route_id}
                                value={route.route_id}
                              >
                                {route.route_name} ({route.start_location} -{" "}
                                {route.end_location})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button type="submit" className="btn btn-primary w-100">
                        Submit
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default VehicleRegistrationForm;
