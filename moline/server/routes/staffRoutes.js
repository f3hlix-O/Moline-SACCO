const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const upload = require('../middleware/multerConfig');
const verifyToken = require('../middleware/verifyToken');


router.get('/details', verifyToken, staffController.getUserDetails);
router.post('/details/modify', verifyToken, staffController.saveStaffDetails);
router.get('/details/user', verifyToken, staffController.getStaffDetails);
router.get('/position',  verifyToken, staffController.getUserPosition);
router.get('/salary-advance-applications', verifyToken, staffController.getSalaryAdvanceApplications);
router.get('/all-details', verifyToken, staffController.getAllStaffDetails);
router.put('/details/update', verifyToken, staffController.updateStaffDetails);
router.get('/salary', verifyToken, staffController.getSalary);
router.post('/apply-advance', verifyToken, staffController.applyExpense);
router.post('/expenses', verifyToken, staffController.getExpenses);
router.get('/all-expenses', verifyToken, staffController.getAllExpenses);
router.get('/checkSalaryAdvance', verifyToken, staffController.checkSalaryAdvance);


module.exports = router;
