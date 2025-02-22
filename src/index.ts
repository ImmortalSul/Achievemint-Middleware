import express, { Request, Response } from "express";
import dotenv from "dotenv";
import url from "url";
import axios from "axios";
import qs from "qs";
import { fetchAchievements } from "./fetchAchievements"; // Import the function

dotenv.config();
const app = express();
const PORT = 3000;

const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
const RETURN_URL = `http://localhost:${PORT}/auth/steam`;

// Generate the OpenID Login URL
app.get("/login", (req: Request, res: Response) => {
  const params = new url.URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": RETURN_URL,
    "openid.realm": `http://localhost:${PORT}/`,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });

  res.redirect(`${STEAM_OPENID_URL}?${params.toString()}`);
});

// Handle Steam's OpenID Response
app.get("/auth/steam", async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query as Record<string, string>;

    if (!query["openid.claimed_id"]) {
      res.status(400).send("❌ Authentication failed. No claimed_id received.");
      return;
    }

    const steamID = query["openid.claimed_id"].split("/").pop();
    if (!steamID) {
      res.status(400).send("❌ Failed to extract SteamID.");
      return;
    }

    // Verify OpenID response
    const params = qs.stringify({
      "openid.assoc_handle": query["openid.assoc_handle"],
      "openid.signed": query["openid.signed"],
      "openid.sig": query["openid.sig"],
      "openid.ns": query["openid.ns"],
      "openid.mode": "check_authentication",
      ...Object.fromEntries(
        query["openid.signed"]
          .split(",")
          .map((key) => [`openid.${key}`, query[`openid.${key}`]])
      ),
    });

    const response = await axios.post(STEAM_OPENID_URL, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (response.data.includes("is_valid:true")) {
      console.log(`✅ Login successful! SteamID: ${steamID}`);

      res.send(`
        ✅ Login successful! SteamID: ${steamID}<br>
        <form action="/fetch-achievements" method="GET">
          <input type="hidden" name="steamID" value="${steamID}" />
          <label>Enter Game ID: <input type="text" name="gameID" required /></label>
          <button type="submit">Fetch Achievements</button>
        </form>
      `);
    } else {
      res.status(401).send("❌ Steam OpenID verification failed.");
    }
  } catch (error) {
    console.error("Steam OpenID verification error:", error);
    res.status(500).send("❌ Error verifying OpenID response.");
  }
});

// New Route to Fetch Achievements
app.get(
  "/fetch-achievements",
  async (req: Request, res: Response): Promise<void> => {
    const { steamID, gameID } = req.query;

    if (!steamID || !gameID) {
      res.status(400).send("❌ Steam ID and Game ID are required.");
      return;
    }

    try {
      await fetchAchievements(steamID as string, gameID as string);
      res.send(
        `✅ Achievements fetched for GameID: ${gameID}. Check console/logs.`
      );
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).send("❌ Error fetching achievements.");
    }
  }
);

// Start Express Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(
    `🔗 Open http://localhost:${PORT}/login to authenticate with Steam`
  );
});
