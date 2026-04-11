import axios from "axios";

const getStoredSessionToken = () => {
  const pathname = (window.location.pathname || "").toLowerCase();
  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/reports");
  const sessionKey = isAdminRoute ? "adminSession" : "userSession";

  try {
    const session = JSON.parse(localStorage.getItem(sessionKey));
    if (session && session.token) {
      return session.token;
    }
  } catch (error) {
    console.error("Failed to parse stored session:", error);
  }

  return localStorage.getItem("token");
};

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredSessionToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axiosInstance;
