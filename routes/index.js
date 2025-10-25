var express = require('express');
var router = express.Router();
var cookieParser = require('cookie-parser')
const globals = require('../globals');
const { parseString } = require('xml2js');
const { Console } = require('winston/lib/winston/transports');

/**
 * Helper methods section
 */

/**
 * Fetch XML data from Yahoo APIs
 */
const getXmlData = async function(apiUrl) {
  bearerTokenHeader = { headers: { Authorization: `Bearer ${globals.getBearerToken()}` } };

  parsedResponse = undefined;
  await fetch(apiUrl, bearerTokenHeader)
    .then(response => response.text())
    .then(response => parseString(response, (err, parsed) => {
      if (err) {
        globals.log.error(`Error parsing XML: ${err}`);
      }

      parsedResponse = parsed;
    }));

    return parsedResponse;
}


/**
 * Fetch league identifiers for recent fantasy football seasons
 * Sample result:
 * [
 *  {
 *     gameKey: '123',
 *     gameId: '123',
 *     season: '2025', // --> used to find the relevant seasons. If dupes, perhaps use league name
 *     leagueKey: '123.l.123456',
 *     leagueId: '123456',
 *     leagueName: 'LeagueName',
 *     draftStatus: 'postdraft',
 *     startDate: '2025-09-04',
 *   },
 *   {
 *     ...
 *   }
 * ]
 */
const getLeagueKeys = async function() {
  xmlResponse = await getXmlData("https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games/leagues");

  league_seasons = [];
  xmlResponse.fantasy_content['users'][0].user[0].games[0].game.forEach(season => {
    if (parseInt(season.season) > 2021 && season.leagues[0].league[0].draft_status[0] === 'postdraft') {
      league_seasons.push({
        gameKey: season.game_key[0],
        gameId: season.game_id[0],
        season: parseInt(season.season[0]),
        leagueKey: season.leagues[0].league[0].league_key[0],
        leagueId: season.leagues[0].league[0].league_id[0],
        leagueName: season.leagues[0].league[0].name[0],
        draftStatus: season.leagues[0].league[0].draft_status[0],
        startDate: season.leagues[0].league[0].start_date[0],
      });
    }
  });

  return league_seasons;
}

/**
 * Fetch league teams
 * Returns a dictionary of teams like below:
 * {
 *   '1': {
 *     teamKey: '123.l.123456.t.1',
 *     teamName: 'Team Name (Manager Name)',
 *     managerGuid: '<manager guid>',
 *     players: [
 *       {
 *          playerKey: '123.p.31838',
 *          playerId: '31838',
 *          name: 'Daniel Jones',
 *          position: 'QB',
 *          imageUrl: 'https://.../31838.png',
 *          isKeeper: ''
 *        },
 *        {
 *          playerKey: '123.p.33477',
 *          playerId: '33477',
 *          name: 'Nico Collins',
 *          position: 'WR',
 *          imageUrl: 'https://.../33477.png',
 *          isKeeper: '1'
 *        },
 *        ...
 *     ]
 *   },
 *   ...
 * NOTE - managerGuid is immutable across seasons. Team key and Team ID are not.
 */
const getLeagueRosters = async function(leagueKey) {
  xmlResponse = await getXmlData(`https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/teams;out=roster`);

  league_rosters = {};

  xmlResponse.fantasy_content.league[0]['teams'][0]['team'].forEach(element => {
    league_rosters[element['team_id'][0]] = {
      teamKey: element['team_key'][0],
      teamName: `${element['name'][0]} (${element['managers'][0]['manager'][0]['nickname']})`,
      teamLogoUrl: element['team_logos'][0]['team_logo'][0]['url'][0],
      managerGuid: element['managers'][0]['manager'][0]['guid'][0],
    };

    players = [];
    element['roster'][0]['players'][0]['player'].forEach(p => {
      players.push({
        playerKey: p['player_key'][0],
        playerId: p['player_id'][0],
        name: p['name'][0]['full'][0],
        position: p['display_position'][0],
        imageUrl: p['image_url'][0],
        isKeeper: p['is_keeper'][0]['kept'][0],
      });
    });

    league_rosters[element['team_id'][0]]['players'] = players;
  });
  
  return league_rosters;
}

/**
 * Returns a dictionary keyed by player_id, of keepers from the previous season
 * NOTE: player_id is immutable across seasons while player_key is not
 * Example of returned data:
 *    {
 *      '27535': {
 *        managerGuid: '<someGuid1>',
 *        playerKey: '123.p.27535',
 *        playerName: 'Mike Evans'
 *      },
 *      '28654': {
 *        managerGuid: '<someGuid2>',
 *        playerKey: '123.p.28654',
 *        playerName: 'Raheem Mostert'
 *      },
 *      ...
 *      ...
 *    }
 */
const getPreviousKeepers = async function(leagueKey) {
  xmlResponse = await getXmlData(`https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/teams;out=roster`);

  keepers = {};
  xmlResponse.fantasy_content.league[0]['teams'][0]['team'].forEach(element => {

    element['roster'][0]['players'][0]['player'].forEach(p => {

      if (p['is_keeper'][0]['kept'][0] === '1') {
        keepers[p['player_id'][0]] = {
          managerGuid: element['managers'][0]['manager'][0]['guid'][0],
          playerKey: p['player_key'][0],
          playerName: p['name'][0]['full'][0],
        };

      }
    });
  });
  
  return keepers;
}

