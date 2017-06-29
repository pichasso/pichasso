const express = require('express');
const router = new express.Router();
const error = require('http-errors');
const onlyDevelopment = require('../middleware/onlyDevelopment');

/* GET home page. */
router.get('/', onlyDevelopment, function (req, res, next) {
    res.render('index', {title: 'Pichasso'});
 });

module.exports = router;
