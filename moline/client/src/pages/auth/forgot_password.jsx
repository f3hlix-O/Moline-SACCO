import React, { useState } from "react";
import Swal from "sweetalert2";
import "./Register.css"; // Import the same CSS used in Login.js
import matisLogo from "../../assets/matis-logo.png";
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/users/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      if (response.ok) {
        // Try parsing JSON, but handle empty/non-JSON responses gracefully
        let successMessage =
          "An email with instructions to reset your password has been sent.";
        try {
          const data = await response.json().catch(() => null);
          if (data && data.message) successMessage = data.message;
        } catch (err) {
          // ignore parse errors and use default message
        }

        Swal.fire({
          icon: "success",
          title: "Check Your Email",
          text: successMessage,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
      } else {
        // Response not ok — attempt to read text then JSON, fallback to statusText
        let errMsg = "An unexpected error occurred";
        try {
          const text = await response.text();
          if (text) {
            try {
              const parsed = JSON.parse(text);
              errMsg =
                parsed.error ||
                parsed.message ||
                text ||
                response.statusText ||
                errMsg;
            } catch (parseErr) {
              errMsg = text || response.statusText || errMsg;
            }
          } else {
            errMsg = response.statusText || errMsg;
          }
        } catch (readErr) {
          errMsg = response.statusText || errMsg;
        }

        Swal.fire({
          icon: "error",
          title: "Reset Failed",
          text: errMsg,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 5000,
          timerProgressBar: true,
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An unexpected error occurred",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
      });
      console.error("Error during password reset:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <section className="text-center">
        <div
          className="p-5 bg-image"
          style={{
            backgroundImage: `url(${matisLogo})`,
            height: 300,
          }}
        />
        <div className="signup-card-container">
          <div
            className="card mx-4 mx-md-5 signup-card shadow-5-strong bg-body-tertiary"
            style={{ marginTop: "-100px", backdropFilter: "blur(30px)" }}
          >
            <div className="card-body py-5 px-md-5">
              <div className="row d-flex justify-content-center">
                <div className="col-lg-30">
                  <h2 className="fw-bold mb-5">Reset Password</h2>
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-12 mb-4">
                        <div className="form-outline custom-input">
                          <input
                            type="email"
                            name="email"
                            id="email"
                            className="form-control custom-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                          <label className="form-label" htmlFor="email">
                            Email
                          </label>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary btn-block mb-2"
                      disabled={isLoading}
                    >
                      {isLoading ? "Processing..." : "Reset Password"}
                    </button>
                    <div className="mt-3">
                      <p>
                        Remember your password?{" "}
                        <a href="/login" className="text-decoration-none">
                          Login here
                        </a>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForgotPassword;
