var express = require('express');
var router = express.Router();
const globals = require('../globals');

/* GET authz callback with code */
router.get('/', async function(req, res, next) {
  console.log("received authz callback");

  /**
   * TBD1: fetch state cookie and compare with state from QSP
   */
  var authz_code = req.query['code'];

  var body = `grant_type=authorization_code`;
  body += `&code=${authz_code}`;
  body += `&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`;
  body += `&client_id=${globals.COMMISH_TOOL_CLIENTID}`;
  body += `&redirect_uri=https%3A%2F%2Flocalhost%3A3443%2Fauthz_callback/`;

  let token_response = await fetch(globals.TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body
  });

  if (token_response.ok) {
    token_response_json = await token_response.json();

    if (globals.APP_ENVIRONMENT == 'DEV') {
      console.log(token_response_json);
      console.log(token_response_json.access_token);
      console.log(token_response_json.refresh_token);
    }
  }

  res.cookie(globals.USER_COOKIE, token_response_json, { maxAge: 3600000 });
  
  // res.send('respond with a resource');
  res.redirect('/');
});

module.exports = router;
