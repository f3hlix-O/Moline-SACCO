import React, { useState } from "react";
import Swal from "sweetalert2";
import axiosInstance from "../../context/axiosInstance";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ContactSupport.css"; // Import your CSS file for styling

function ContactSupport({ show, onClose }) {
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    priority: "",
    message: "",
    attachment: null,
  });

  const categories = [
    "Registration Problem",
    "Payment Issue",
    "Loan Inquiry",
    "Vehicle Registration Issue",
    "Technical Problem",
    "Other",
  ];

  const priorities = ["Low", "Medium", "High"];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.subject ||
      !formData.category ||
      !formData.priority ||
      !formData.message
    ) {
      Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "Please fill in all required fields.",
      });
      return;
    }

    const data = new FormData();
    // Ensure attachment is an empty string when not provided (backend expects string/Mixed)
    const attachmentValue = formData.attachment ? formData.attachment : "";
    data.append("subject", formData.subject);
    data.append("category", formData.category);
    data.append("priority", formData.priority);
    data.append("message", formData.message);
    data.append("attachment", attachmentValue);

    try {
      const response = await axiosInstance.post(
        "/users/support/tickets",
        data,
        {
          transformRequest: [
            (d, headers) => {
              // Remove any default JSON Content-Type so the browser sets multipart boundary
              if (headers && headers["Content-Type"])
                delete headers["Content-Type"];
              return d;
            },
          ],
        },
      );

      if (response.status >= 200 && response.status < 300) {
        Swal.fire({
          icon: "success",
          title: "Support Request Sent",
          text: "Our team will get back to you shortly.",
        });
        setFormData({
          subject: "",
          category: "",
          priority: "",
          message: "",
          attachment: null,
        });
        // Clear persisted draft after successful submission
        try {
          sessionStorage.removeItem("contactSupportForm");
        } catch (err) {
          /* ignore */
        }
        onClose(); // Close the modal after successful submission
      }
    } catch (error) {
      console.error(
        "Error sending support request:",
        error.response || error.message || error,
      );
      const serverMessage =
        (error.response &&
          error.response.data &&
          (error.response.data.error || error.response.data.message)) ||
        error.message ||
        "There was an issue submitting your request. Please try again later.";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: serverMessage,
      });
    }
  };

  // Persist draft to sessionStorage so reopening preserves user input
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem("contactSupportForm");
      if (saved) setFormData(JSON.parse(saved));
    } catch (err) {
      // ignore parse errors
    }
  }, []);

  // Save draft on every change
  React.useEffect(() => {
    try {
      sessionStorage.setItem("contactSupportForm", JSON.stringify(formData));
    } catch (err) {
      // ignore storage errors
    }
  }, [formData]);

  // Close on Escape key when visible
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (show) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h5 className="modal-title">Contact Support</h5>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
          ></button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="form-outline mb-4">
              <input
                type="text"
                className="form-control"
                placeholder="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-outline mb-4">
              <select
                className="form-control"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-outline mb-4">
              <select
                className="form-control"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
              >
                <option value="">Select Priority</option>
                {priorities.map((pri, index) => (
                  <option key={index} value={pri}>
                    {pri}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-outline mb-4">
              <textarea
                className="form-control"
                name="message"
                placeholder="Describe your issue here..."
                value={formData.message}
                onChange={handleChange}
                rows="5"
                required
              />
            </div>
            <div className="form-outline mb-4">
              <input
                type="file"
                name="attachment"
                onChange={handleChange}
                className="form-control"
                accept=".jpg,.jpeg,.png,.pdf"
              />
              <small className="text-muted">
                Optional: Upload screenshot or supporting document.
              </small>
            </div>
            <button type="submit" className="btn btn-primary btn-block mb-4">
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactSupport;
