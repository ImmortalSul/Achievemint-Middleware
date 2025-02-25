import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.STEAM_API_KEY;

if (!API_KEY) {
  throw new Error("Missing STEAM_API_KEY in environment variables.");
}

export async function fetchAchievements(steamID: string, appId: string) {
  const PLAYER_ACHIEVEMENTS_URL = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${API_KEY}&steamid=${steamID}&appid=${appId}`;
  const GLOBAL_ACHIEVEMENTS_URL = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appId}`;
  const GAME_SCHEMA_URL = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${API_KEY}&appid=${appId}`;

  try {
    console.log("\n⏳ Fetching achievements...");

    // Fetch player's unlocked achievements
    const playerResponse = await axios.get(PLAYER_ACHIEVEMENTS_URL);
    const playerData = playerResponse.data.playerstats;
    const unlockedAchievements = playerData.achievements.filter(
      (ach: any) => ach.achieved === 1
    );

    if (unlockedAchievements.length === 0) {
      console.log("❌ No achievements unlocked.");
      return [];
    }

    const gameName = playerData.gameName.replace(/[^a-zA-Z0-9]/g, "_"); // Sanitize folder name
    console.log(`\n� Game: ${playerData.gameName}`);
    console.log("✅ Unlocked Achievements (Sorted by Rarity):");

    // Fetch global achievement percentages
    const globalResponse = await axios.get(GLOBAL_ACHIEVEMENTS_URL);
    const globalData = globalResponse.data.achievementpercentages.achievements;

    // Fetch game schema to get achievement descriptions
    const schemaResponse = await axios.get(GAME_SCHEMA_URL);
    const schemaAchievements =
      schemaResponse.data.game.availableGameStats.achievements;

    // Create a map of achievement descriptions
    const achievementDescriptions = new Map();
    schemaAchievements.forEach((ach: any) => {
      achievementDescriptions.set(ach.name.toLowerCase(), {
        description: ach.description || "No description available.",
        icon: ach.icon || "https://example.com/placeholder.png",
      });
    });

    // Create a map of global achievements for quick lookup
    const globalRarityMap = new Map();
    globalData.forEach((ach: any) =>
      globalRarityMap.set(ach.name.toLowerCase(), ach.percent)
    );

    // Function to determine rarity category
    const getRarityCategory = (percent: number) => {
      if (percent < 10) return "Legendary";
      if (percent < 30) return "Rare";
      return "Uncommon";
    };

    // Create game-specific metadata directory
    const gameMetadataDir = path.join("metadata", gameName);
    if (!fs.existsSync(gameMetadataDir)) {
      fs.mkdirSync(gameMetadataDir, { recursive: true });
    }

    // Process each achievement
    const achievementsWithMetadata = unlockedAchievements.map(
      (achievement: any) => {
        const apinameLower = achievement.apiname.toLowerCase();
        let rarityPercent = globalRarityMap.get(apinameLower) || 100;
        rarityPercent = Number(rarityPercent); // Ensure it's a number

        // Get actual description and icon
        const { description, icon } =
          achievementDescriptions.get(apinameLower) || {};

        // Generate metadata for each achievement
        const metadata = {
          name: achievement.apiname,
          description:
            description || `An achievement from ${playerData.gameName}.`,
          image: icon || "https://example.com/placeholder.png",
          attributes: [
            { trait_type: "Rarity", value: getRarityCategory(rarityPercent) },
            {
              trait_type: "Unlock Date",
              value: new Date(achievement.unlocktime * 1000).toISOString(),
            },
            {
              trait_type: "Global Unlock Rate",
              value: `${rarityPercent.toFixed(2)}%`,
            },
          ],
        };

        // Save each achievement metadata in its own JSON file
        const achievementFileName =
          achievement.apiname.replace(/[^a-zA-Z0-9]/g, "_") + ".json";
        const metadataFilePath = path.join(
          gameMetadataDir,
          achievementFileName
        );

        fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));
        console.log(`✅ Saved metadata for: ${achievement.apiname}`);

        return metadata;
      }
    );

    console.log(`\n✅ All metadata saved under "metadata/${gameName}"`);
    return achievementsWithMetadata;
  } catch (error) {
    console.error("❌ Error fetching achievements:", error);
    return null;
  }
}
