import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./Register.css";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Passwords do not match",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }
    if (newPassword.length < 8) {
      Swal.fire({
        icon: "error",
        title: "Password too short",
        text: "Use at least 8 characters",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/users/reset-password/confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token, newPassword }),
        },
      );

      if (response.ok) {
        let successMsg = "Password has been reset successfully";
        try {
          const data = await response.json().catch(() => null);
          if (data && data.message) successMsg = data.message;
        } catch (_) {}

        Swal.fire({
          icon: "success",
          title: "Success",
          text: successMsg,
          toast: true,
          position: "top-end",
          timer: 3000,
          showConfirmButton: false,
        });
        setTimeout(() => navigate("/login"), 1000);
      } else {
        let errMsg = "An unexpected error occurred";
        try {
          const text = await response.text();
          if (text) {
            try {
              const parsed = JSON.parse(text);
              errMsg = parsed.error || parsed.message || text;
            } catch {
              errMsg = text;
            }
          } else errMsg = response.statusText || errMsg;
        } catch (_) {
          errMsg = response.statusText || errMsg;
        }

        Swal.fire({
          icon: "error",
          title: "Reset Failed",
          text: errMsg,
          toast: true,
          position: "top-end",
          timer: 4000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Reset error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An unexpected error occurred",
        toast: true,
        position: "top-end",
        timer: 4000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-center mt-5">
      <div className="container" style={{ maxWidth: 520 }}>
        <div className="card p-4 shadow-sm">
          <h3 className="mb-3">Reset Password</h3>
          <p className="text-muted">
            Reset password for <strong>{email}</strong>
          </p>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <div className="input-group">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowNewPassword((s) => !s)}
                  disabled={isLoading}
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  disabled={isLoading}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
