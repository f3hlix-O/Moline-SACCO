const { pool } = require("../config/database");

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const buildDriverRows = async () => {
  const sql = `
        SELECT
            d.driver_id,
            d.owner_id,
            d.vehicle_id,
            d.full_name,
            d.phone,
            d.national_id,
            d.license_number,
            d.license_expiry_date,
            d.address,
            d.status,
            d.created_at,
            d.updated_at,
            CONCAT_WS(' ', owner.first_name, owner.last_name) AS owner_name,
            owner.email AS owner_email,
            m.number_plate AS vehicle_plate,
            m.matatu_id AS vehicle_matatu_id,
            CASE
                WHEN m.matatu_id IS NULL THEN 'Unassigned'
                ELSE m.number_plate
            END AS vehicle_display,
            CASE
                WHEN assigned.driver_id IS NULL THEN NULL
                ELSE assigned.driver_id
            END AS assigned_driver_id,
            CASE
                WHEN assigned.full_name IS NULL THEN NULL
                ELSE assigned.full_name
            END AS assigned_driver_name
        FROM drivers d
        LEFT JOIN Users owner ON owner.user_id = d.owner_id
        LEFT JOIN matatus m ON m.matatu_id = d.vehicle_id
        LEFT JOIN drivers assigned ON assigned.vehicle_id = m.matatu_id
        ORDER BY d.created_at DESC, d.driver_id DESC
    `;

  return pool.query(sql);
};

const getAvailableVehicles = async (req, res) => {
  try {
    const { ownerId } = req.query;
    const params = [];
    let ownerClause = "";

    if (ownerId) {
      const parsedOwnerId = parsePositiveInt(ownerId);
      if (!parsedOwnerId) {
        return res.status(400).json({ error: "Invalid owner ID" });
      }
      params.push(parsedOwnerId);
      ownerClause = "WHERE m.owner_id = ?";
    }

    const sql = `
            SELECT
                m.matatu_id,
                m.number_plate,
                m.owner_id,
                CONCAT_WS(' ', owner.first_name, owner.last_name) AS owner_name,
                d.driver_id AS assigned_driver_id,
                d.full_name AS assigned_driver_name
            FROM matatus m
            LEFT JOIN Users owner ON owner.user_id = m.owner_id
            LEFT JOIN drivers d ON d.vehicle_id = m.matatu_id
            ${ownerClause}
            ORDER BY m.number_plate ASC
        `;

    const rows = await pool.query(sql, params);
    return res.json(rows);
  } catch (error) {
    console.error("Error fetching vehicles for driver management:", error);
    return res.status(500).json({ error: "Failed to fetch vehicles" });
  }
};

const getOwnerVehicles = async (req, res) => {
  const ownerId = parsePositiveInt(req.userId);
  if (!ownerId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const sql = `
            SELECT
                m.matatu_id,
                m.number_plate,
                m.status,
                COALESCE(SUM(s.amount), 0) AS savings,
                COALESCE(MAX(l.amount_due), 0) AS loan,
                MAX(i.insurance_expiry) AS insurance_expiry,
                d.driver_id,
                d.full_name AS driver_full_name,
                d.phone AS driver_phone,
                d.status AS driver_status
            FROM matatus m
            LEFT JOIN drivers d ON d.vehicle_id = m.matatu_id
            LEFT JOIN savings s ON s.matatu_id = m.matatu_id
            LEFT JOIN (
                SELECT matatu_id, SUM(amount_due) AS amount_due
                FROM loans
                WHERE loan_type = 'normal' AND status = 'approved'
                GROUP BY matatu_id
            ) l ON l.matatu_id = m.matatu_id
            LEFT JOIN (
                SELECT matatu_id, MAX(insurance_expiry) AS insurance_expiry
                FROM insurance
                GROUP BY matatu_id
            ) i ON i.matatu_id = m.matatu_id
            WHERE m.owner_id = ?
            GROUP BY m.matatu_id, m.number_plate, m.status, d.driver_id, d.full_name, d.phone, d.status
            ORDER BY m.matatu_id DESC
        `;

    const rows = await pool.query(sql, [ownerId]);
    return res.json(rows);
  } catch (error) {
    console.error("Error fetching owner vehicles:", error);
    return res.status(500).json({ error: "Failed to fetch owner vehicles" });
  }
};

