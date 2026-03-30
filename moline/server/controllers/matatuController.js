const { pool } = require("../config/database");
const { generateDOCX, generatePDF, generateTXT } = require("../utils/export");

const getMatatus = (req, res) => {
  const sql = `
        SELECT 
            m.matatu_id, 
            m.number_plate, 
            m.status,
            driver.first_name AS driver_first_name, 
            driver.last_name AS driver_last_name,
            owner.first_name AS owner_first_name,
            owner.last_name AS owner_last_name
        FROM matatus m
        LEFT JOIN users driver ON m.driver_id = driver.user_id
        LEFT JOIN users owner ON m.owner_id = owner.user_id
    `;
  pool.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching matatus data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
};

const getMatatusForUser = async (req, res) => {
  const userId = req.params.userId || req.userId;
  const { matatu_id } = req.query;

  const sql = `
        SELECT 
            m.matatu_id,
            MAX(m.number_plate) AS number_plate,
            MAX(m.status) AS status,
            MAX(driver.first_name) AS driver_first_name,
            MAX(driver.last_name) AS driver_last_name,
            MAX(owner.first_name) AS owner_first_name,
            MAX(owner.last_name) AS owner_last_name,
            COALESCE(SUM(s.amount), 0) AS total_savings,
            COALESCE(MAX(l.amount_due), 0) AS loan,
            MAX(i.insurance_expiry) AS insurance_expiry
        FROM matatus m
        LEFT JOIN users driver ON m.driver_id = driver.user_id
        LEFT JOIN users owner ON m.owner_id = owner.user_id
        LEFT JOIN savings s ON m.matatu_id = s.matatu_id
        LEFT JOIN (
            SELECT matatu_id, MAX(amount_due) AS amount_due
            FROM loans
            WHERE loan_type = 'normal'
            GROUP BY matatu_id
        ) l ON m.matatu_id = l.matatu_id
        LEFT JOIN (
            SELECT matatu_id, MAX(insurance_expiry) AS insurance_expiry
            FROM insurance
            GROUP BY matatu_id
        ) i ON m.matatu_id = i.matatu_id
        WHERE m.owner_id = ? ${matatu_id ? "AND m.matatu_id = ?" : ""}
        GROUP BY m.matatu_id
    `;

  const queryParams = [userId];
  if (matatu_id) {
    queryParams.push(matatu_id);
  }

  pool.query(sql, queryParams, (error, results) => {
    if (error) {
      console.error("Error fetching matatus data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
};

const updateUserProfile = (req, res) => {
  const userId = req.userId;
  const { first_name, last_name, email, phone, address, national_id } =
    req.body;

  if (
    !first_name ||
    !last_name ||
    !email ||
    !phone ||
    !address ||
    !national_id
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = `
        UPDATE Users
        SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, national_id = ?
        WHERE user_id = ?
    `;

  pool.query(
    sql,
    [first_name, last_name, email, phone, address, national_id, userId],
    (error, results) => {
      if (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({ error: "An unexpected error occurred" });
      }
      res.json({ message: "User profile updated successfully" });
    },
  );
};

const getMatauById = (req, res) => {
  const sql = "SELECT * FROM matatus WHERE matatu_id = ?";
  pool.query(sql, [req.params.id], (error, results) => {
    if (error) {
      console.error("Error fetching matatu data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Matatu not found" });
    }
    res.json(results[0]);
  });
};

const updateMatatu = (req, res) => {
  const { plate_number, status, insurance_status } = req.body;
  const sql =
    "UPDATE matatus SET plate_number = ?, status = ?, insurance_status = ?, WHERE matatu_id = ?";
  pool.query(
    sql,
    [plate_number, status, insurance_status, req.params.id],
    (error, results) => {
      if (error) {
        console.error("Error updating matatu data:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Matatu not found" });
      }
      res.json({ message: "Matatu updated successfully" });
    },
  );
};

const deleteMatatu = (req, res) => {
  const sql = "DELETE FROM matatus WHERE matatu_id = ?";
  pool.query(sql, [req.params.id], (error, results) => {
    if (error) {
      console.error("Error deleting matatu data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Matatu not found" });
    }
    res.json({ message: "Matatu deleted successfully" });
  });
};

const resetMatatu = (req, res) => {
  const sql = 'UPDATE matatus SET status = "inactive" WHERE matatu_id = ?';
  pool.query(sql, [req.params.id], (error, results) => {
    if (error) {
      console.error("Error resetting matatu status:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Matatu not found" });
    }
    res.json({ message: "Matatu status reset to inactive" });
  });
};
const approveMatatu = (req, res) => {
  const sql = 'UPDATE matatus SET status = "active" WHERE matatu_id = ?';
  pool.query(sql, [req.params.id], (error, results) => {
    if (error) {
      console.error("Error resetting matatu status:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Matatu not found" });
    }
    res.json({ message: "Matatu status reset to inactive" });
  });
};

const drivers = (req, res) => {
  const sql = `
        SELECT u.user_id, u.first_name, u.last_name
        FROM users u
        JOIN user_role ur ON u.user_id = ur.user_id
        WHERE ur.role_id = 200
    `;

  pool.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching drivers:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
};

const assignDriver = (req, res) => {
  const { driverId } = req.body;
  const sql = "UPDATE matatus SET driver_id = ? WHERE matatu_id = ?";
  pool.query(sql, [driverId, req.params.id], (error, results) => {
    if (error) {
      console.error("Error assigning driver:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Matatu not found" });
    }
    res.json({ message: "Driver assigned successfully" });
  });
};

