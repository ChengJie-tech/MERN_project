const express = require('express');
const { check } = require('express-validator');

const placesController = require('../controllers/places-controller');
const checkAuth = require('../middleware/check-auth');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/:placeId', placesController.getPlaceById);

router.get('/user/:uid', placesController.getPlacesByUserId);

router.use(checkAuth); // all the routers after the line should be authorized

router.post('/',
    fileUpload.single('image'),
    [
        check('title').not().isEmpty(),
        check('description').isLength({ min: 5 }),
        check('address').not().isEmpty()
    ], placesController.createPlace);

router.patch('/:placeId',
    [
        check('title').not().isEmpty(),
        check('description').isLength({ min: 5 })
    ], placesController.updatePlace);

router.delete('/:placeId', placesController.deletePlace);

module.exports = router;