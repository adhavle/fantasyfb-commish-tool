var express = require('express');
var router = express.Router();
var cookieParser = require('cookie-parser')
const globals = require('../globals');

/* GET home page. */
router.get('/', function(req, res, next) {

  // Are there any cookies? Note - for signed cookies check req.signedCookies instead.
  var noUnsignedCookiesFound = Object.getPrototypeOf(req.cookies) === null;

  if (noUnsignedCookiesFound) {
    console.log("No user cookie.. start the signin flow");
    // res.cookie(globals.USER_COOKIE, 'special_cookie_value', { maxAge: 3600000 });

    /**
     * TBD1: set state cookie (if yahoo supports), and state value
     * TBD2: stop using PKCE and move to confidential client (client id, secret)
     */
    let url = `${globals.AUTHZ_ENDPOINT}`;
    url += `?client_id=${globals.COMMISH_TOOL_CLIENTID}`;
    // url += `&redirect_uri=${encodeURI(globals.REDIRECT_URI)}`;
    url += `&redirect_uri=https%3A%2F%2Flocalhost%3A3443%2Fauthz_callback/`
    url += `&response_type=code`;
    url += `&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`;
    url += `&code_challenge_method=S256`;

    res.redirect(url);
  }

  console.log(`Unsigned cookies found: ${req.cookies}`);
  let user_cookie = (cookieParser.JSONCookies(req.cookies))[globals.USER_COOKIE];
  console.log(user_cookie); // MUST REMOVE

  res.render('index', { title: 'Express' });
});

module.exports = router;
