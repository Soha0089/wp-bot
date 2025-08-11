const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

function formatNumber(num) {
  const units = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "D"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  return Number(num.toFixed(1)) + units[unit];
}

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "2.1",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "game",
    guide: {
      en: "{pn} [bn/en]"
    }
  },

  onStart: async function ({ message, args }) {
    try {
      const input = args.join("").toLowerCase() || "bn";
      const category = input === "en" || input === "english" ? "english" : "bangla";

      const apiUrl = await mahmud();
      const res = await axios.get(`${apiUrl}/api/quiz?category=${category}`);
      const quiz = res.data;

      if (!quiz) return message.reply("❌ No quiz available for this category.");

      const { question, correctAnswer, options } = quiz;
      const { a, b, c, d } = options;

      const quizText =
        `\n╭──✦ ${question}` +
        `\n├‣ 𝗔) ${a}` +
        `\n├‣ 𝗕) ${b}` +
        `\n├‣ 𝗖) ${c}` +
        `\n├‣ 𝗗) ${d}` +
        `\n╰──────────────────‣` +
        `\nReply to this message with your answer.`;

      const sent = await message.reply(quizText);

      // IMPORTANT: store key as sent.key.id for WP Bot reply matching
      global.GoatBot.onReply.set(sent.key.id, {
        type: "quiz",
        commandName: this.config.name,
        author: message.author,
        quizMessageID: sent.key.id,
        correctAnswer
      });

      // Auto delete quiz after 40 seconds
      setTimeout(() => {
        message.delete(sent.key.id).catch(() => {});
      }, 40000);

    } catch (error) {
      console.error(error);
      message.reply("❌ Failed to fetch quiz. Please try again later.");
    }
  },

  onReply: async function ({ message, Reply, usersData }) {
    const { correctAnswer, author } = Reply;

    // Ensure the reply is from the original quiz sender
    if (message.author !== author) {
      return message.reply("This is not your quiz baby >🐸");
    }

    // Remove the quiz question message
    message.delete(Reply.quizMessageID).catch(() => {});
    const userReply = message.body.trim().toLowerCase();

    if (userReply === correctAnswer.toLowerCase()) {
      const rewardCoins = 500;
      const rewardExp = 121;
      const userData = await usersData.get(author);

      await usersData.set(author, {
        money: userData.money + rewardCoins,
        exp: userData.exp + rewardExp,
        data: userData.data
      });

      message.reply(`✅ Correct!\nYou earned ${formatNumber(rewardCoins)} coins & ${rewardExp} exp.`);
    } else {
      message.reply(`❌ Wrong!\nThe correct answer was: ${correctAnswer}`);
    }
  }
};
