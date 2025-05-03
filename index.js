// require("dotenv").config();
// const axios = require("axios");
// const TelegramBot = require("node-telegram-bot-api");

// const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// const CHAT_ID = process.env.CHAT_ID;
// const ROBLOX_USER_ID = process.env.ROBLOX_USER_ID;

// const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// // Escape MarkdownV2 special characters
// function escapeMarkdown(text) {
//     return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
// }

// async function getUserPresence(userId) {
//     try {
//         const response = await axios.post(
//             "https://presence.roblox.com/v1/presence/users",
//             { userIds: [userId] },
//             {
//                 headers: {
//                     "Content-Type": "application/json",
//                     "User-Agent": "axios/1.8.4",
//                 },
//             }
//         );
//         return response.data.userPresences[0];
//     } catch (error) {
//         console.error("Error fetching user status:", error.message);
//         return null;
//     }
// }

// async function getUserName(userId) {
//     try {
//         const response = await axios.get(`https://users.roblox.com/v1/users/${userId}`);
//         return response.data.displayName; 
//     } catch (error) {
//         console.error("Error fetching user name:", error.message);
//         return "Unknown User";
//     }
// }

// let lastStatus = null;

// async function trackUser() {
//     const presence = await getUserPresence(ROBLOX_USER_ID);
//     if (!presence) return;

//     const username = await getUserName(ROBLOX_USER_ID); 
//     const status = presence.userPresenceType;
//     let statusText = "";

//     switch (status) {
//         case 0:
//             statusText = "🚫 Offline";
//             break;
//         case 1:
//             statusText = "✅ Online";
//             break;
//         case 2:
//             statusText = `🎮 In Game: ${presence.lastLocation}`;
//             break;
//         case 3:
//             statusText = "🛠️ In Studio";
//             break;
//     }

//     if (lastStatus !== statusText) {
//         const message = `📢 Roblox User Status Update:\n👤 *${escapeMarkdown(username)}*\n${escapeMarkdown(statusText)}`;
//         bot.sendMessage(CHAT_ID, message, { parse_mode: "MarkdownV2" });
//         lastStatus = statusText;
//     }
// }

// setInterval(trackUser, 30000);

// bot.onText(/\/start/, (msg) => {
//     bot.sendMessage(msg.chat.id, "✅ Roblox Tracker Bot is Running!");
// });

// console.log("✅ Telegram bot started...");

require("dotenv").config();
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const ROBLOX_USER_ID = process.env.ROBLOX_USER_ID;

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

function escapeMarkdown(text) {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

function getTime() {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour12: false });
}

async function getUserPresence(userId) {
    try {
        const response = await axios.post(
            "https://presence.roblox.com/v1/presence/users",
            { userIds: [userId] },
            {
                headers: { "Content-Type": "application/json" },
            }
        );
        return response.data.userPresences[0];
    } catch (error) {
        console.error("Error fetching presence:", error.message);
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

async function getGameNameAndLink(placeId) {
    try {
        const response = await axios.get(`https://games.roblox.com/v1/games?universeIds=${placeId}`);
        const game = response.data.data[0];
        return {
            name: game.name,
            link: `https://www.roblox.com/games/${game.rootPlaceId}`,
        };
    } catch (error) {
        console.error("Error fetching game name:", error.message);
        return {
            name: "Unknown Game",
            link: "",
        };
    }
}

let lastStatusCode = null;
let lastPlaceId = null;

async function trackUser() {
    const presence = await getUserPresence(ROBLOX_USER_ID);
    if (!presence) return;

    const username = await getUserName(ROBLOX_USER_ID);
    const statusCode = presence.userPresenceType;
    const timestamp = getTime();
    const placeId = presence.placeId;

    let message = "";
    let eventDetected = false;

    if (statusCode !== lastStatusCode || placeId !== lastPlaceId) {
        switch (statusCode) {
            case 0:
                message = `🚫 *${escapeMarkdown(username)}* went *Offline* at ${timestamp}`;
                eventDetected = true;
                break;
            case 1:
                message = `✅ *${escapeMarkdown(username)}* is *Online* (not in-game) at ${timestamp}`;
                eventDetected = true;
                break;
            case 2:
                const { name, link } = await getGameNameAndLink(presence.universeId || placeId);
                message = `🎮 *${escapeMarkdown(username)}* is playing:\n[*${escapeMarkdown(name)}*](${escapeMarkdown(link)})\nat ${timestamp}`;
                eventDetected = true;
                break;
            case 3:
                message = `🛠️ *${escapeMarkdown(username)}* is in *Roblox Studio* at ${timestamp}`;
                eventDetected = true;
                break;
        }

        if (eventDetected) {
            bot.sendMessage(CHAT_ID, message, { parse_mode: "MarkdownV2", disable_web_page_preview: true });
        }

        lastStatusCode = statusCode;
        lastPlaceId = placeId;
    }
}

setInterval(trackUser, 30000);

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "✅ Roblox Tracker Bot is Running!");
});

console.log("✅ Telegram bot started...");
