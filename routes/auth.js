// routes/auth.js
const express = require('express');
const { register, login, verifyOtp, updateUser, deleteUser, getAllUsers } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);
router.get('/', auth, getAllUsers); // Protected route

module.exports = router;
