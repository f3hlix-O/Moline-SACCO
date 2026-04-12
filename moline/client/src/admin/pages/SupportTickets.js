import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import axiosInstance from "../../context/axiosInstance";

const getStatusBadgeClass = (status) => {
  const normalizedStatus = String(status || "open").toLowerCase();

  if (normalizedStatus === "closed") {
    return "badge bg-success text-uppercase";
  }

  if (normalizedStatus === "pending") {
    return "badge bg-warning text-dark text-uppercase";
  }

  return "badge bg-primary text-uppercase";
};

function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const { data = [] } = await axiosInstance.get("/admin/support-tickets");
      setTickets(data);
    } catch (error) {
      console.error("Error loading support tickets:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to load support requests",
        text:
          error.response?.data?.error ||
          "Unable to fetch support requests right now.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();

    const interval = setInterval(loadTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-1 bg-gray-100 min-h-screen content-wrapper">
      <section className="container mx-auto">
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200 bg-white d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
            <div>
              <h3 className="text-xl font-semibold mb-1">Support Requests</h3>
              <p className="text-sm text-gray-500 mb-0">
                Review messages submitted through the support form.
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Total requests:{" "}
              <span className="font-semibold text-gray-900">
                {tickets.length}
              </span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="small text-uppercase text-muted">
                    ID
                  </th>
                  <th scope="col" className="small text-uppercase text-muted">
                    User
                  </th>
                  <th scope="col" className="small text-uppercase text-muted">
                    Contact
                  </th>
                  <th scope="col" className="small text-uppercase text-muted">
                    Subject
                  </th>
                  <th scope="col" className="small text-uppercase text-muted">
                    Category
                  </th>
                  <th scope="col" className="small text-uppercase text-muted">
                    Priority
                  </th>
                  <th scope="col" className="small text-uppercase text-muted">
                    Status
                  </th>
                  <th scope="col" className="small text-uppercase text-muted">
                    Submitted
                  </th>
                  <th scope="col" className="small text-uppercase text-muted">
                    Message
                  </th>
                  <th scope="col" className="small text-uppercase text-muted">
                    Attachment
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="py-4 text-center text-muted" colSpan="10">
                      Loading support requests...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td className="py-4 text-center text-muted" colSpan="10">
                      No support requests have been submitted yet.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="fw-semibold text-dark">#{ticket.id}</td>
                      <td>
                        <div className="fw-semibold">{ticket.user_name}</div>
                        <div className="text-muted small">
                          User ID: {ticket.user_id || "-"}
                        </div>
                      </td>
                      <td>
                        <div>{ticket.email || "-"}</div>
                        {ticket.phone ? (
                          <div className="text-muted small">{ticket.phone}</div>
                        ) : null}
                      </td>
                      <td style={{ minWidth: "180px" }}>{ticket.subject}</td>
                      <td>{ticket.category}</td>
                      <td>{ticket.priority}</td>
                      <td>
                        <span className={getStatusBadgeClass(ticket.status)}>
                          {ticket.status || "open"}
                        </span>
                      </td>
                      <td style={{ minWidth: "170px" }}>
                        {ticket.created_at
                          ? new Date(ticket.created_at).toLocaleString()
                          : "-"}
                      </td>
                      <td style={{ minWidth: "280px" }}>{ticket.message}</td>
                      <td style={{ minWidth: "140px" }}>
                        {ticket.attachment ? (
                          <a
                            href={ticket.attachment}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View file
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SupportTickets;
