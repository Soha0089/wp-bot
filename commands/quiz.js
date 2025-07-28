const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "1.7",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    category: "game",
    shortDescription: {
      en: "Answer a quiz to earn coins and exp"
    },
    guide: {
      en: "quiz\nquiz en"
    }
  },

  onStart: async function ({ message, args, event, usersData }) {
    try {
      const input = args.join("").toLowerCase() || "bn";
      const category = input === "en" || input === "english" ? "english" : "bangla";

      const apiUrl = await baseApiUrl();
      const res = await axios.get(`${apiUrl}/api/quiz?category=${category}`);
      const quiz = res.data;

      if (!quiz) return message.reply("❌ No quiz available for this category.");

      const { question, correctAnswer, options } = quiz;
      const { a, b, c, d } = options;

      const msg = `🧠 Quiz Time (${category.toUpperCase()}):\n\n` +
        `╭──✦ ${question}\n` +
        `├‣ A) ${a}\n` +
        `├‣ B) ${b}\n` +
        `├‣ C) ${c}\n` +
        `├‣ D) ${d}\n` +
        `╰──────────────────‣\n` +
        `📝 Reply with your answer (A/B/C/D)`;

      message.reply(msg, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          messageID: info.messageID,
          author: message.senderID,
          correctAnswer
        });

        setTimeout(() => {
          message.unsend(info.messageID);
        }, 40000);
      });
    } catch (error) {
      console.error("❌ Quiz fetch error:", error.message);
      message.reply("❌ Failed to fetch quiz. Try again later.");
    }
  },

  onReply: async function ({ message, event, Reply, usersData }) {
    const { correctAnswer, author } = Reply;
    if (event.senderID !== author) return message.reply("❌ This isn't your quiz baby 🐸");

    await message.unsend(Reply.messageID);
    const userAnswer = event.body.trim().toLowerCase();
    const correct = correctAnswer.toLowerCase();

    if (userAnswer === correct) {
      const coins = 500;
      const exp = 121;

      const userData = await usersData.get(author);
      await usersData.set(author, {
        coins: userData.coins + coins,
        exp: userData.exp + exp,
        data: userData.data
      });

      return message.reply(`✅ Correct Answer Baby!\n🎁 You earned ${coins} coins and ${exp} exp.`);
    } else {
      return message.reply(`❌ Wrong Answer Baby!\n✅ Correct answer was: ${correctAnswer}`);
    }
  }
};
