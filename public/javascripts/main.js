// TBDs:
// Use yahoo's oauth discovery doc to fetch endpoints
// Make PKCE actually work by generating verifier dynamically and saving to browser storage

const urlParams = new URLSearchParams(window.location.search);
const authzCode = urlParams.get('code');

const authorizeUrl = 'https://api.login.yahoo.com/oauth2/request_auth';
const tokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';
const clientId = 'dj0yJmk9bGNGTWNBTFFWUWRuJmQ9WVdrOU5XZzJOWG81WkVvbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PTUw';
const redirectUri = 'https%3A%2F%2Fffl-commish-tools.azurewebsites.net/';

// API to enumerate the gameIds:
// https://fantasysports.yahooapis.com/fantasy/v2/games;game_codes=nfl;seasons=2024,2025
// And to fetch the leagueIds, for want of a better API, call the following (2024 league):
// https://fantasysports.yahooapis.com/fantasy/v2/leagues;league_keys=449.l.118295
// The response will contain:
//            <renew>423_168366</renew>
//            <renewed>461_139106</renewed>
// That's the previous year's gameId/leagueId, and the next years.
// So keep following until we get to the current year, to build the gameId/leagueId dictionary
// NOTE - follow until 'renewed' is empty - that's the current or last year the league was renewed
const leaguekeys = {
    2024: { 'gameId': '449', 'leagueId': '118295' },
    2025: { 'gameId': '461', 'leagueId': '139106' },
};

function getAuthzCodeRequest() {
    return `${authorizeUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256`
}

function getTokenRequest(code) {
    return `${tokenUrl}?client_id=${clientId}&code=${code}&grant_type=authorization_code&code_verifier=${codeVerifier}&redirect_uri=${redirectUri}`
}

$(document).ready(function() {
    console.log("JQuery is loaded")

    if (authzCode === undefined || authzCode == null) {
        const authzRequest = getAuthzCodeRequest();
        console.log(`fetching authz code from ${authzRequest}`);
        window.open(authzRequest, '_parent');
    }
    else {
        const tokenRequest = getTokenRequest(authzCode);
        console.log(`fetching token using ${tokenRequest}`);

        // $.ajax({})

        // fetch(tokenRequest, {
        //     method: 'POST',
        //     headers: {
        //         'Access-Control-Allow-Origin': 'https://ffl-commish-tools.azurewebsites.net',
        //         'Access-Control-Allow-Origin': 'https://localhost:3000',
        //         'Content-Type': 'application/x-www-form-urlencoded',
        //     },
        // })
            // .then(response => response.json())
            // .then(data => console.log(data));

        // tokenResponse = $.post(tokenRequest, null, function(data) {
        //     console.log(data);
        // })

        var requestProps = {
                'client_id': clientId,
                'code': authzCode,
                'grant_type': 'authorization_code',
                'code_verifier': codeVerifier,
                'redirect_uri': redirectUri,
            };

        var formBody = [];
        for (var property in requestProps) {
            formBody.push(property + "=" + requestProps[property]);
        }
        formBody = formBody.join("&");

        fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: formBody
        });

// Expired bearer token on Yahoo API's will fail with HTTP status 401 (as expected), and
// www-authenticate header will contain 'OAuth oauth_problem="token_expired", realm="yahooapis.com"'

        $.get()
    }

    console.log("coming here");
})