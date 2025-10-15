var express = require('express');
var router = express.Router();
const { authCookieName } = require('../globals.js')

/* GET home page. */
router.get('/', function(req, res, next) {

  // Are there any cookies? Note - for signed cookies check req.signedCookies instead.
  var noUnsignedCookiesFound = Object.getPrototypeOf(req.cookies) === null;

  if (noUnsignedCookiesFound) {
    console.log("No unsigned cookies found.. setting one");
    res.cookie(authCookieName, 'special_cookie_value', { maxAge: 3600000 });
  }
  else {
    console.log(`Unsigned cookies found: ${req.cookies}`);
    console.log(`${authCookieName} value: ${req.cookies[authCookieName]}`);
  }

  res.render('index', { title: 'Express' });
});

module.exports = router;
