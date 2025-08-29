const { getUserData, updateUserData } = require('../scripts/helpers');

function getSenderId(message) {
  if (!message) return null;
  if (message.from.endsWith('@g.us')) return message.author || null;
  return message.from || null;
}

function formatNumber(num) {
  const units = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "D"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  return Number(num.toFixed(1)) + units[unit];
}

const lang = {
  invalid_amount: "Enter a valid and positive amount to have a chance to win double",
  not_enough_money: "𝐂𝐡𝐞𝐜𝐤 𝐲𝐨𝐮𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞 𝐢𝐟 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 𝐭𝐡𝐚𝐭 𝐚𝐦𝐨𝐮𝐧𝐭",
  spin_message: "Spinning...",
  win_message: "𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐰𝐨𝐧 $%1",
  lose_message: "𝐁𝐚𝐛𝐲, 𝐘𝐨𝐮 𝐥𝐨𝐬𝐭 $%1",
  jackpot_message: ">🎀 Jackpot 𝐁𝐚𝐛𝐲! 𝐘𝐨𝐮 𝐰𝐨𝐧 $%1 𝐰𝐢𝐭𝐡 three %2 symbols!",
  time_left_message: "❌ | 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞 𝐫𝐞𝐚𝐜𝐡𝐞𝐝 𝐲𝐨𝐮𝐫 𝐬𝐥𝐨𝐭 𝐥𝐢𝐦𝐢𝐭. 𝐓𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐢𝐧 %1𝐡 %2𝐦."
};

const maxlimit = 5; // max 20 spins
const slotTimeLimit = 10 * 60 * 60 * 1000; // 10 hours

module.exports = {
  config: {
    name: "slot4",
    version: "1.7",
    author: "MahMUD",
    countDown: 10,
    role: 0,
    description: "Play slot machine to win or lose coins.",
    category: "economy",
    guide: { en: "Usage: !slot <amount>" }
  },

  onStart: async function ({ message, args }) {
    const senderID = getSenderId(message);
    if (!senderID) return message.reply("❌ Cannot determine your ID.");

    const bet = parseInt(args[0]);
    if (isNaN(bet) || bet <= 0) return message.reply(lang.invalid_amount);

    try {
      const userData = await getUserData(senderID);
      if (!userData) return message.reply("❌ User data not found.");
      if (userData.coins < bet) return message.reply(`${lang.not_enough_money}\nBalance: ${formatNumber(userData.coins)}$`);

      // ---------------- LIMIT SYSTEM ----------------
      const currentTime = Date.now();
      if (!userData.slots) {
        userData.slots = { count: 0, firstSlot: currentTime };
      }

      const timeElapsed = currentTime - userData.slots.firstSlot;

      if (timeElapsed >= slotTimeLimit) {
        userData.slots = { count: 0, firstSlot: currentTime };
      }

      if (userData.slots.count >= maxlimit) {
        const timeLeft = slotTimeLimit - timeElapsed;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return message.reply(lang.time_left_message.replace("%1", hoursLeft).replace("%2", minutesLeft));
      }

      userData.slots.count += 1;
      // ------------------------------------------------

      const symbols = ["❤", "💜", "💙", "💚", "💛", "🖤", "🤍", "🤎"];
      const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
      const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
      const slot3 = symbols[Math.floor(Math.random() * symbols.length)];

      let reward = 0;
      // 3 symbols match special rules
      if (slot1 === slot2 && slot2 === slot3) {
        if (slot1 === "❤") reward = bet * 10;
        else if (slot1 === "💙") reward = bet * 6;
        else if (slot1 === "🤍") reward = bet * 5;
        else reward = bet * 3; // other symbols 3×
      } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
        reward = bet * 3; // 2 symbols match
      } else {
        reward = -bet;
      }

      const updatedCoins = userData.coins + reward;

      await updateUserData(senderID, { 
        coins: updatedCoins, 
        slots: userData.slots 
      });

      // Display message
      let display;
      if (reward > 0 && slot1 === "❤" && slot2 === "❤" && slot3 === "❤") {
        display = lang.jackpot_message.replace("%1", formatNumber(reward)).replace("%2", "❤");
      } else if (reward > 0) {
        display = lang.win_message.replace("%1", formatNumber(reward));
      } else {
        display = lang.lose_message.replace("%1", formatNumber(Math.abs(reward)));
      }

      return message.reply(`>🎀\n• ${display}\n• 𝐆𝐚𝐦𝐞 𝐑𝐞𝐬𝐮𝐥𝐭: [ ${slot1} | ${slot2} | ${slot3} ]\n• 𝐏𝐥𝐚𝐲𝐞𝐝: ${userData.slots.count}/${maxlimit}`);

    } catch (err) {
      console.error("Slot error:", err);
      return message.reply("❌ Something went wrong.");
    }
  }
};
