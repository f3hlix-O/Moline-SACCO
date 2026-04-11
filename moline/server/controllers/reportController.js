const { pool } = require("../config/database");
const path = require("path");
const fs = require("fs");

const getMatatusDetails = (req, res) => {
  const sql = `
    SELECT 
        m.matatu_id, 
        m.number_plate, 
        m.status,
        d.full_name AS driver_full_name,
        d.phone AS driver_phone,
        owner.first_name AS owner_first_name,
        owner.last_name AS owner_last_name,
        COALESCE(s.amount, 0) AS savings,
        COALESCE(l.amount_due, 0) AS loan,
        i.insurance_expiry
    FROM matatus m
    LEFT JOIN drivers d ON m.matatu_id = d.vehicle_id
    LEFT JOIN users owner ON m.owner_id = owner.user_id
    LEFT JOIN (
        SELECT matatu_id, SUM(amount) AS amount
        FROM savings 
        GROUP BY matatu_id
    ) s ON m.matatu_id = s.matatu_id
    LEFT JOIN (
        SELECT matatu_id, SUM(amount_due) AS amount_due
        FROM loans 
        GROUP BY matatu_id
    ) l ON m.matatu_id = l.matatu_id
    LEFT JOIN (
        SELECT matatu_id, MAX(insurance_expiry) AS insurance_expiry
        FROM insurance 
        GROUP BY matatu_id
    ) i ON m.matatu_id = i.matatu_id
`;

  pool.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching matatus data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
};

const getFinancialDetails = (req, res) => {
  const query = `
        SELECT
            matatus.number_plate,
            loans.amount_issued AS loan_amount_issued,
            loans.amount_due AS loan_amount_due,
            loans.loan_type,
            loans.created_at AS loan_created_at,
            loans.loan_id,
            savings.amount AS savings_amount, 
            insurance.amount AS insurance_amount,
            insurance.insurance_company,
            insurance.policy_number,
            insurance.insurance_expiry
        FROM
            matatus
        LEFT JOIN loans ON matatus.matatu_id = loans.matatu_id
        LEFT JOIN savings ON matatus.matatu_id = savings.matatu_id
        LEFT JOIN insurance ON matatus.matatu_id = insurance.matatu_id
        GROUP BY matatus.matatu_id, loans.loan_id, savings.ID, insurance.ID;
    `;

  pool.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching financial data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
};

const getComplianceReport = (req, res) => {
  // Return structured report data for preview
  const reportData = {
    title: "Moline Matatu SACCO",
    subtitle: "Admin Compliance Report",
    reportingPeriod: "1 January 2026 – 31 March 2026",
    assessmentResult: "Partially Compliant",
    sections: [
      {
        title: "Executive Summary",
        content:
          "This report provides an assessment of Moline Matatu SACCO's compliance with regulatory requirements and internal policies for the period from 1 January 2026 to 31 March 2026. The assessment reveals a partially compliant status, with several areas requiring immediate attention.",
      },
      {
        title: "Purpose of the Report",
        content:
          "The purpose of this compliance report is to evaluate Moline Matatu SACCO's adherence to applicable laws, regulations, and internal policies governing SACCO operations, financial management, and member services.",
      },
      {
        title: "Scope of Review",
        content:
          "The review covered operational compliance, financial reporting accuracy, member data protection, vehicle registration compliance, and adherence to SACCO governance standards.",
      },
      {
        title: "Methodology",
        content:
          "The assessment was conducted through document review, system audits, and verification of operational procedures against established compliance frameworks.",
      },
      {
        title: "Compliance Criteria",
        content:
          "Compliance was evaluated against SACCO Act requirements, data protection regulations, financial reporting standards, and internal operational policies.",
      },
      {
        title: "Detailed Findings",
        content:
          "Key findings include strong compliance in member registration and basic financial reporting, with gaps in advanced regulatory reporting and some operational documentation.",
      },
      {
        title: "Summary of Compliance Status",
        content:
          "Overall compliance rating: 75% - Partially Compliant. Critical areas requiring attention include enhanced regulatory reporting and documentation standardization.",
      },
      {
        title: "Key Non-Compliance Issues Identified",
        content:
          "1. Incomplete regulatory reporting submissions\n2. Documentation gaps in vehicle compliance records\n3. Delayed financial statement preparations",
      },
      {
        title: "Corrective Action Plan",
        content:
          "1. Implement automated regulatory reporting system\n2. Establish documentation review protocols\n3. Schedule quarterly compliance audits\n4. Provide staff training on compliance requirements",
      },
      {
        title: "Conclusion",
        content:
          "While demonstrating good foundational compliance practices, Moline Matatu SACCO requires focused improvements in regulatory reporting and documentation to achieve full compliance status.",
      },
    ],
    approval: {
      preparedBy: "Compliance Officer",
      reviewedBy: "Internal Auditor",
      approvedBy: "SACCO Board Chairman",
      date: "6 April 2026",
    },
  };
  res.json(reportData);
};

const downloadComplianceReport = (req, res) => {
  const filePath = path.join(
    __dirname,
    "..",
    "reports",
    "Moline_Matatu_SACCO_Compliance_Report.pdf",
  );

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error("PDF file not found at:", filePath);
    return res.status(404).json({ error: "Compliance report file not found" });
  }

  // Use res.download() for proper file download handling
  res.download(filePath, "Moline_Matatu_SACCO_Compliance_Report.pdf", (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      // Check if error is because file was not found (though we checked above)
      if (err.code === "ENOENT") {
        return res
          .status(404)
          .json({ error: "Compliance report file not found" });
      }
      // Other errors
      return res.status(500).json({ error: "Error downloading file" });
    }
  });
};

module.exports = {
  getMatatusDetails,
  getFinancialDetails,
  getComplianceReport,
  downloadComplianceReport,
};
