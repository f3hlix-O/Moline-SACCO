const express = require('express');
const router = express.Router();
const matatuController = require('../controllers/matatuController');
const verifyToken = require('../middleware/verifyToken');
const { uploadSingle } = require('../middleware/multerConfig'); 

router.get('/', matatuController.getMatatus);
router.get('/drivers', matatuController.drivers);
router.get('/profile',verifyToken, matatuController.getUserById);
router.get('/userMatatus', verifyToken, matatuController.getMatatusForUser);
router.get('/userMatatus/:userId', matatuController.getMatatusForUser);
router.get('/allPendingLoans', matatuController.pendingLoans);
router.post('/addRoute', matatuController.newRoute);
router.get('/routes', matatuController.getRoutes);
router.get('/export', matatuController.documents);
router.put('/profile/update', verifyToken, matatuController.updateUserProfile);
router.post('/register', verifyToken, uploadSingle('log_book'), matatuController.registerVehicle);
router.delete('/deleteRoute/:routeId', matatuController.deleteRoute);
router.get('/:id', matatuController.getMatauById);
router.post('/:id/update', matatuController.updateMatatu);
router.delete('/:id', matatuController.deleteMatatu);
router.post('/:id/approve', matatuController.approveMatatu);
router.post('/:id/resetStatus', matatuController.resetMatatu);
router.post('/:id/assignDriver', matatuController.assignDriver);
 

module.exports = router; 