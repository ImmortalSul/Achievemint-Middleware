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
    console.log("✅ Unlocked Achievements (Generating Metadata)...");

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

    // Generate metadata for each unlocked achievement
    unlockedAchievements.forEach((achievement) => {
      const apinameLower = achievement.apiname.toLowerCase(); // Normalize name
      let rarityPercent = globalRarityMap.get(apinameLower);

      // Convert to a number with parseFloat. If invalid, default to 100.
      rarityPercent = parseFloat(rarityPercent);
      if (isNaN(rarityPercent)) {
        rarityPercent = 100;
      }

      const rarityCategory = getRarityCategory(rarityPercent);
      const unlockDate = new Date(achievement.unlocktime * 1000).toISOString();

      // Metadata JSON
      const metadata = {
        name: achievement.apiname,
        description: `An achievement from ${playerData.gameName}.`,
        image: "https://example.com/placeholder.png", // Replace later
        attributes: [
          { trait_type: "Rarity", value: rarityCategory },
          { trait_type: "Unlock Date", value: unlockDate },
          {
            trait_type: "Global Unlock Rate",
            value: `${rarityPercent.toFixed(2)}%`,
          },
        ],
      };

      // Save metadata file
      const filePath = path.join(outputDir, `${achievement.apiname}.json`);
      fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));

      console.log(`� Metadata saved: ${achievement.apiname}.json`);
    });

    console.log("\n✅ All metadata files generated successfully!");
  } catch (error) {
    console.error(
      "❌ Error fetching achievements:",
      error.response ? error.response.data : error.message
    );
  }

  rl.close();
});
