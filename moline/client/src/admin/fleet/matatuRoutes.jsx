import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { addRoute, deleteRoute } from "../components/matatus";
import { getRoutes } from "../../users/components/fleet";
import Swal from "sweetalert2";

function RouteManagement() {
  const [routes, setRoutes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newRoute, setNewRoute] = useState({
    route_name: "",
    start_location: "",
    end_location: "",
  });

  useEffect(() => {
    const initializeRoutes = async () => {
      const data = await getRoutes();
      setRoutes(data);
    };
    initializeRoutes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await addRoute(newRoute);
    if (success) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Route added successfully!",
      });
      setShowForm(false);
      setNewRoute({ route_name: "", start_location: "", end_location: "" });
      const updatedRoutes = await getRoutes(); // Fetch updated routes
      setRoutes(updatedRoutes);
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add route!",
      });
    }
  };

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Available Routes</h3>
                  <button
                    className="btn btn-primary float-right"
                    onClick={() => setShowForm(true)} // Toggle the form visibility
                  >
                    + Add Route
                  </button>
                </div>
                <div className="card-body">
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Route Name</th>
                        <th>Start Point</th>
                        <th>End Point</th>
                        <th>Actions</th> 
                      </tr>
                    </thead>
                    <tbody>
                      {routes.map((route) => (
                        <tr key={route.route_id}>
                          <td>{route.route_id}</td>
                          <td>{route.route_name}</td>
                          <td>{route.start_location}</td>
                          <td>{route.end_location}</td>
                          <td>
                            <button
                              onClick={() => deleteRoute(route.route_id, setRoutes)}
                              className="btn btn-danger btn-sm"
                            >
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

      {/* Modal for Adding New Route */}
      {showForm && (
        <div
          className="modal d-block"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 1050,
          }}
        >
          <div
            className="modal-dialog"
            style={{
              margin: "10% auto",
              maxWidth: "500px",
            }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Route</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowForm(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="route_name">Route Name</label>
                    <input
                      type="text"
                      id="route_name"
                      name="route_name"
                      className="form-control"
                      placeholder="Route Name"
                      value={newRoute.route_name}
                      onChange={(e) =>
                        setNewRoute({ ...newRoute, route_name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="start_location">Start Location</label>
                    <input
                      type="text"
                      id="start_location"
                      name="start_location"
                      className="form-control"
                      placeholder="Start Location"
                      value={newRoute.start_location}
                      onChange={(e) =>
                        setNewRoute({
                          ...newRoute,
                          start_location: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="end_location">End Location</label>
                    <input
                      type="text"
                      id="end_location"
                      name="end_location"
                      className="form-control"
                      placeholder="End Location"
                      value={newRoute.end_location}
                      onChange={(e) =>
                        setNewRoute({
                          ...newRoute,
                          end_location: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="submit" className="btn btn-success">
                      Save Route
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RouteManagement;
