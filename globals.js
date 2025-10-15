export const USER_COOKIE = "SDBCOMMISTOOLSESSION";
export const AUTHZ_ENDPOINT = "https://api.login.yahoo.com/oauth2/request_auth";
export const TOKEN_ENDPOINT = "https://api.login.yahoo.com/oauth2/get_token";
export const REDIRECT_URI = process.env.REDIRECT_URI || `https://localhost:${process.env.HTTPS_PORT}/authz_callback`;
export const COMMISH_TOOL_CLIENTID = process.env.COMMISH_TOOL_CLIENTID;
export const COMMISH_TOOL_SECRET = process.env.COMMISH_TOOL_SECRET;
