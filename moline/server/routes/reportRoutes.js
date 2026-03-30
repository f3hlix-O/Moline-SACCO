const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const verifyToken = require('../middleware/verifyToken');

router.get('/matatuDetails', verifyToken, reportController.getMatatusDetails);
router.get('/financialDetails', verifyToken, reportController.getFinancialDetails);

module.exports = router;
