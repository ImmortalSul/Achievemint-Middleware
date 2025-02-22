import { Issuer, generators } from "openid-client";
import readlineSync from "readline-sync";
import dotenv from "dotenv";

dotenv.config();

// const STEAM_OPENID_URL = "https://steamcommunity.com/openid/";

// Generate a login URL for Steam OpenID authentication
export async function getSteamLoginURL() {
  const steamIssuer = new Issuer({
    issuer: "https://steamcommunity.com/openid",
    authorization_endpoint: "https://steamcommunity.com/openid/login",
    token_endpoint: "", // Steam doesn't provide a token endpoint
    userinfo_endpoint: "", // Steam doesn't have a userinfo endpoint
    jwks_uri: "", // No JWKS URI
  });

  const client = new steamIssuer.Client({
    client_id: "steam", // Steam does not require a client ID
    redirect_uris: ["http://localhost:3000/auth/steam"], // Modify if needed
    response_types: ["id_token"],
  });

  const nonce = generators.nonce();
  const authUrl = client.authorizationUrl({
    scope: "openid",
    nonce,
  });

  console.log("� Open this link in your browser to log in:");
  console.log(authUrl);
}

// Parse SteamID from successful login (you'll need a small Express server for this part)
export async function getSteamIDFromLogin(url: string): Promise<string | null> {
  const match = url.match(/openid.identity=.*?\/id\/(\d+)/);
  return match ? match[1] : null;
}
