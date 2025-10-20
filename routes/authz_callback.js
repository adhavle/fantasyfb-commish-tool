var express = require('express');
var router = express.Router();
const globals = require('../globals');

/* GET authz callback with code */
router.get('/', async function(req, res, next) {
  globals.log.info("received authz callback");

  var authz_code = req.query['code'];

  var body = `grant_type=authorization_code`;
  body += `&code=${authz_code}`;
  body += `&client_id=${globals.CLIENTID}`;
  body += `&client_secret=${globals.SECRET}`;
  body += `&redirect_uri=https%3A%2F%2Flocalhost%3A3443%2Fauthz_callback/`;

  let token_response = await fetch(globals.TOKENENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body
  });

  if (token_response.ok) {
    token_response_json = await token_response.json();

    if (globals.APPENVIRONMENT == 'DEV') {
      globals.log.info(token_response_json);
      globals.log.info(token_response_json.access_token);
      globals.log.info(token_response_json.refresh_token);
    }
  }

  res.cookie(globals.COOKIENAME, token_response_json, { maxAge: 3600000 });
  
  // res.send('respond with a resource');
  res.redirect('/');
});

module.exports = router;
