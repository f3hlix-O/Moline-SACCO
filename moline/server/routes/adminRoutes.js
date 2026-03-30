const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/users-approved', adminController.getApprovedUsers);
router.get('/users-pending-approval', adminController.getPendingUsers);
router.post('/approve-user', adminController.approveUser);
router.post('/disapprove-user', adminController.disapproveUser);

module.exports = router;
 