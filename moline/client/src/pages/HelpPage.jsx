import React from "react";
import { useParams } from "react-router-dom";
import "./HowToJoin.css";

const HELP_CONTENT = {
  "join-sacco": {
    title: "How to Join the SACCO",
    steps: [
      "Open the system and click Join SACCO or Sign Up.",
      "Fill in your personal details such as first and last name, ID number, phone number, email, address, gender and password.",
      "Upload image of your ID.",
      "Submit the details.",
      "You have successfully been registered and email sent to you.",
      "Sign in with email as username and password set during registration.",
      "Pay initial shareholder capital using MPESA.",
      "You’re now a qualified member.",
    ],
  },
  "apply-loan": {
    title: "How to Apply for Loans",
    steps: [
      "Log in to your SACCO account using your username and password.",
      "Go to the Loans section and click Apply for Loan.",
      "Check your eligibility status, including vehicle ownership and guarantor availability.",
      "Select the type of loan you want to apply for either emergency or normal.",
      "Enter the loan amount you need.",
      "Click Submit Loan Application.",
      "The application is sent to the SACCO for review and approval.",
      "You will receive a notification showing whether the loan has been approved or rejected.",
    ],
  },
  "exit-sacco": {
    title: "How to Exit the SACCO",
    options: [
      {
        title: "Option 1",
        steps: [
          "Log in to your account.",
          "Click Exit SACCO.",
          "Fill in the exit request form and give a reason for leaving.",
          "Enter your login password.",
          "Review your request details before submission.",
          "Click Submit Exit Request.",
          "The SACCO administrator will review your request.",
          "Once approved, you successfully exit the SACCO.",
        ],
      },
      {
        title: "Option 2",
        steps: [
          "Log in to your account.",
          "Click Exit SACCO.",
          "Click download withdrawal request form.",
          "Enter your password then download.",
          "Fill it manually and take it to the SACCO.",
          "Once cleared, you successfully exit the SACCO.",
        ],
      },
    ],
  },
};

export default function HelpPage() {
  const { topic } = useParams();
  const data = HELP_CONTENT[topic] || {
    title: "Help",
    steps: ["No help content found."],
  };

  return (
    <div className="row">
      <div className="col-12">
        <div className="card content-card mb-3">
          <div className="card-body">
            <h3 className="mb-3">{data.title}</h3>

            {data.steps && (
              <div>
                <h5 className="text-primary">Step-by-Step Guide</h5>
                <ol className="list-group list-group-numbered mt-2">
                  {data.steps.map((step, idx) => (
                    <li key={idx} className="list-group-item py-2">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {data.options && (
              <div className="mt-3">
                {data.options.map((opt, idx) => (
                  <div key={idx} className="mb-4">
                    <h5 className="text-success">{opt.title}</h5>
                    <ol className="list-group list-group-numbered mt-2">
                      {opt.steps.map((step, sidx) => (
                        <li key={sidx} className="list-group-item py-2">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
