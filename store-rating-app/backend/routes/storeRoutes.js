const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('NORMAL_USER'));

router.get('/', userController.listStoresForUser);
router.post('/:storeId/ratings', userController.submitRating);

module.exports = router;
