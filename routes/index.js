var express = require('express');
var router = express.Router();
var cookieParser = require('cookie-parser')
const globals = require('../globals');

/* GET home page. */
router.get('/', function(req, res, next) {

  let user_cookie = undefined;
  if (!(Object.getPrototypeOf(req.cookies) === null)) {
    user_cookie = (cookieParser.JSONCookies(req.cookies))[globals.USER_COOKIE];
  }

  if (typeof(user_cookie) == "undefined") {
    console.log("No user cookie.. start the signin flow");

    /**
     * TBD1: set state cookie (if yahoo supports), and state value
     * TBD2: remove PKCE stuff and move to confidential client app
     */
    let url = `${globals.AUTHZ_ENDPOINT}`;
        url += `?client_id=${globals.COMMISH_TOOL_CLIENTID}`;
        url += `&redirect_uri=${encodeURIComponent(globals.REDIRECT_URI)}`;
        url += `&response_type=code`;
        url += `&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`;
        url += `&code_challenge_method=S256`;

    res.redirect(url);
  }

  // DO NOT LOG THIS IN PROD. DO NOT REMOVE THIS CONDITIONAL
  if (process.env.APP_ENVIRONMENT == 'DEV')
  {
    console.log(user_cookie);
  }

  res.render('index', { title: 'Express' });
});

module.exports = router;
