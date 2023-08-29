// const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../utils/location');
const Place = require('../models/place');
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
    const placeId = req.params.placeId;

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (error) {
        return next(new HttpError(
            'Something went wrong, could not find a place', 500
        ));
    }

    if (!place) {
        return next(new HttpError('Could not find a place for the provided id.', 404));
    }

    res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
    const uid = req.params.uid;

    let places;
    try {
        places = await Place.find({ creator: uid });
    } catch (error) {
        return next(new HttpError(
            'Fetching places failed, please try again later.', 500
        ));
    }

    if (!places || places.length === 0) {
        return next(new HttpError('Could not find places for the provided id.', 404));
    }

    res.json({ places: places.map(p => p.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }

    const { title, description, address, creator } = req.body;

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }

    const createdPlace = new Place({
        title,
        description,
        location: coordinates,
        image: 'https://patchwiki.biligame.com/images/ys/7/70/iv7dviodlgfi8upe9spcic3227ru3yi.png',
        address,
        creator
    });

    let user;
    try {
        user = await User.findById(creator);
    } catch (error) {
        return next(new HttpError(
            'Creating place failed, please try again.', 500
        ));
    }

    if (!user) {
        return next(new HttpError(
            'Could not find user for provided id.', 500
        ));
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({ session: sess });
        user.places.push(createdPlace);
        await user.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError('Creating place failed, please try again', 500));
    };

    res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }

    const { title, description } = req.body;
    const placeId = req.params.placeId;

    let place;
    try {
        place = await Place.findById(placeId);
    } catch (error) {
        return next(new HttpError(
            'Something went wrong, could not update place', 500
        ));
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch (err) {
        return next(new HttpError(
            'Something went wrong, could not update place', 500
        ));
    }

    res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
    const placeId = req.params.placeId;

    let place;
    try {
        place = await Place.findById(placeId).populate('creator');
    } catch (error) {
        return next(new HttpError(
            'Something went wrong, could not delete place', 500
        ));
    }

    if (!place) {
        return next(new HttpError(
            'Could not find place for this id.', 404
        ));
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        place.deleteOne({ session: sess });
        place.creator.places.pull(place);
        await place.creator.save({ session: sess });
        await sess.commitTransaction();
    } catch (error) {
        return next(new HttpError(
            'Something went wrong, could not delete place', 500
        ));
    }

    res.json({ message: 'Deleting...' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;