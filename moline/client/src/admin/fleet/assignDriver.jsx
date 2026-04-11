import React, { useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Button } from "react-bootstrap";
import Swal from "sweetalert2";
import {
  assignDriverToVehicle,
  confirmAction,
  fetchAvailableVehicles,
  fetchDrivers,
  reassignDriverToVehicle,
  unassignDriverFromVehicle,
  updateDriver,
} from "../components/drivers";

const initialEditState = {
  full_name: "",
  phone: "",
  national_id: "",
  license_number: "",
  license_expiry_date: "",
  address: "",
  status: "active",
};

function AssignDriver() {
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleSelections, setVehicleSelections] = useState({});
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [editForm, setEditForm] = useState(initialEditState);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [driversData, vehiclesData] = await Promise.all([
        fetchDrivers(),
        fetchAvailableVehicles(),
      ]);

      setDrivers(driversData || []);
      setVehicles(vehiclesData || []);

      const nextSelections = {};
      (driversData || []).forEach((driver) => {
        nextSelections[driver.driver_id] = driver.vehicle_id
          ? String(driver.vehicle_id)
          : "";
      });
      setVehicleSelections(nextSelections);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDrivers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return drivers;

    return drivers.filter((driver) => {
      const haystack = [
        driver.full_name,
        driver.phone,
        driver.national_id,
        driver.license_number,
        driver.owner_name,
        driver.vehicle_plate,
        driver.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [drivers, searchTerm]);

  const openEditModal = (driver) => {
    setEditingDriverId(driver.driver_id);
    setEditForm({
      full_name: driver.full_name || "",
      phone: driver.phone || "",
      national_id: driver.national_id || "",
      license_number: driver.license_number || "",
      license_expiry_date: driver.license_expiry_date
        ? String(driver.license_expiry_date).slice(0, 10)
        : "",
      address: driver.address || "",
      status: driver.status || "active",
    });
  };

  const closeEditModal = () => {
    setEditingDriverId(null);
    setEditForm(initialEditState);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveDriver = async () => {
    try {
      const response = await updateDriver(editingDriverId, editForm);
      Swal.fire({
        icon: "success",
        title: "Driver updated",
        text: response.data?.message || "Driver details updated successfully.",
      });
      closeEditModal();
      await loadData();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: error.response?.data?.error || "Failed to update driver details.",
      });
    }
  };

  const handleVehicleSelection = (driverId, value) => {
    setVehicleSelections((prev) => ({
      ...prev,
      [driverId]: value,
    }));
  };

  const handleChangeVehicle = async (driver) => {
    const selectedVehicleId = vehicleSelections[driver.driver_id];
    if (!selectedVehicleId) {
      Swal.fire({
        icon: "error",
        title: "Select a vehicle",
        text: "Please select a vehicle before changing the assignment.",
      });
      return;
    }

    const selectedVehicle = vehicles.find(
      (vehicle) => String(vehicle.matatu_id) === String(selectedVehicleId),
    );
    if (!selectedVehicle) {
      Swal.fire({
        icon: "error",
        title: "Vehicle not found",
        text: "The selected vehicle could not be found.",
      });
      return;
    }

    const currentVehicleId = driver.vehicle_id ? String(driver.vehicle_id) : "";
    if (currentVehicleId === String(selectedVehicleId)) {
      Swal.fire({
        icon: "info",
        title: "No change needed",
        text: "This driver is already assigned to the selected vehicle.",
      });
      return;
    }

    const currentVehicleLabel = driver.vehicle_plate || "Unassigned";
    const targetVehicleLabel = selectedVehicle.number_plate;
    const confirmed = await confirmAction(
      "Change driver vehicle?",
      `Are you sure you want to move this driver from ${currentVehicleLabel} to ${targetVehicleLabel}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = currentVehicleId
        ? await reassignDriverToVehicle(driver.driver_id, selectedVehicleId)
        : await assignDriverToVehicle(driver.driver_id, selectedVehicleId);

      Swal.fire({
        icon: "success",
        title: "Vehicle updated",
        text:
          response.data?.message ||
          "Driver vehicle assignment updated successfully.",
      });
      await loadData();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text:
          error.response?.data?.error || "Failed to update the driver vehicle.",
      });
    }
  };

  const handleUnassignVehicle = async (driver) => {
    if (!driver.vehicle_id) {
      Swal.fire({
        icon: "info",
        title: "Already unassigned",
        text: "This driver is not linked to any vehicle.",
      });
      return;
    }

    const confirmed = await confirmAction(
      "Unassign driver?",
      "Are you sure you want to remove this driver from the current vehicle?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await unassignDriverFromVehicle(driver.driver_id);
      Swal.fire({
        icon: "success",
        title: "Vehicle removed",
        text:
          response.data?.message ||
          "Driver unassigned from vehicle successfully.",
      });
      await loadData();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unassign failed",
        text: error.response?.data?.error || "Failed to unassign the driver.",
      });
    }
  };

  const getVehicleLabel = (driver) => {
    if (!driver.vehicle_id) {
      return "Unassigned";
    }

    return driver.vehicle_plate || "Assigned vehicle";
  };

  return (
    <div className="content-wrapper">
      <section className="content">
        <div className="container-fluid py-3">
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header d-flex flex-column flex-md-row align-items-md-center justify-content-between">
                  <div>
                    <h3 className="card-title mb-0">Driver Management</h3>
                    <small className="text-muted">
                      View, update, assign, unassign, and reassign drivers
                    </small>
                  </div>
                  <div className="mt-3 mt-md-0" style={{ minWidth: "280px" }}>
                    <input
                      type="search"
                      className="form-control"
                      placeholder="Search drivers..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover mb-0 align-middle">
                      <thead className="thead-light">
                        <tr>
                          <th>Driver Name</th>
                          <th>Phone</th>
                          <th>National ID</th>
                          <th>License Number</th>
                          <th>License Expiry</th>
                          <th>Owner Name</th>
                          <th>Current Vehicle / Matatu</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDrivers.length === 0 && (
                          <tr>
                            <td
                              colSpan="9"
                              className="text-center text-muted py-4"
                            >
                              {loading
                                ? "Loading drivers..."
                                : "No drivers found."}
                            </td>
                          </tr>
                        )}

                        {filteredDrivers.map((driver) => {
                          const isEditing =
                            editingDriverId === driver.driver_id;
                          const currentSelection =
                            vehicleSelections[driver.driver_id] || "";

                          return (
                            <tr key={driver.driver_id}>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    name="full_name"
                                    value={editForm.full_name}
                                    onChange={handleEditChange}
                                  />
                                ) : (
                                  driver.full_name
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    name="phone"
                                    value={editForm.phone}
                                    onChange={handleEditChange}
                                  />
                                ) : (
                                  driver.phone
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    name="national_id"
                                    value={editForm.national_id}
                                    onChange={handleEditChange}
                                  />
                                ) : (
                                  driver.national_id
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    name="license_number"
                                    value={editForm.license_number}
                                    onChange={handleEditChange}
                                  />
                                ) : (
                                  driver.license_number
                                )}
                              </td>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="date"
                                    className="form-control form-control-sm"
                                    name="license_expiry_date"
                                    value={editForm.license_expiry_date}
                                    onChange={handleEditChange}
                                  />
                                ) : driver.license_expiry_date ? (
                                  String(driver.license_expiry_date).slice(
                                    0,
                                    10,
                                  )
                                ) : (
                                  "N/A"
                                )}
                              </td>
                              <td>{driver.owner_name || "Unknown owner"}</td>
                              <td>
                                <div
                                  className="d-flex flex-column"
                                  style={{ gap: "0.5rem" }}
                                >
                                  <div>{getVehicleLabel(driver)}</div>
                                  <select
                                    className="form-control form-control-sm"
                                    value={currentSelection}
                                    onChange={(event) =>
                                      handleVehicleSelection(
                                        driver.driver_id,
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <option value="">Unassigned</option>
                                    {vehicles.map((vehicle) => {
                                      const assignedElsewhere =
                                        vehicle.assigned_driver_id &&
                                        String(vehicle.assigned_driver_id) !==
                                          String(driver.driver_id);
                                      const isCurrentVehicle =
                                        String(vehicle.matatu_id) ===
                                        String(driver.vehicle_id || "");

                                      return (
                                        <option
                                          key={vehicle.matatu_id}
                                          value={vehicle.matatu_id}
                                          disabled={
                                            assignedElsewhere &&
                                            !isCurrentVehicle
                                          }
                                        >
                                          {vehicle.number_plate}
                                          {vehicle.owner_name
                                            ? ` - ${vehicle.owner_name}`
                                            : ""}
                                          {assignedElsewhere &&
                                          !isCurrentVehicle
                                            ? " (assigned)"
                                            : ""}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              </td>
                              <td>
                                <span
                                  className={`badge ${driver.status === "active" ? "badge-success" : "badge-secondary"}`}
                                >
                                  {driver.status}
                                </span>
                              </td>
                              <td>
                                <div
                                  className="d-flex flex-wrap"
                                  style={{ gap: "0.35rem" }}
                                >
                                  {isEditing ? (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="success"
                                        onClick={handleSaveDriver}
                                      >
                                        Save Update
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        onClick={closeEditModal}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      onClick={() => openEditModal(driver)}
                                    >
                                      Edit
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="warning"
                                    onClick={() => handleChangeVehicle(driver)}
                                    disabled={
                                      !currentSelection ||
                                      String(currentSelection) ===
                                        String(driver.vehicle_id || "")
                                    }
                                  >
                                    Change Vehicle
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() =>
                                      handleUnassignVehicle(driver)
                                    }
                                    disabled={!driver.vehicle_id}
                                  >
                                    Unassign Vehicle
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
