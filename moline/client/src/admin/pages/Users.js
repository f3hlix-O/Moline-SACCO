import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  fetchWithdrawalRequests,
  updateWithdrawalStatus,
} from "../components/users";

const getStatusBadgeClass = (status) => {
  const normalizedStatus = String(status || "pending").toLowerCase();

  if (normalizedStatus === "approved") {
    return "badge bg-success text-uppercase";
  }

  if (normalizedStatus === "rejected") {
    return "badge bg-danger text-uppercase";
  }

  return "badge bg-warning text-dark text-uppercase";
};

const getStatusValue = (status) => String(status || "pending").toLowerCase();

const renderWithdrawalRows = (withdrawals, showActions, onStatusChange) =>
  withdrawals.map((withdrawal) => (
    <tr key={withdrawal.withdrawal_id}>
      <td className="fw-semibold text-dark">#{withdrawal.withdrawal_id}</td>
      <td>{withdrawal.user_name}</td>
      <td>{withdrawal.email}</td>
      <td style={{ minWidth: "240px" }}>{withdrawal.reason}</td>
      <td>
        {withdrawal.created_at
          ? new Date(withdrawal.created_at).toLocaleString()
          : "-"}
      </td>
      <td>
        <span className={getStatusBadgeClass(withdrawal.status)}>
          {withdrawal.status || "pending"}
        </span>
      </td>
      <td className="text-end">
        {showActions ? (
          <div className="d-inline-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={() =>
                onStatusChange(withdrawal.withdrawal_id, "approved")
              }
            >
              Approve
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() =>
                onStatusChange(withdrawal.withdrawal_id, "rejected")
              }
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="text-muted small">No actions</span>
        )}
      </td>
    </tr>
  ));

function Users() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false);

  const pendingWithdrawals = withdrawals.filter(
    (withdrawal) => getStatusValue(withdrawal.status) === "pending",
  );
  const approvedWithdrawals = withdrawals.filter(
    (withdrawal) => getStatusValue(withdrawal.status) === "approved",
  );
  const rejectedWithdrawals = withdrawals.filter(
    (withdrawal) => getStatusValue(withdrawal.status) === "rejected",
  );

  const refreshUsers = async () => {
    setWithdrawalsLoading(true);
    try {
      const withdrawalData = await fetchWithdrawalRequests();
      setWithdrawals(withdrawalData || []);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const handleStatusChange = async (withdrawalId, status) => {
    const updatedWithdrawal = await updateWithdrawalStatus(
      withdrawalId,
      status,
    );

    if (!updatedWithdrawal) {
      return;
    }

    setWithdrawals((currentWithdrawals) =>
      currentWithdrawals.map((withdrawal) =>
        withdrawal.withdrawal_id === withdrawalId
          ? {
              ...withdrawal,
              ...updatedWithdrawal,
              status: updatedWithdrawal.status || status,
            }
          : withdrawal,
      ),
    );
  };

  useEffect(() => {
    const initializeData = async () => {
      await refreshUsers();
    };
    initializeData();
  }, []);

  return (
    <div className="p-1 bg-gray-100 min-h-screen content-wrapper">
      <section className="container mx-auto">
        <div className="mt-8">
          <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 bg-white">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                <div>
                  <h3 className="text-xl font-semibold mb-1">
                    Withdrawal Submissions
                  </h3>
                  <p className="text-sm text-gray-500 mb-0">
                    Review every request submitted by members.
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Total submissions:{" "}
                  <span className="font-semibold text-gray-900">
                    {withdrawals.length}
                  </span>
                </div>
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
                      User Name
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      Email
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      Reason
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      Submitted At
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      Status
                    </th>
                    <th
                      scope="col"
                      className="small text-uppercase text-muted text-end"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalsLoading ? (
                    <tr>
                      <td className="py-4 text-center text-muted" colSpan="7">
                        Loading withdrawal submissions...
                      </td>
                    </tr>
                  ) : pendingWithdrawals.length === 0 ? (
                    <tr>
                      <td className="py-4 text-center text-muted" colSpan="7">
                        No pending withdrawal submissions yet.
                      </td>
                    </tr>
                  ) : (
                    renderWithdrawalRows(
                      pendingWithdrawals,
                      true,
                      handleStatusChange,
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200 mb-4">
            <div className="px-6 py-5 border-b border-gray-200 bg-white">
              <h3 className="text-xl font-semibold mb-1">
                Approved Withdrawals
              </h3>
              <p className="text-sm text-gray-500 mb-0">
                Completed requests are kept here for review.
              </p>
            </div>
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="small text-uppercase text-muted">
                      ID
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      User Name
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      Email
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      Reason
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      Submitted At
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      Status
                    </th>
                    <th
                      scope="col"
                      className="small text-uppercase text-muted text-end"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalsLoading ? (
                    <tr>
                      <td className="py-4 text-center text-muted" colSpan="7">
                        Loading withdrawal submissions...
                      </td>
                    </tr>
                  ) : approvedWithdrawals.length === 0 ? (
                    <tr>
                      <td className="py-4 text-center text-muted" colSpan="7">
                        No approved withdrawal submissions yet.
                      </td>
                    </tr>
                  ) : (
                    renderWithdrawalRows(
                      approvedWithdrawals,
                      false,
                      handleStatusChange,
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 bg-white">
              <h3 className="text-xl font-semibold mb-1">
                Rejected Withdrawals
              </h3>
              <p className="text-sm text-gray-500 mb-0">
                Declined requests are listed here below the pending table.
              </p>
            </div>
            <div className="table-responsive">
              <table className="table table-striped table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="small text-uppercase text-muted">
                      ID
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      User Name
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      Email
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      Reason
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      Submitted At
                    </th>
                    <th scope="col" className="small text-uppercase text-muted">
                      Status
                    </th>
                    <th
                      scope="col"
                      className="small text-uppercase text-muted text-end"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalsLoading ? (
                    <tr>
                      <td className="py-4 text-center text-muted" colSpan="7">
                        Loading withdrawal submissions...
                      </td>
                    </tr>
                  ) : rejectedWithdrawals.length === 0 ? (
                    <tr>
                      <td className="py-4 text-center text-muted" colSpan="7">
                        No rejected withdrawal submissions yet.
                      </td>
                    </tr>
                  ) : (
                    renderWithdrawalRows(
                      rejectedWithdrawals,
                      false,
                      handleStatusChange,
                    )
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

export default Users;
