// controllers/authController.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');



// Set up nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Register user
exports.register = async (req, res) => {
    const { email, password } = req.body;
    console.log(email);
    console.log(password);
    
    const saltRounds = 10; // This should be a number

    try {
        const hash = await bcrypt.hash(password, saltRounds);
        const newUser = await User.create({ email, password: hash });
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


// Login user and send OTP
exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send('Invalid credentials. Password is valid');

    // Generate OTP
    user.otp = crypto.randomBytes(3).toString('hex'); // Generates a 6-digit OTP
    user.otpExpiry = Date.now() + 300000; // OTP valid for 5 minutes
    await user.save();

    // Send OTP via email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${user.otp}`,
    };



    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            return res.status(500).json({ message: 'Error sending OTP' });
        }
        res.status(200).json({ message: 'OTP sent to your email' });
    });
};



// // Simulated user verification function
// const verifyUser = (otp, userId) => {
//     // Simulate OTP verification logic
//     // Replace with your actual OTP verification logic
//     return otp === '123456' && userId === 'user@example.com'; // Example verification
// };

// // Endpoint to verify OTP
// app.post('/verify-otp', async (req, res) => {
//     const { otp, userId } = req.body;

//     // Verify user
//     if (verifyUser(otp, userId)) {
//         const message = `User ${userId} successfully verified their OTP.`;

        

//         return res.status(200).json({ message: 'OTP verified successfully!' });
//     } else {
//         return res.status(400).json({ message: 'Invalid OTP or user ID.' });
//     }
// });


// Verify OTP
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP after verification
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'OTP verified successfully', token });
};


exports.updateUser = async (req, res, next) => {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const [updated] = await User.update({ name, email, hashedPassword }, { where: { id } });
        if (!updated) {
            return res.status(404).send('User not found');
        }
        const updatedUser = await User.findByPk(id);
        res.json(updatedUser);
    } catch (err) {
        next(err);
    }
};

exports.deleteUser = async (req, res, next) => {
    const { id } = req.params;
    try {
        const deleted = await User.destroy({ where: { id } });
        if (!deleted) {
            return res.status(404).send('User not found');
        }
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (err) {
        next(err);
    }
};
