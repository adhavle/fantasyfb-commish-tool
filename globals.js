import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

export const APPENVIRONMENT = process.env.APPENVIRONMENT;
export const COOKIENAME = "SDBCOMMISHTOOLSESSION";
export const METADATAENDPOINT = "https://api.login.yahoo.com/.well-known/openid-configuration";
export const AUTHZENDPOINT = "https://api.login.yahoo.com/oauth2/request_auth";
export const TOKENENDPOINT = "https://api.login.yahoo.com/oauth2/get_token";

const isProd = APPENVIRONMENT == 'PROD';

export const CLIENTID = isProd? getSecretFromKeyVault('COMMISH-TOOL-CLIENTID') : process.env.COMMISHTOOLCLIENTID;
export const SECRET = isProd? getSecretFromKeyVault('COMMISH-TOOL-SECRET') : process.env.COMMISHTOOLSECRET;
export const REDIRECTURI = isProd ? getSecretFromKeyVault('COMMISH-TOOL-REDIRECTURI') : process.env.COMMISHTOOLREDIRECTURI;
export const COOKIEKEY = isProd? getSecretFromKeyVault('COMMISH-TOOL-COOKIE-KEY') : process.env.COMMISHTOOLCOOKIEKEY;

// Yahoo Fantasy Football API URIs
export const GetTeamsUri = "https://fantasysports.yahooapis.com/fantasy/v2/league/461.l.139106/teams";

function getSecretFromKeyVault(secretName) {
    const credential = new DefaultAzureCredential();
    const client = new SecretClient(process.env.KEYVAULTURL, credential);

    client.getSecret(secretName)
        .then(secret => {
            return secret.value;
        })
        .catch(err => {
            console.error("Error retrieving secret:", err);
        });
}
