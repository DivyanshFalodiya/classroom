require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../models/User');
const { Role } = require('../models/Role');
const saltRounds = 10;

// Time in seconds
const accessExpiry = 60 * 15; //  15 minutes
const refreshExpiry = 60 * 60 * 24 * 30; //  30 days

// Middlewares for authorization and authentication checks
exports.isUser = (req, res, next) => {};
exports.isTeacher = (req, res, next) => {};
exports.isStudent = (req, res, next) => {};

// Helper functions
const userExists = async (email) => {
    const isUser = await User.findOne({ email });
    return isUser;
};
const encryptPassword = async (password) => {
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
};
const comparePassword = async (password, hash) => {
    const result = await bcrypt.compare(password, hash);
    return result;
};
const createJWT = (user) => {
    return jwt.sign(
        { email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: accessExpiry }
    );
};
const createRefreshToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: refreshExpiry,
    });
};
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (e) {
        return null;
    }
};

// Controllers for authentication
exports.signup = async (req, res) => {
    try {
        const isUser = await userExists(req.body.email);
        console.log(isUser);
        if (isUser) throw 'User already exists.';
        const role = await Role.findOne({ name: req.body.role });
        const newUser = new User({
            username: req.body.username,
            password: await encryptPassword(req.body.password),
            email: req.body.email,
            role: role._id,
        });
        await newUser.save();
        const token = createJWT(newUser);
        const refreshToken = createRefreshToken(newUser);
        res.cookie('access', token, {
            httpOnly: true,
            maxAge: accessExpiry * 1000,
            // secure: true,
        });
        res.cookie('refresh', refreshToken, {
            httpOnly: true,
            maxAge: refreshExpiry * 1000,
            // secure: true,
        });
        res.json({ success: 'User successfully created.' });
    } catch (e) {
        res.json({ error: e || 'Something went wrong!' });
    }
};

exports.signin = async (req, res) => {
    try {
        const isUser = await userExists(req.body.email);
        if (!isUser) throw 'User does not exist.';
        const checkPassword = await comparePassword(
            req.body.password,
            isUser.password
        );
        if (!checkPassword) throw 'Invalid credentials.';
        const token = createJWT(isUser);
        const refreshToken = createRefreshToken(isUser);
        res.cookie('access', token, {
            httpOnly: true,
            maxAge: accessExpiry * 1000,
            // secure: true,
        });
        res.cookie('refresh', refreshToken, {
            httpOnly: true,
            maxAge: refreshExpiry * 1000,
            // secure: true,
        });
        res.json({ success: 'User successfully logged in.' });
    } catch (e) {
        res.json({ error: e || 'Something went wrong!' });
    }
};

exports.logout = (req, res) => {
    res.cookie('access', '', {
        httpOnly: true,
        // maxAge: accessExpiry * 1000,
        // secure: true,
    });
    res.cookie('refresh', '', {
        httpOnly: true,
        // maxAge: refreshExpiry * 1000,
        // secure: true,
    });
    res.json({ success: 'Logged out successfully.' });
};