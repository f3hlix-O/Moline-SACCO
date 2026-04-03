import React, { useEffect, useState } from "react";
import withdrawalRequestPDF from "../assets/Moline_withdrawal_request.pdf";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthProvider";
import axiosInstance from "../context/axiosInstance";

const ExitSacco = () => {
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { user, token } = useAuth();

  // Load authenticated user details and autofill name/email
  useEffect(() => {
    let isMounted = true;
    const loadUserDetails = async () => {
      try {
        // If auth context already has user details beyond id, use them
        if (user && user.first_name && user.email) {
          if (!isMounted) return;
          setFullName(`${user.first_name} ${user.last_name || ""}`.trim());
          setEmailAddress(user.email);
          return;
        }

        // If we have a token or user id, fetch full details from backend
        if (token) {
          const resp = await axiosInstance.get("/users/userDetails");
          if (!isMounted) return;
          const u = resp.data;
          setFullName(`${u.first_name || ""} ${u.last_name || ""}`.trim());
          setEmailAddress(u.email || "");
        }
      } catch (err) {
        // fail silently — leave fields empty
        console.error("Failed to load user details for exit form", err);
      }
    };

    loadUserDetails();
    return () => {
      isMounted = false;
    };
  }, [user, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Validate required fields
    if (!reasonText || reasonText.trim() === "") {
      Swal.fire({ icon: "error", title: "Reason is required" });
      setSubmitting(false);
      return;
    }
    if (!password || password.trim() === "") {
      Swal.fire({
        icon: "error",
        title: "Please enter your password to confirm",
      });
      setSubmitting(false);
      return;
    }
    try {
      // Send reason + password; backend will derive name/email from auth token
      const payload = { reason: reasonText, password };
      const resp = await axiosInstance.post("/forms/withdrawal", payload);
      if (resp && resp.data) {
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
        setPassword("");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error || err?.message || "Submission failed";
      Swal.fire({ icon: "error", title: "Submission failed", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadClick = async () => {
    // Prompt the user for their password before allowing download
    const { value: pwd } = await Swal.fire({
      title: "Confirm password to download",
      input: "password",
      inputPlaceholder: "Enter your login password",
      showCancelButton: true,
      confirmButtonText: "Verify & Download",
      preConfirm: (val) => {
        if (!val) {
          Swal.showValidationMessage("Password is required");
        }
        return val;
      },
      didOpen: () => {
        try {
          // Inject small stylesheet once to keep the prompt professional
          if (!document.getElementById("swal-download-password-style")) {
            const style = document.createElement("style");
            style.id = "swal-download-password-style";
            style.innerHTML = `
              .swal2-popup .swal2-input.swal2-password-input {
                padding: 12px 44px 12px 12px !important;
                border-radius: 8px !important;
                border: 1px solid #d1d5db !important;
                box-shadow: 0 1px 3px rgba(16,24,40,0.06) !important;
                font-size: 14px !important;
                background: #fff !important;
              }
              .swal2-password-eye {
                position: absolute;
                right: 10px;
                top: 50%;
                transform: translateY(-50%);
                border: 1px solid transparent;
                background: rgba(99,102,241,0.04);
                cursor: pointer;
                font-size: 18px;
                padding: 6px 8px;
                border-radius: 6px;
                color: #374151;
                transition: background .12s, color .12s, border-color .12s;
              }
              .swal2-password-eye:hover {
                background: rgba(99,102,241,0.12);
                border-color: rgba(99,102,241,0.18);
                color: #1f2937;
              }
            `;
            document.head.appendChild(style);
          }

          const input = Swal.getInput();
          if (!input) return;

          // mark input with class so stylesheet applies
          input.classList.add("swal2-password-input");
          // ensure parent positioned for absolute eye placement
          const parent = input.parentElement;
          if (parent) parent.style.position = "relative";

          // create eye button with class for styling
          const eye = document.createElement("button");
          eye.type = "button";
          eye.className = "swal2-password-eye";
          eye.innerText = "👁️";
          eye.setAttribute("aria-label", "Show password");

          // append to parent (should be inside Swal DOM)
          if (parent) parent.appendChild(eye);

          let visible = false;
          const show = () => {
            input.type = "text";
            eye.innerText = "🙈";
            eye.setAttribute("aria-label", "Hide password");
            visible = true;
          };
          const hide = () => {
            input.type = "password";
            eye.innerText = "👁️";
            eye.setAttribute("aria-label", "Show password");
            visible = false;
          };

          eye.addEventListener("mousedown", show);
          eye.addEventListener("mouseup", hide);
          eye.addEventListener("mouseleave", hide);
          eye.addEventListener("touchstart", show);
          eye.addEventListener("touchend", hide);
          eye.addEventListener("click", (e) => {
            e.preventDefault();
            if (visible) hide();
            else show();
          });
        } catch (e) {
          console.warn(
            "Failed to attach styled eye toggle to download prompt",
            e,
          );
        }
      },
    });

    if (!pwd) return;

    try {
      await axiosInstance.post("/forms/withdrawal/verify-download", {
        password: pwd,
      });

      // Trigger download of the static PDF asset
      const a = document.createElement("a");
      a.href = withdrawalRequestPDF;
      a.download = "Moline_withdrawal_request.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      Swal.fire({
        icon: "success",
        title: "Download starting",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.error || err?.message || "Verification failed";
      Swal.fire({ icon: "error", title: "Verification failed", text: msg });
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
                        readOnly
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
                        readOnly
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
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <div className="input-group">
                        <input
                          type={passwordVisible ? "text" : "password"}
                          className="form-control"
                          id="confirmPassword"
                          placeholder="Enter your login password to confirm"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onMouseDown={() => setPasswordVisible(true)}
                          onMouseUp={() => setPasswordVisible(false)}
                          onMouseLeave={() => setPasswordVisible(false)}
                          onTouchStart={() => setPasswordVisible(true)}
                          onTouchEnd={() => setPasswordVisible(false)}
                          onClick={() => setPasswordVisible((v) => !v)}
                          aria-label={
                            passwordVisible ? "Hide password" : "Show password"
                          }
                        >
                          👁️
                        </button>
                      </div>
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
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleDownloadClick}
                    >
                      Download Withdrawal Request Form
                    </button>
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
