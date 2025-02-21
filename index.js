import axios from "axios";
import readline from "readline";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = process.env.STEAM_ID;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("� Enter the Steam App ID: ", async (appId) => {
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

    // Debugging: Check if globalData is coming in correctly
    console.log("� Global Achievements Data:", globalData);

    // Create a map of global achievements for quick lookup
    const globalRarityMap = new Map();
    globalData.forEach((ach) =>
      globalRarityMap.set(ach.name.toLowerCase(), ach.percent)
    );

    // Function to determine rarity category
    const getRarityCategory = (percent) => {
      if (percent < 10) return "� Legendary";
      if (percent < 30) return "⭐ Rare";
      return "✅ Uncommon";
    };

    // Map achievements with rarity percentages
    const achievementsWithRarity = unlockedAchievements.map((achievement) => {
      const apinameLower = achievement.apiname.toLowerCase(); // Normalize name
      let rarityPercent = globalRarityMap.get(apinameLower);

      // Convert to a number with parseFloat. If invalid, default to 100.
      rarityPercent = parseFloat(rarityPercent);
      if (isNaN(rarityPercent)) {
        rarityPercent = 100;
      }

      return {
        name: achievement.apiname,
        unlockDate: new Date(achievement.unlocktime * 1000).toLocaleString(),
        rarityPercent,
        rarityCategory: getRarityCategory(rarityPercent),
      };
    });

    // Sort achievements by rarity (lowest % first)
    achievementsWithRarity.sort((a, b) => a.rarityPercent - b.rarityPercent);

    // Count achievements by rarity category
    const rarityCounts = {
      Legendary: 0,
      Rare: 0,
      Uncommon: 0,
    };

    // Display sorted achievements
    achievementsWithRarity.forEach(
      ({ name, unlockDate, rarityPercent, rarityCategory }) => {
        // Remove emoji for counting category key
        const categoryKey = rarityCategory
          .replace("� ", "")
          .replace("⭐ ", "")
          .replace("✅ ", "");
        rarityCounts[categoryKey]++;
        console.log(
          `- ${name} � Unlocked on ${unlockDate} | ${rarityCategory} (${rarityPercent.toFixed(
            2
          )}%)`
        );
      }
    );

    // Print rarity statistics
    console.log("\n� Rarity Summary:");
    console.log(`� Legendary (<10%): ${rarityCounts.Legendary}`);
    console.log(`⭐ Rare (10% - 30%): ${rarityCounts.Rare}`);
    console.log(`✅ Uncommon (>30%): ${rarityCounts.Uncommon}`);
  } catch (error) {
    console.error(
      "❌ Error fetching achievements:",
      error.response ? error.response.data : error.message
    );
  }

  rl.close();
});
