var express = require('express');
var router = express.Router();
var cookieParser = require('cookie-parser')
const globals = require('../globals');
const { parseString } = require('xml2js');

/* GET home page. */
router.get('/', async function(req, res, next) {

  let user_cookie = undefined;
  if (!(Object.getPrototypeOf(req.cookies) === null)) {
    user_cookie = (cookieParser.JSONCookies(req.cookies))[globals.COOKIENAME];
  }

  if (typeof(user_cookie) == "undefined") {
    globals.log.info("No user cookie.. start the signin flow");

    /**
     * TBD1: set state cookie (if yahoo supports), and state value
     */
    let url = `${globals.AUTHZENDPOINT}`;
        url += `?client_id=${globals.CLIENTID}`;
        url += `&redirect_uri=${encodeURIComponent(globals.REDIRECTURI)}`;
        url += `&response_type=code`;

    res.redirect(url);
  }
  else {
    
    // DO NOT LOG THIS IN PROD. DO NOT REMOVE THIS CONDITIONAL
    if (process.env.APPENVIRONMENT == 'DEV')
      {
        globals.log.info(user_cookie);
      }
      
      let bearerToken = user_cookie.access_token;

      let response = await fetch(globals.GetTeamsUri, { headers: { Authorization: `Bearer ${bearerToken}` } })
        .then(response => response.text());

      var parsedResponse = undefined;
      parseString(response, (err, parsed) => {
        if (err) {
          console.error(`Error parsing XML: ${err}`);
        }

        parsedResponse = parsed;
      });

      leagueInfo = parsedResponse.fantasy_content.league[0];
      teamsInfo = leagueInfo['teams'][0];

      teamsData = [];
      teamsInfo['team'].forEach(element => {
        teamsData.push({ teamKey: element['team_key'][0], teamId: element['team_id'][0], team: `${element['name'][0]} (${element['managers'][0]['manager'][0]['nickname']})` })
      });
      globals.log.info(teamsData);

      
      res.render('index', { title: 'Express' });
  }
});

module.exports = router;
