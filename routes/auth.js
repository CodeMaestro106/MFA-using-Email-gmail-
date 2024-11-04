// routes/auth.js
const express = require('express');
const { register, login, verifyOtp } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);

module.exports = router;
