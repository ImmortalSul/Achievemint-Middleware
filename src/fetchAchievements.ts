import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.STEAM_API_KEY;

if (!API_KEY) {
  throw new Error("Missing STEAM_API_KEY in environment variables.");
}

export async function fetchAchievements(steamID: string, appId: string) {
  const PLAYER_ACHIEVEMENTS_URL = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${API_KEY}&steamid=${steamID}&appid=${appId}`;
  const GLOBAL_ACHIEVEMENTS_URL = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appId}`;

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

    console.log(`\n🎮 Game: ${playerData.gameName}`);
    console.log("✅ Unlocked Achievements (Sorted by Rarity):");

    // Fetch global achievement percentages
    const globalResponse = await axios.get(GLOBAL_ACHIEVEMENTS_URL);
    const globalData = globalResponse.data.achievementpercentages.achievements;

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

    // Map achievements with rarity percentages
    const achievementsWithMetadata = unlockedAchievements.map(
      (achievement: any) => {
        const apinameLower = achievement.apiname.toLowerCase();
        let rarityPercent = globalRarityMap.get(apinameLower) || 100;
        rarityPercent = Number(rarityPercent); // Ensure rarityPercent is a number

        return {
          name: achievement.apiname,
          description: `An achievement from ${playerData.gameName}.`,
          image: "https://example.com/placeholder.png", // Placeholder, can be replaced later
          attributes: [
            {
              trait_type: "Rarity",
              value: getRarityCategory(rarityPercent),
            },
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
      }
    );

    // Sort achievements by rarity (lowest % first)
    achievementsWithMetadata.sort(
      (
        a: { attributes: { value: string }[] },
        b: { attributes: { value: string }[] }
      ) => parseFloat(a.attributes[2].value) - parseFloat(b.attributes[2].value)
    );

    // Save metadata as JSON
    const metadataDir = "metadata";
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir);
    }

    const metadataFilePath = `${metadataDir}/${steamID}_${appId}.json`;
    fs.writeFileSync(
      metadataFilePath,
      JSON.stringify(achievementsWithMetadata, null, 2)
    );

    console.log(`\n✅ Metadata saved to ${metadataFilePath}`);
    return achievementsWithMetadata;
  } catch (error) {
    console.error("❌ Error fetching achievements:", error);
    return null;
  }
}
