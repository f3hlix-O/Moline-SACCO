import React, { useState, useEffect } from "react";
import { fetchAllUserSavings } from "../components/financial";

function Savings() {
  const [userSavings, setUserSavings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserSavings = async () => {
      try {
        setLoading(true);
        const data = await fetchAllUserSavings();
        setUserSavings(data);
      } catch (err) {
        setError("Failed to load user savings");
        console.error("Error loading user savings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUserSavings();

    // Set up polling to refresh data every 30 seconds
    const interval = setInterval(loadUserSavings, 30000);

    return () => clearInterval(interval);
  }, []);

  // Also refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      const loadUserSavings = async () => {
        try {
          const data = await fetchAllUserSavings();
          setUserSavings(data);
        } catch (err) {
          console.error("Error refreshing user savings:", err);
        }
      };
      loadUserSavings();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  if (loading) {
    return (
      <div className="p-1 bg-gray-100 min-h-screen content-wrapper">
        <section className="container mx-auto">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold">User Savings</h3>
            </div>
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading user savings...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-1 bg-gray-100 min-h-screen content-wrapper">
        <section className="container mx-auto">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold">User Savings</h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="p-1 bg-gray-100 min-h-screen content-wrapper">
      <section className="container mx-auto">
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold">User Savings</h3>
            <p className="text-sm text-gray-600 mt-1">
              Overview of all users and their savings in the system
            </p>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
                      Total Savings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {userSavings.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-gray-500 border border-gray-300"
                      >
                        No users found
                      </td>
                    </tr>
                  ) : (
                    userSavings.map((user) => (
                      <tr key={user.userId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-300">
                          {user.userId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-300">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-300">
                          <div>
                            <div>{user.email}</div>
                            {user.phone && (
                              <div className="text-xs text-gray-400">
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-300">
                          {user.savingsLabel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border border-gray-300">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.totalSavings > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.totalSavings > 0
                              ? "Active Saver"
                              : "No Savings"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Savings;