const createDriver = async (req, res) => {
  try {
    const ownerId = parsePositiveInt(req.userId);
    if (!ownerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const vehicleId = parsePositiveInt(
      req.body.vehicle_id || req.body.vehicleId,
    );
    const fullName = normalizeText(
      req.body.full_name ||
        `${req.body.first_name || ""} ${req.body.last_name || ""}`,
    );
    const phone = normalizeText(req.body.phone);
    const nationalId = normalizeText(req.body.national_id);
    const licenseNumber = normalizeText(
      req.body.license_number || req.body.driver_license_number,
    );
    const licenseExpiryDate = normalizeText(req.body.license_expiry_date);
    const address = normalizeText(req.body.address);

    if (
      !vehicleId ||
      !fullName ||
      !phone ||
      !nationalId ||
      !licenseNumber ||
      !licenseExpiryDate ||
      !address
    ) {
      return res.status(400).json({ error: "All driver fields are required" });
    }

    const vehicleRows = await pool.query(
      "SELECT matatu_id, owner_id FROM matatus WHERE matatu_id = ? LIMIT 1",
      [vehicleId],
    );
    if (!vehicleRows.length) {
      return res.status(404).json({ error: "Selected vehicle was not found" });
    }
    if (Number(vehicleRows[0].owner_id) !== ownerId) {
      return res
        .status(403)
        .json({ error: "You can only register drivers for your own vehicles" });
    }

    const duplicateNational = await pool.query(
      "SELECT driver_id FROM drivers WHERE national_id = ? LIMIT 1",
      [nationalId],
    );
    if (duplicateNational.length > 0) {
      return res
        .status(409)
        .json({ error: "A driver with this national ID already exists" });
    }

    const duplicateLicense = await pool.query(
      "SELECT driver_id FROM drivers WHERE license_number = ? LIMIT 1",
      [licenseNumber],
    );
    if (duplicateLicense.length > 0) {
      return res
        .status(409)
        .json({ error: "A driver with this license number already exists" });
    }

    const assignedVehicle = await pool.query(
      "SELECT driver_id, full_name FROM drivers WHERE vehicle_id = ? LIMIT 1",
      [vehicleId],
    );
    if (assignedVehicle.length > 0) {
      return res.status(409).json({
        error: `This vehicle already has a driver assigned (${assignedVehicle[0].full_name})`,
      });
    }

    const insertSql = `
            INSERT INTO drivers (
                owner_id,
                vehicle_id,
                full_name,
                phone,
                national_id,
                license_number,
                license_expiry_date,
                address,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
    const insertResult = await pool.query(insertSql, [
      ownerId,
      vehicleId,
      fullName,
      phone,
      nationalId,
      licenseNumber,
      licenseExpiryDate,
      address,
      "active",
    ]);

    return res.status(201).json({
      success: true,
      message: "Driver assigned successfully",
      data: {
        driverId: insertResult.insertId,
        ownerId,
        vehicleId,
      },
    });
  } catch (error) {
    console.error("Error creating driver:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Duplicate driver details detected" });
    }
    return res.status(500).json({ error: "Failed to create driver" });
  }
};

const getAllDriversForAdmin = async (req, res) => {
  try {
    const rows = await buildDriverRows();
    return res.json(
      rows.map((row) => ({
        ...row,
        current_vehicle: row.vehicle_display,
        owner_name: row.owner_name || "Unknown owner",
      })),
    );
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return res.status(500).json({ error: "Failed to fetch drivers" });
  }
};

const getDriverById = async (req, res) => {
  const driverId = parsePositiveInt(req.params.id);
  if (!driverId) {
    return res.status(400).json({ error: "Invalid driver ID" });
  }

  try {
    const rows = await pool.query(
      `
                SELECT
                    d.driver_id,
                    d.owner_id,
                    d.vehicle_id,
                    d.full_name,
                    d.phone,
                    d.national_id,
                    d.license_number,
                    d.license_expiry_date,
                    d.address,
                    d.status,
                    d.created_at,
                    d.updated_at,
                    CONCAT_WS(' ', owner.first_name, owner.last_name) AS owner_name,
                    m.number_plate AS vehicle_plate
                FROM drivers d
                LEFT JOIN Users owner ON owner.user_id = d.owner_id
                LEFT JOIN matatus m ON m.matatu_id = d.vehicle_id
                WHERE d.driver_id = ?
                LIMIT 1
            `,
      [driverId],
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Driver not found" });
    }

    return res.json({
      ...rows[0],
      current_vehicle: rows[0].vehicle_plate || null,
    });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return res.status(500).json({ error: "Failed to fetch driver" });
  }
};

const updateDriver = async (req, res) => {
  const driverId = parsePositiveInt(req.params.id);
  if (!driverId) {
    return res.status(400).json({ error: "Invalid driver ID" });
  }

  const fullName = normalizeText(req.body.full_name);
  const phone = normalizeText(req.body.phone);
  const nationalId = normalizeText(req.body.national_id);
  const licenseNumber = normalizeText(req.body.license_number);
  const licenseExpiryDate = normalizeText(req.body.license_expiry_date);
  const address = normalizeText(req.body.address);
  const status = normalizeText(req.body.status).toLowerCase();

  if (
    !fullName ||
    !phone ||
    !nationalId ||
    !licenseNumber ||
    !licenseExpiryDate ||
    !address ||
    !status
  ) {
    return res
      .status(400)
      .json({ error: "All required fields must be provided" });
  }

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ error: "Status must be active or inactive" });
  }

  try {
    const duplicateNational = await pool.query(
      "SELECT driver_id FROM drivers WHERE national_id = ? AND driver_id <> ? LIMIT 1",
      [nationalId, driverId],
    );
    if (duplicateNational.length > 0) {
      return res
        .status(409)
        .json({ error: "Another driver already uses this national ID" });
    }

    const duplicateLicense = await pool.query(
      "SELECT driver_id FROM drivers WHERE license_number = ? AND driver_id <> ? LIMIT 1",
      [licenseNumber, driverId],
    );
    if (duplicateLicense.length > 0) {
      return res
        .status(409)
        .json({ error: "Another driver already uses this license number" });
    }

    await pool.query(
      `
                UPDATE drivers
                SET full_name = ?, phone = ?, national_id = ?, license_number = ?, license_expiry_date = ?, address = ?, status = ?
                WHERE driver_id = ?
            `,
      [
        fullName,
        phone,
        nationalId,
        licenseNumber,
        licenseExpiryDate,
        address,
        status,
        driverId,
      ],
    );

    return res.json({ success: true, message: "Driver updated successfully" });
  } catch (error) {
    console.error("Error updating driver:", error);
    return res.status(500).json({ error: "Failed to update driver" });
  }
};

const assignDriverToVehicle = async (req, res) => {
  const driverId = parsePositiveInt(req.params.id);
  const vehicleId = parsePositiveInt(req.body.vehicle_id || req.body.vehicleId);

  if (!driverId || !vehicleId) {
    return res
      .status(400)
      .json({ error: "Valid driver ID and vehicle ID are required" });
  }

  try {
    const driverRows = await pool.query(
      "SELECT driver_id, vehicle_id FROM drivers WHERE driver_id = ? LIMIT 1",
      [driverId],
    );
    if (!driverRows.length) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const vehicleRows = await pool.query(
      "SELECT matatu_id, owner_id FROM matatus WHERE matatu_id = ? LIMIT 1",
      [vehicleId],
    );
    if (!vehicleRows.length) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    const assignedVehicle = await pool.query(
      "SELECT driver_id FROM drivers WHERE vehicle_id = ? AND driver_id <> ? LIMIT 1",
      [vehicleId, driverId],
    );
    if (assignedVehicle.length > 0) {
      return res
        .status(409)
        .json({ error: "This vehicle already has another driver assigned" });
    }

    const currentVehicleId = driverRows[0].vehicle_id;
    if (currentVehicleId && Number(currentVehicleId) === vehicleId) {
      return res
        .status(200)
        .json({ message: "Driver is already assigned to this vehicle" });
    }

    await pool.query("UPDATE drivers SET vehicle_id = ? WHERE driver_id = ?", [
      vehicleId,
      driverId,
    ]);

    return res.json({
      success: true,
      message: currentVehicleId
        ? "Driver reassigned successfully"
        : "Driver assigned successfully",
    });
  } catch (error) {
    console.error("Error assigning driver to vehicle:", error);
    return res
      .status(500)
      .json({ error: "Failed to assign driver to vehicle" });
  }
};

const unassignDriverFromVehicle = async (req, res) => {
  const driverId = parsePositiveInt(req.params.id);
  if (!driverId) {
    return res.status(400).json({ error: "Invalid driver ID" });
  }

  try {
    const driverRows = await pool.query(
      "SELECT driver_id, vehicle_id FROM drivers WHERE driver_id = ? LIMIT 1",
      [driverId],
    );
    if (!driverRows.length) {
      return res.status(404).json({ error: "Driver not found" });
    }

    if (!driverRows[0].vehicle_id) {
      return res
        .status(400)
        .json({ error: "This driver is already unassigned" });
    }

    await pool.query(
      "UPDATE drivers SET vehicle_id = NULL WHERE driver_id = ?",
      [driverId],
    );
    return res.json({
      success: true,
      message: "Driver unassigned from vehicle successfully",
    });
  } catch (error) {
    console.error("Error unassigning driver:", error);
    return res.status(500).json({ error: "Failed to unassign driver" });
  }
};

const reassignDriverToVehicle = async (req, res) => {
  const driverId = parsePositiveInt(req.params.id);
  const vehicleId = parsePositiveInt(req.body.vehicle_id || req.body.vehicleId);

  if (!driverId || !vehicleId) {
    return res
      .status(400)
      .json({ error: "Valid driver ID and vehicle ID are required" });
  }

  try {
    const driverRows = await pool.query(
      "SELECT driver_id, vehicle_id, full_name FROM drivers WHERE driver_id = ? LIMIT 1",
      [driverId],
    );
    if (!driverRows.length) {
      return res.status(404).json({ error: "Driver not found" });
    }

    const vehicleRows = await pool.query(
      "SELECT matatu_id FROM matatus WHERE matatu_id = ? LIMIT 1",
      [vehicleId],
    );
    if (!vehicleRows.length) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    const assignedVehicle = await pool.query(
      "SELECT driver_id FROM drivers WHERE vehicle_id = ? AND driver_id <> ? LIMIT 1",
      [vehicleId, driverId],
    );
    if (assignedVehicle.length > 0) {
      return res
        .status(409)
        .json({ error: "This vehicle is already assigned to another driver" });
    }

    const previousVehicleId = driverRows[0].vehicle_id;
    if (previousVehicleId && Number(previousVehicleId) === vehicleId) {
      return res
        .status(200)
        .json({
          message: "Driver is already assigned to the selected vehicle",
        });
    }

    await pool.query("UPDATE drivers SET vehicle_id = ? WHERE driver_id = ?", [
      vehicleId,
      driverId,
    ]);

    return res.json({
      success: true,
      message: previousVehicleId
        ? "Driver moved from one vehicle to another successfully"
        : "Driver assigned successfully",
      driver_name: driverRows[0].full_name,
    });
  } catch (error) {
    console.error("Error reassigning driver:", error);
    return res.status(500).json({ error: "Failed to reassign driver" });
  }
};

module.exports = {
  getAvailableVehicles,
  getOwnerVehicles,
  createDriver,
  getAllDriversForAdmin,
  getDriverById,
  updateDriver,
  assignDriverToVehicle,
  unassignDriverFromVehicle,
  reassignDriverToVehicle,
};
