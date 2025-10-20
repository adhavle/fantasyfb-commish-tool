import { createLogger, format, transports } from "winston";

export const log = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: process.env.APPLOGFILE })
    ]
});

export const APPENVIRONMENT = process.env.APPENVIRONMENT;
export const CLIENTID = process.env.COMMISHTOOLCLIENTID;
export const SECRET = process.env.COMMISHTOOLSECRET;
export const REDIRECTURI = process.env.COMMISHTOOLREDIRECTURI;
export const COOKIEKEY = process.env.COMMISHTOOLCOOKIEKEY;

export const COOKIENAME = "SDBCOMMISHTOOLSESSION";
export const METADATAENDPOINT = "https://api.login.yahoo.com/.well-known/openid-configuration";
export const AUTHZENDPOINT = "https://api.login.yahoo.com/oauth2/request_auth";
export const TOKENENDPOINT = "https://api.login.yahoo.com/oauth2/get_token";

// Yahoo Fantasy Football API URIs
export const GetTeamsUri = "https://fantasysports.yahooapis.com/fantasy/v2/league/461.l.139106/teams";
export const GetRostersUri = "https://fantasysports.yahooapis.com/fantasy/v2/teams;team_keys=TEAMKEYS/roster"
