// File: rank.js
// Author: tas33n | Fixed by Rahaman Leon

const { getUserData, log } = require('../scripts/helpers');

module.exports = {
  config: {
    name: "rank",
    aliases: ["level", "xp"],
    version: "1.2",
    author: "tas33n | Rahaman Leon",
    coolDown: 3,
    role: 0,
    description: "Check your current rank and XP",
    category: "info",
    guide: {
      en: "{prefix}rank - Check your rank\n{prefix}rank @user - Check someone else's rank\n{prefix}rank top - View top 10 leaderboard"
    }
  },

  onStart: async function ({ message, client, args, contact }) {
    try {
      const User = require('../models/User');

      if (args[0] && args[0].toLowerCase() === 'top') {
        return await this.showLeaderboard(message, client);
      }

      let targetUserId = contact.id._serialized;
      let targetName = contact.name || contact.pushname || "You";

      if (message.hasQuotedMsg) {
        const quotedMsg = await message.getQuotedMessage();
        targetUserId = quotedMsg.author || quotedMsg.from;
        try {
          const targetContact = await client.getContactById(targetUserId);
          targetName = targetContact.name || targetContact.pushname || targetUserId.split('@')[0];
        } catch {
          targetName = targetUserId.split('@')[0];
        }
      } else {
        const mentions = await message.getMentions();
        if (mentions && mentions.length > 0) {
          targetUserId = mentions[0].id._serialized;
          targetName = mentions[0].name || mentions[0].pushname || targetUserId.split('@')[0];
        }
      }

      const allUsers = await User.find().sort({ exp: -1 });
      const targetUser = await getUserData(targetUserId);
      const rank = allUsers.findIndex(u => u.id === targetUserId) + 1;

      const xpForCurrent = this.getXPForLevel(targetUser.level);
      const xpForNext = this.getXPForLevel(targetUser.level + 1);
      const progress = Math.max(0, targetUser.exp - xpForCurrent);
      const needed = Math.max(0, xpForNext - targetUser.exp);

      const percent = Math.max(0, Math.min(progress / (xpForNext - xpForCurrent), 1));
      const filled = Math.floor(percent * 10);
      const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

      const lastActiveAgo = targetUser.lastActive ? this.formatTimeAgo(Date.now() - targetUser.lastActive) : 'Unknown';

      const isOwn = targetUserId === contact.id._serialized;
      const title = isOwn ? "🏆 Your Rank Info" : `🏆 ${targetName}'s Rank Info`;

      const msg = `
${title}
━━━━━━━━━━━━━━━━━━━━━
🔸 Rank: #${rank} of ${allUsers.length}
🔸 Level: ${targetUser.level}
🔸 XP: ${targetUser.exp.toLocaleString()}
🔸 Messages: ${targetUser.messageCount?.toLocaleString() || 0}
🔸 Coins: ${targetUser.coins?.toLocaleString() || 0}
🔸 Last Active: ${lastActiveAgo}
━━━━━━━━━━━━━━━━━━━━━
📊 Progress to Level ${targetUser.level + 1}:
${bar} ${Math.round(percent * 100)}%
⚡ XP Needed: ${needed.toLocaleString()} XP
💡 Tip: Send messages to gain XP and climb ranks!
      `.trim();

      await message.reply(msg);

    } catch (err) {
      log(`Rank error: ${err.message}`, 'error');
      await message.reply("❌ Error fetching rank info.");
    }
  },

  async showLeaderboard(message, client) {
    const User = require('../models/User');
    try {
      const top = await User.find().sort({ exp: -1 }).limit(10);
      if (!top.length) return await message.reply("📊 No users on the leaderboard yet!");

      let text = "🏆 Top 10 Leaderboard\n━━━━━━━━━━━━━━━━━━━━━\n";

      for (let i = 0; i < top.length; i++) {
        const u = top[i];
        let name = u.id.split('@')[0];
        try {
          const c = await client.getContactById(u.id);
          name = c.name || c.pushname || name;
        } catch {}
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        text += `${medal} ${name}\n   Level ${u.level} • ${u.exp.toLocaleString()} XP\n\n`;
      }

      text += "💡 Keep chatting to rank up!";
      await message.reply(text);
    } catch (err) {
      log(`Leaderboard error: ${err.message}`, 'error');
      await message.reply("❌ Failed to load leaderboard.");
    }
  },

  getXPForLevel(level) {
    return Math.floor(Math.pow(level, 2) * 50);
  },

  formatTimeAgo(ms) {
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return `${s}s ago`;
  }
};
