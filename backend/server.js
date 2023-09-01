const fs = require('fs');
const path = require('path');

const express = require('express');
const mongoose = require('mongoose');

const placeRoutes = require('./routes/places-routes');
const usersRoutes = require('./routes/user-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(express.json());

app.use('/uploads/images', express.static(path.join('uploads', 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use('/api/places', placeRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res, next) => {
    throw new HttpError('Could not find this route.', 404);
});

app.use((err, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, err=>{
            console.log(err);
        });
    }
    if (res.headerSent) {
        return next(err);
    }
    res.status(err.code || 500);
    res.json({ message: err.message || 'An unknown error occurred!' });
});

mongoose
    .connect('mongodb+srv://MERN:Bya1cGBmt6JlB6GY@cluster0.qdwdd2n.mongodb.net/mern?retryWrites=true&w=majority')
    .then(() => {
        app.listen(5000);
    })
    .catch(err => {
        console.log(err);
    });