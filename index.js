import axios from "axios";
import readline from "readline";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = process.env.STEAM_ID;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter the Steam App ID: ", async (appId) => {
  const PLAYER_ACHIEVEMENTS_URL = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${API_KEY}&steamid=${STEAM_ID}&appid=${appId}`;
  const GLOBAL_ACHIEVEMENTS_URL = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appId}`;

  try {
    console.log("\n⏳ Fetching achievements...");

    // Fetch player's unlocked achievements
    const playerResponse = await axios.get(PLAYER_ACHIEVEMENTS_URL);
    const playerData = playerResponse.data.playerstats;
    const unlockedAchievements = playerData.achievements.filter(
      (ach) => ach.achieved === 1
    );

    if (unlockedAchievements.length === 0) {
      console.log("❌ No achievements unlocked.");
      rl.close();
      return;
    }

    console.log(`\n� Game: ${playerData.gameName}`);
    console.log("✅ Unlocked Achievements (Sorted by Rarity):");

    // Fetch global achievement percentages
    const globalResponse = await axios.get(GLOBAL_ACHIEVEMENTS_URL);
    const globalData = globalResponse.data.achievementpercentages.achievements;

    // Create a map of global achievements for quick lookup
    const globalRarityMap = new Map();
    globalData.forEach((ach) =>
      globalRarityMap.set(ach.name.toLowerCase(), ach.percent)
    );

    // Function to determine rarity category
    const getRarityCategory = (percent) => {
      if (percent < 10) return "Legendary";
      if (percent < 30) return "Rare";
      return "Uncommon";
    };

    // Directory for metadata output
    const outputDir = path.join(process.cwd(), "metadata");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Generate metadata for each achievement
    unlockedAchievements.forEach((achievement) => {
      const apinameLower = achievement.apiname.toLowerCase();
      let rarityPercent = parseFloat(globalRarityMap.get(apinameLower)) || 100;

      const metadata = {
        name: achievement.apiname,
        description: `Achievement unlocked in ${playerData.gameName}`,
        image: `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${appId}/${achievement.apiname}.jpg`, // You might need to fetch the actual image URL
        attributes: [
          { trait_type: "Game", value: playerData.gameName },
          {
            trait_type: "Unlock Date",
            value: new Date(achievement.unlocktime * 1000).toISOString(),
          },
          {
            trait_type: "Rarity Percentage",
            value: `${rarityPercent.toFixed(2)}%`,
          },
          {
            trait_type: "Rarity Category",
            value: getRarityCategory(rarityPercent),
          },
        ],
      };

      // Save metadata as JSON
      const metadataFilePath = path.join(
        outputDir,
        `${achievement.apiname}.json`
      );
      fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));

      console.log(`� Metadata saved: ${metadataFilePath}`);
    });

    console.log("\n✅ All achievement metadata files generated successfully!");
  } catch (error) {
    console.error(
      "❌ Error fetching achievements:",
      error.response ? error.response.data : error.message
    );
  }

  rl.close();
});
