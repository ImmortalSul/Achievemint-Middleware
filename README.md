# Achievemint - Steam Achievement NFT Generator

For the Turbin3 Capstone

Achievemint is a decentralized platform that rewards gamers with NFTs based on their in-game achievements. This project fetches Steam achievements, assigns rarity based on global unlock rates, and prepares metadata for NFT minting on Solana.

## Features
- 🔗 **Steam Authentication**: Users log in with Steam to fetch their achievements.
- 🏆 **Achievement Processing**: Extracts unlocked achievements, categorizes rarity, and generates metadata.
- 📂 **Metadata Storage**: Saves achievement data in JSON format for NFT minting.
- 🎭 **Solana NFT Integration** *(Coming Soon!)*: Mint NFTs using Solana's Anchor framework.

## Tech Stack
- **Backend**: Node.js, Express
- **Database**: JSON-based metadata storage
- **Blockchain**: Solana (Anchor, Metaplex, SPL Tokens)
- **APIs**: Steamworks API

## Installation
1. Clone the repo:
   ```sh
   git clone https://github.com/yourusername/achievemint.git
   cd achievemint
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up your `.env` file:
   ```env
   STEAM_API_KEY=your_steam_api_key
   ```
4. Start the server:
   ```sh
   npm start
   ```

## Usage
### 1. Authenticate with Steam
- Open `http://localhost:3000/login` to sign in with Steam.

### 2. Fetch Achievements
- After logging in, click on `Fetch Achievements` to retrieve your unlocked achievements.
- The metadata will be saved in the `/metadata` folder.

### 3. Mint NFTs *(Coming Soon!)*
- The next phase will involve using Solana's Anchor framework to mint NFTs from the generated metadata.

## Roadmap
- ✅ Fetch Steam achievements & determine rarity
- ✅ Generate metadata for NFT minting
- 🔜 Implement Solana NFT minting with Anchor
- 🔜 UI for easy interaction

## Contributions
Feel free to contribute! Open an issue or submit a PR.

## License
MIT License © 2025 Sulaiman

