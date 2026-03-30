import axiosInstance from "../../context/axiosInstance";

const registerVehicle = async (formData) => {
  const dataToSend = new FormData();
  for (const [key, value] of Object.entries(formData)) {
    dataToSend.append(key, value);
  }

  try {
    const response = await axiosInstance.post("/matatus/register", dataToSend);
    return response;
  } catch (error) {
    console.error("Error in registerVehicle:", error);
    throw error;
  }
};

const getRoutes = async () => {
  try {
    const response = await axiosInstance.get("/matatus/routes");
    return response.data;
  } catch (error) {
    console.error("Error fetching routes:", error);
    return [];
  }
};

const getUserDetails = async () => {
  try {
    const response = await axiosInstance.get("/users/userDetails");
    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
};

export { registerVehicle, getRoutes, getUserDetails };
