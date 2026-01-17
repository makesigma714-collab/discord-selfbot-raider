require('dotenv').config();

module.exports = {
  getTokens: () => {
    if (!process.env.DISCORD_TOKENS) {
      throw new Error('No tokens');
    }
    return process.env.DISCORD_TOKENS.split(',').map(t => t.trim()).filter(t => t);
  },
  validateTokens: (tokens) => {
    if (!tokens || tokens.length === 0) {
      throw new Error('No valid tokens provided');
    }
  }
};