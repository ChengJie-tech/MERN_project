const express = require('express');
const { check } = require('express-validator');

const usersController = require('../controllers/user-controller');

const router = express.Router();

router.get('/', usersController.getUsers);

router.post('/signup', [
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({ min: 6 })
], usersController.signUp);

router.post('/login', usersController.logIn);

module.exports = router;