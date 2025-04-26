require("dotenv").config();
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const ROBLOX_USER_ID = process.env.ROBLOX_USER_ID;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

async function getUserPresence(userId) {
    try {
        const response = await axios.post(
            "https://presence.roblox.com/v1/presence/users",
            { userIds: [userId] },
            {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "axios/1.8.4",
                },
            }
        );
        return response.data.userPresences[0];
    } catch (error) {
        console.error("Error fetching user status:", error.message);
        return null;
    }
}

async function getUserName(userId) {
    try {
        const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
        return response.data.displayName; 
    } catch (error) {
        console.error("Error fetching user name:", error.message);
        return "Unknown User";
    }
}

let lastStatus = null;

async function trackUser() {
    const presence = await getUserPresence(ROBLOX_USER_ID);
    if (!presence) return;

    const username = await getUserName(ROBLOX_USER_ID); 
    const status = presence.userPresenceType;
    let statusText = "";

    switch (status) {
        case 0:
            statusText = "🚫 Offline";
            break;
        case 1:
            statusText = "✅ Online";
            break;
        case 2:
            statusText = `🎮 In Game: ${presence.lastLocation}`;
            break;
        case 3:
            statusText = "🛠️ In Studio";
            break;
    }

    if (lastStatus !== statusText) {
        bot.sendMessage(CHAT_ID, `📢 Roblox User Status Update:\n👤 **${username}**\n${statusText}`);
        lastStatus = statusText;
    }
}

setInterval(trackUser, 30000);

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "✅ Roblox Tracker Bot is Running!");
});

console.log("✅ Telegram bot started...");

// , { parse_mode: "Markdown" }