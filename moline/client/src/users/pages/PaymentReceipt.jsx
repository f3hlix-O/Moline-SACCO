import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../context/axiosInstance";
import { exportData } from "../../utils/export";

const PaymentReceipt = () => {
  const { payment_id } = useParams(); 
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        const response = await axiosInstance.get(`/finance/payments/${payment_id}`);
        setPaymentDetails(response.data);
      } catch (err) {
        setError("Failed to fetch payment details. Please try again later.");
      }
    };

    fetchPaymentDetails();
  }, [payment_id]);

  const handleDownload = (type) => {
    if (!paymentDetails) return;

    const data = [
      {
        "Payment ID": paymentDetails.payment_id,
        "Amount Paid": paymentDetails.amount_paid,
        "Transaction Code": paymentDetails.transaction_code || "N/A",
        "Date": new Date(paymentDetails.created_at).toLocaleDateString(),
        "Loan": paymentDetails.loan || 0,
        "Savings": paymentDetails.savings || 0,
        "Insurance": paymentDetails.insurance || 0,
        "Operations": paymentDetails.operations || 0,
        "Matatu Plate Number": paymentDetails.matatu_plate || "N/A",
      },
    ];

    const columns = [
      { header: "Payment ID", field: "Payment ID" },
      { header: "Amount Paid", field: "Amount Paid" },
      { header: "Transaction Code", field: "Transaction Code" },
      { header: "Date", field: "Date" },
      { header: "Loan", field: "Loan" },
      { header: "Savings", field: "Savings" },
      { header: "Insurance", field: "Insurance" },
      { header: "Operations", field: "Operations" },
      { header: "Matatu Plate Number", field: "Matatu Plate Number" },
    ];

    exportData(type, data, columns, `Payment_Receipt_${payment_id}`);
  };

  if (error) {
    return (
      <div className="content-wrapper">
        <div className="container mt-5">
          <h2 className="text-center text-danger">{error}</h2>
        </div>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className="content-wrapper">
        <div className="container mt-5">
          <h2 className="text-center">Loading payment details...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div className="container mt-5">
        <div className="card shadow">
          <div className="card-header">
            <h3 className="card-title">Payment Receipt</h3>
          </div>
          <div className="card-body">
            <p><strong>Payment ID:</strong> {paymentDetails.payment_id}</p>
            <p><strong>Amount Paid:</strong> KES {paymentDetails.amount_paid}</p>
            <p><strong>Transaction Code:</strong> {paymentDetails.transaction_code || "N/A"}</p>
            <p><strong>Date:</strong> {new Date(paymentDetails.created_at).toLocaleDateString()}</p>
            {paymentDetails.loan > 0 && <p><strong>Loan:</strong> KES {paymentDetails.loan}</p>}
            {paymentDetails.savings > 0 && <p><strong>Savings:</strong> KES {paymentDetails.savings}</p>}
            {paymentDetails.insurance > 0 && <p><strong>Insurance:</strong> KES {paymentDetails.insurance}</p>}
            {paymentDetails.operations > 0 && <p><strong>Operations:</strong> KES {paymentDetails.operations}</p>}
            {paymentDetails.matatu_plate && <p><strong>Matatu Plate Number:</strong> {paymentDetails.matatu_plate}</p>}
          </div>
          <div className="card-footer">
            <button className="btn btn-primary me-2" onClick={() => handleDownload("pdf")}>
              Download PDF
            </button>
            <button className="btn btn-secondary me-2" onClick={() => handleDownload("csv")}>
              Download CSV
            </button>
            <button className="btn btn-success" onClick={() => handleDownload("xlsx")}>
              Download Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;