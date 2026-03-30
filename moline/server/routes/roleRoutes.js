const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

router.get('/', roleController.roles);
router.post('/user-roles', roleController.userRoles);
router.post('/:userId/assignRole', roleController.assignRole);

module.exports = router;