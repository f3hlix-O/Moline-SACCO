import axiosInstance from "../../context/axiosInstance";
import Swal from "sweetalert2";

const fetchDrivers = async () => {
  try {
    const { data = [] } = await axiosInstance.get("/drivers");
    return data;
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return [];
  }
};

const fetchAvailableVehicles = async () => {
  try {
    const { data = [] } = await axiosInstance.get("/drivers/vehicles");
    return data;
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
};

const fetchDriverById = async (driverId) => {
  try {
    const { data } = await axiosInstance.get(`/drivers/${driverId}`);
    return data;
  } catch (error) {
    console.error("Error fetching driver details:", error);
    return null;
  }
};

const updateDriver = async (driverId, payload) => {
  try {
    const response = await axiosInstance.put(`/drivers/${driverId}`, payload);
    return response;
  } catch (error) {
    console.error("Error updating driver:", error);
    throw error;
  }
};

const createDriver = async (payload) => {
  try {
    const response = await axiosInstance.post("/drivers", payload);
    return response;
  } catch (error) {
    console.error("Error creating driver:", error);
    throw error;
  }
};

const assignDriverToVehicle = async (driverId, vehicleId) => {
  try {
    const response = await axiosInstance.patch(
      `/drivers/${driverId}/assign-vehicle`,
      {
        vehicle_id: vehicleId,
      },
    );
    return response;
  } catch (error) {
    console.error("Error assigning driver to vehicle:", error);
    throw error;
  }
};

const unassignDriverFromVehicle = async (driverId) => {
  try {
    const response = await axiosInstance.patch(
      `/drivers/${driverId}/unassign-vehicle`,
    );
    return response;
  } catch (error) {
    console.error("Error unassigning driver from vehicle:", error);
    throw error;
  }
};

const reassignDriverToVehicle = async (driverId, vehicleId) => {
  try {
    const response = await axiosInstance.patch(
      `/drivers/${driverId}/reassign-vehicle`,
      {
        vehicle_id: vehicleId,
      },
    );
    return response;
  } catch (error) {
    console.error("Error reassigning driver to vehicle:", error);
    throw error;
  }
};

const confirmAction = async (title, text) => {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  return result.isConfirmed;
};

export {
  fetchDrivers,
  fetchAvailableVehicles,
  fetchDriverById,
  updateDriver,
  createDriver,
  assignDriverToVehicle,
  unassignDriverFromVehicle,
  reassignDriverToVehicle,
  confirmAction,
};
