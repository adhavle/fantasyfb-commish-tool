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
    
    if (process.env.APPENVIRONMENT == 'DEV')
      {
        // DO NOT LOG THIS IN PROD.
        // DO NOT REMOVE THE ABOVE CONDITIONAL.
        globals.log.info(user_cookie);
      }
      
      let bearerToken = user_cookie.access_token;

      // Fetch team names
      let response = await fetch(globals.GetTeamsUri, { headers: { Authorization: `Bearer ${bearerToken}` } })
        .then(response => response.text());

      var parsedResponse = undefined;
      parseString(response, (err, parsed) => {
        if (err) {
          console.error(`Error parsing XML: ${err}`);
        }

        parsedResponse = parsed;
      });

      teamsInfo = parsedResponse.fantasy_content.league[0]['teams'][0];
      teamsData = [];
      teamKeys = [];
      teamsInfo['team'].forEach(element => {
        teamsData.push({
          teamKey: element['team_key'][0],
          teamId: element['team_id'][0],
          teamName: `${element['name'][0]} (${element['managers'][0]['manager'][0]['nickname']})` });

        teamKeys.push(element['team_key'][0]);
      });

      // Fetch rosters
      let rostersUri = globals.GetRostersUri.replace("TEAMKEYS", teamKeys.join(","));
      response = await fetch(rostersUri, { headers: { Authorization: `Bearer ${bearerToken}` } })
        .then(response => response.text());

      parsedResponse = undefined;
      parseString(response, (err, parsed) => {
        if (err) {
          console.error(`Error parsing XML: ${err}`);
        }

        parsedResponse = parsed;
      });

      globals.log.info(rostersUri);
      
      teamsInfo = parsedResponse.fantasy_content['teams'][0];
      players = {};
      teamsInfo['team'].forEach(element => {

        players[element['team_id'][0]] = [];

        roster = element['roster'][0]['players'][0];
        roster['player'].forEach(player => {
          players[element['team_id'][0]].push({
            fullname: player['name'][0]['full'][0],
            position: player['display_position'][0]
          });
        });
      });


      // send back UX with backing data.
      res.render('index', { teams: JSON.stringify(teamsData), players: JSON.stringify(players) });
  }
});

module.exports = router;
