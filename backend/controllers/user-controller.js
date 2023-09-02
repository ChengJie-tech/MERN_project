// const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/user');

const getUsers = async (req, res, next) => {
    let users;
    try {
        users = await User.find({}, '-password');
    } catch (error) {
        return next(new HttpError(
            'Fetching users failed, please try again later.', 500
        ));
    }
    res.json({ users: users.map(u => u.toObject({ getters: true })) });
};

const signUp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }

    const { name, email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Signing up failed, please check your data', 500));
    }

    if (existingUser) {
        return next(new HttpError('User exists already, please login instead.', 422));
    }

    let hashedPassword; // authentication - encrypt password, don't store plain text
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (error) {
        return next(new HttpError('Could not create user, please try again.', 500));
    }

    const newUser = new User({
        name,
        email,
        image: req.file.path,
        password: hashedPassword,
        places: []
    });

    try {
        await newUser.save();
    } catch (err) {
        return next(new HttpError(
            'Signing up failed, please try again later', 500
        ));
    }

    let token;
    try {
        token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            'supersecret_key',
            { expiresIn: '1h' }
        );
    } catch (error) {
        return next(new HttpError(
            'Signing up failed, please try again later', 500
        ));
    }

    res.status(201).json({ userId: newUser.id, email: newUser.email, token: token });
};

const logIn = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Logging in failed, please check your data', 500));
    }

    if (!existingUser) {
        return next(new HttpError('Invalid credentials, could not log you in.', 422));
    }

    let isValidPassword;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (error) {
        return next(new HttpError('Could not log you in, please check your credentials and try again', 500));
    }

    if (!isValidPassword) {
        return next(new HttpError('Could not log you in, please check your credentials and try again', 500));
    }

    let token;
    try {
        token = jwt.sign(
            { userId: existingUser.id, email: existingUser.email },
            'supersecret_key',
            { expiresIn: '1h' }
        );
    } catch (error) {
        return next(new HttpError(
            'Signing up failed, please try again later', 500
        ));
    }

    res.json({ userId: existingUser.id, email: existingUser.email, token: token });
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.logIn = logIn;