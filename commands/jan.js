const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.jan;
};

const getBotResponse = async (msg) => {
  try {
    const base = await baseApiUrl();
    const res = await axios.get(`${base}/jan/font3/${encodeURIComponent(msg)}`);
    return res.data?.message || "❌ Try again.";
  } catch (err) {
    console.error("API Error:", err.message || err);
    return "❌ Error occurred, janu 🥲";
  }
};

module.exports = {
  config: {
    name: "bot2",
    version: "1.8",
    author: "MahMUD",
    role: 0,
    coolDown: 3,
    shortDescription: "Talk with jan",
    longDescription: "Text-based response using jan AI",
    category: "ai",
    guide: "Just type jan or jan <message>, or reply jan’s message"
  },

  onStart: async function () {},

  onChat: async function ({ message, client }) {
    try {
      const body = message.body?.toLowerCase() || "";
      const triggers = ["jan", "jaan", "জান", "hinata", "bby", "baby"];
      const words = body.trim().split(/\s+/);
      const match = triggers.some(trigger => body.startsWith(trigger));

      // ✅ 1. Handle reply to jan message
      if (message.hasQuotedMsg) {
        const quoted = await message.getQuotedMessage();
        if (quoted.fromMe) {
          const replyText = await getBotResponse(body);
          return await message.reply(replyText);
        }
      }

      // ✅ 2. Normal "jan ..." message
      if (match) {
        if (words.length === 1) {
          const replies = [
            "babu khuda lagse🥺",
            "Hop beda😾, Boss বল boss😼",
            "আমাকে ডাকলে, আমি কিন্তূ কিস করে দেবো😘",
            "🐒🐒🐒",
            "bye",
            "naw message daw m.me/mahmud.x07",
            "mb ney bye",
            "meww",
            "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏",
            "𝗜 𝗹𝗼𝘃𝗲 𝘆𝗼𝘂__😘😘",
            "𝗜 𝗵𝗮𝘁𝗲 𝘆𝗼𝘂__😏😏"
          ];
          const random = replies[Math.floor(Math.random() * replies.length)];
          return await message.reply(random);
        } else {
          words.shift(); // remove "jan"
          const query = words.join(" ");
          const replyText = await getBotResponse(query);
          return await message.reply(replyText);
        }
      }
    } catch (e) {
      console.error("Bot2 Chat Error:", e);
      await message.reply("❌ Something went wrong.");
    }
  }
};