const getRoutes = (req, res) => {
  const sql = "SELECT * FROM routes";
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching routes:", err);
      return res.status(500).json({ error: "Failed to retrieve routes" });
    }
    res.status(200).json(results);
  });
};

const newRoute = (req, res) => {
  const { route_name, start_location, end_location } = req.body;

  if (!route_name || !start_location || !end_location) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql =
    "INSERT INTO routes (route_name, start_location, end_location) VALUES (?, ?, ?)";
  pool.query(sql, [route_name, start_location, end_location], (err, result) => {
    if (err) {
      console.error("Error adding route:", err);
      return res.status(500).json({ error: "Failed to add route" });
    }
    res
      .status(201)
      .json({ message: "Route added successfully", route_id: result.insertId });
  });
};

const documents = async (req, res) => {
  const { format } = req.query;

  const sql = `
        SELECT 
            m.matatu_id, 
            m.number_plate, 
            m.status,
            driver.first_name AS driver_first_name, 
            driver.last_name AS driver_last_name,
            owner.first_name AS owner_first_name,
            owner.last_name AS owner_last_name
        FROM matatus m
        LEFT JOIN users driver ON m.driver_id = driver.user_id
        LEFT JOIN users owner ON m.owner_id = owner.user_id
    `;
  pool.query(sql, async (error, results) => {
    if (error) {
      console.error("Error fetching matatus data:", error);
      return res.status(500).json({ error: "Internal server error" });
    }

    let fileBuffer;
    let contentType;
    let fileExtension;

    switch (format) {
      case "pdf":
        fileBuffer = await generatePDF(results);
        contentType = "application/pdf";
        fileExtension = "pdf";
        break;
      case "txt":
        fileBuffer = generateTXT(results);
        contentType = "text/plain";
        fileExtension = "txt";
        break;
      case "docx":
        fileBuffer = await generateDOCX(results);
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        fileExtension = "docx";
        break;
      case "json":
      default:
        fileBuffer = generateJSON(results);
        contentType = "application/json";
        fileExtension = "json";
        break;
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=matatu_driver_list.${fileExtension}`,
    );
    res.setHeader("Content-Type", contentType);
    res.send(fileBuffer);
  });
};

const registerVehicle = async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Authorization header is missing" });
  }

  const {
    numberPlate,
    vehicleType,
    seatingCapacity,
    chassisNumber,
    yearOfMake,
    route_id,
  } = req.body;

  if (
    !numberPlate ||
    !vehicleType ||
    !seatingCapacity ||
    !chassisNumber ||
    !yearOfMake
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const vehicleLogbook =
    req.files && req.files.vehicleLogbook
      ? req.files.vehicleLogbook[0].filename
      : null;

  // if (!vehicleLogbook) {
  //     return res.status(400).json({ error: 'Vehicle logbook image is required' });
  // }

  console.log("Uploaded vehicle logbook file: ", vehicleLogbook);

  // SQL query to insert matatu details
  const sql = `
        INSERT INTO matatus (owner_id, number_plate, log_book, vehicle_type, seating_capacity, chassis_number, year, route_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
  const values = [
    userId,
    numberPlate,
    vehicleLogbook,
    vehicleType,
    seatingCapacity,
    chassisNumber,
    yearOfMake,
    route_id,
  ];

  try {
    pool.query(sql, values, (error, results) => {
      if (error) {
        console.error("Error registering vehicle:", error);

        if (error.code === "ER_DUP_ENTRY") {
          return res
            .status(400)
            .json({ error: "Duplicate entry. The vehicle already exists." });
        } else {
          return res
            .status(500)
            .json({ error: "An error occurred while registering the vehicle" });
        }
      }

      res.json({ message: "Vehicle registered successfully" });
    });
  } catch (error) {
    console.error("Error inserting vehicle details:", error);
    res
      .status(500)
      .json({ error: "An error occurred while registering the vehicle" });
  }
};

const getUserById = (req, res) => {
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({ error: "unauthorized" });
    return;
  }

  const sql = "SELECT * FROM Users WHERE user_id = ?";
  pool.query(sql, [userId], (error, results) => {
    if (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "An unexpected error occurred" });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(results[0]);
  });
};
const pendingLoans = (req, res) => {
  const sql = "SELECT * FROM loans WHERE amount_issued = 0";
  pool.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching pending loans:", error);
      res.status(500).json({ error: "Error fetching pending loans" });
      return;
    }
    res.json(results);
  });
};

const deleteRoute = (req, res) => {
  const sql = "DELETE FROM routes WHERE route_id = ?";
  pool.query(sql, [req.params.route_id], (error, results) => {
    if (error) {
      console.error("Error deleting route:", error);
      res.status(500).json({ error: "Error deleting route" });
      return;
    }
    res.status(200).json({ message: "Route deleted successfully" });
  });
};

module.exports = {
  getMatatus,
  getMatauById,
  updateMatatu,
  deleteMatatu,
  resetMatatu,
  drivers,
  assignDriver,
  documents,
  getUserById,
  getMatatusForUser,
  registerVehicle,
  pendingLoans,
  approveMatatu,
  updateUserProfile,
  getRoutes,
  newRoute,
  deleteRoute,
};
