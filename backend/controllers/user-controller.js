// const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');

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

    const newUser = new User({
        name,
        email,
        image: req.file.path,
        password,
        places: []
    });

    try {
        await newUser.save();
    } catch (err) {
        return next(new HttpError(
            'Signing up failed, please try again later', 500
        ));
    }

    res.status(201).json({ user: newUser.toObject({ getters: true }) });
};

const logIn = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (error) {
        return next(new HttpError('Signing up failed, please check your data', 500));
    }

    if (!existingUser || existingUser.password !== password) {
        return next(new HttpError('Invalid credentials, could not log you in.', 422));
    }

    res.json({
        message: 'Logged in!',
        user: existingUser.toObject({ getters: true })
    });
};

exports.getUsers = getUsers;
exports.signUp = signUp;
exports.logIn = logIn;