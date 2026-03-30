import React, { useState } from "react";
import withdrawalRequestPDF from "../assets/Moline_withdrawal_request.pdf";
import Swal from "sweetalert2";

const ExitSacco = () => {
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { fullName, email: emailAddress, reason: reasonText };
      const res = await fetch("http://localhost:5000/api/forms/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Form submitted successfully",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true,
        });
        setFullName("");
        setEmailAddress("");
        setReasonText("");
      } else {
        const text = await res.text().catch(() => "");
        Swal.fire({
          icon: "error",
          title: "Submission failed",
          text: text || `Status ${res.status}`,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Submission failed",
        text: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="text-center">
        <div className="signup-card-container">
          <div
            className="card mx-4 mx-md-5 signup-card shadow-5-strong bg-body-tertiary"
            style={{ marginTop: "50px", backdropFilter: "blur(30px)" }}
          >
            <div className="card-body py-5 px-md-5">
              <div className="row d-flex justify-content-center">
                <div className="col-lg-8">
                  <h1 className="text-center">Exit SACCO</h1>
                  <p className="text-center">
                    Please fill out the form below to request withdrawal from
                    the SACCO.
                  </p>
                  <form onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        id="fullName"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="email_address">email address</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email_address"
                        placeholder="Enter your email address"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="reason">Reason for Withdrawal</label>
                      <textarea
                        className="form-control"
                        id="reason"
                        rows="3"
                        placeholder="Enter your reason for withdrawal"
                        value={reasonText}
                        onChange={(e) => setReasonText(e.target.value)}
                        required
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                  </form>
                  <div className="mt-4 text-center">
                    <p>
                      If you prefer, you can download the withdrawal request
                      form, fill it out manually, and submit it to the office.
                    </p>
                    <a
                      href={withdrawalRequestPDF}
                      download
                      className="btn btn-secondary"
                    >
                      Download Withdrawal Request Form
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExitSacco;