/**
 * Fetch draft results for the current season, as a dictionary of player_key to the round in which they were drafted
 * NOTE: this is for the current season so player_key matches that from team rosters - no player_id derivation needed.
 * For example:
 *   {
 *     '123.p.26686': '6',
 *     '123.p.26699': '14',
 *     '123.p.27535': '3',
 *     ...
 *     ...
 *   }
 */
const getDraftResults = async function(leagueKey) {
  xmlResponse = await getXmlData(`https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueKey}/draftresults`);
  
  draftResults = {};
  xmlResponse.fantasy_content.league[0]['draft_results'][0]['draft_result'].forEach(dr => {
    playerKey = dr['player_key'][0];
    draftRound = dr['round'][0];

    draftResults[playerKey] = draftRound;
  });

  return draftResults;
}

/**
 * Creates a set of players, who were added to rosters in the current season AFTER the cutoff date.
 * Cutoff date => players added after this are ineligible for keepers.
 * At the time of writing it is the 10th week of the season.
 * The environment variable COMMISHTOOLKEEPERCUTOFFWEEK controls this setting.
 * 
 * Returns a set of player_key values of players added after the cutoff date
 */
const getPlayersAddedAfterTheCutoff = async function(season) {
  xmlResponse = await getXmlData(`https://fantasysports.yahooapis.com/fantasy/v2/league/${season.leagueKey}/transactions`);
  cutoffTime = getCutoffTime(season.startDate, parseInt(globals.CUTOFFWEEK));
  globals.log.info(`Using cutoff time = ${cutoffTime}`);

  addedAfterCutuff = new Set();
  xmlResponse.fantasy_content.league[0].transactions[0].transaction.forEach(tx => {

    txTime = new Date(parseInt(tx.timestamp[0]) * 1000);

    if (txTime > cutoffTime && tx.status[0] === 'successful' && (tx.type[0] === 'add' || tx.type[0] === 'add/drop') ) {

      tx.players[0].player.forEach(pl => {
        if (pl.transaction_data[0].type[0] === 'add') {

          // this player has been added after the cutoff
          // add them to the transactions dictionary, for players ineligible for keepers
          addedAfterCutuff.add(pl.player_key[0]);
        }
      });
    }
  });

  return addedAfterCutuff;
}

const getCutoffTime = function(startDate, cutoffWeek) {
  startTimeUtc = new Date(startDate);
  startTimePacific = startTimeUtc.addHours(8);

  // Find the first Tuesday after the week starts (this is the end of week 1 games)
  week1Tuesday = startTimePacific;
  do {
    week1Tuesday.addDay();
  }
  while (week1Tuesday.getDay() != 2);

  // Advance to the Tuesday of the cutoff week
  return week1Tuesday.addWeeks(cutoffWeek - 1);
}

/**
 * Some date calculation helpers (seriously JavaScript?)
 * Note - Yahoo transaction timestamps are Unix epoch time (**seconds** since the epoch), for ex: 1761313703
 * Javascript Date values are **milliseconds** since the epoch
 */
Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h*60*60*1000));
  return this;
}

Date.prototype.addDay = function() {
  this.setTime(this.getTime() + (24*60*60*1000));
  return this;
}

Date.prototype.addWeeks = function(w) {
  this.setTime(this.getTime() + (w*7*24*60*60*1000));
  return this;
}

/**
 * END helper methods section
 */


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
    
    // DO NOT LOG THIS IN PROD.
    if (process.env.APPENVIRONMENT == 'DEV')
      {
        // DO NOT LOG THIS IN PROD. DO NOT REMOVE THE ABOVE CONDITIONAL.
        globals.log.info(user_cookie);
      }
      
      globals.setBearerToken(user_cookie.access_token);

      // Fetch league seasons and keys:
      league_seasons = await getLeagueKeys();

      latestSeason = 0;
      league_seasons.forEach(lk => { if (lk.season > latestSeason) { latestSeason = lk.season; }});
      const season0 = league_seasons.find(lk => lk.season == latestSeason);
      const season1 = league_seasons.find(lk => lk.season == (latestSeason - 1));
      globals.log.info(`Latest season year: ${latestSeason}`);
      globals.log.info(`Current season identifiers: ${season0}`);
      globals.log.info(`Previous season identifiers: ${season1}`);

      // Get latest rosters for the current season (includes keeper info)
      leagueRostersAwaiter = getLeagueRosters(season0.leagueKey);

      // Get keeper info for the previous season
      previousKeepersAwaiter = getPreviousKeepers(season1.leagueKey);

      // Get draft rounds for the current season
      draftResultsAwaiter = getDraftResults(season0.leagueKey);

      // Get players added after the cutoff week of the current season
      playersAddedAfterCutoffAwaiter = getPlayersAddedAfterTheCutoff(season0);

      // wait on all the above calls to complete
      league_rosters = await leagueRostersAwaiter;
      previous_keepers = await previousKeepersAwaiter;
      draft_results = await draftResultsAwaiter;
      players_added_after_cutoff = await playersAddedAfterCutoffAwaiter;

      // cycle through each player, on each team, setting their keeper eligibility

      // Fetch team names
      let response = await fetch(globals.GetTeamsUri, { headers: { Authorization: `Bearer ${globals.getBearerToken()}` } })
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
      response = await fetch(rostersUri, { headers: { Authorization: `Bearer ${globals.getBearerToken()}` } })
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
