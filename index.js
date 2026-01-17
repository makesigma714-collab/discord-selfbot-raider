require('dotenv').config(); 
const { Client } = require('discord.js-selfbot-v13');


const userTokens = process.env.DISCORD_TOKENS.split(',');
const clients = [];
const MAX_RETRIES = 3;
const INITIAL_DELAY = 100;
let isSpamming = false;
let currentBroadcast = null;


if (!userTokens || userTokens.length === 0 || userTokens.some(t => !t.trim())) {
  console.error('No tokens');
  process.exit(1);
}

userTokens.forEach((token, index) => {
  const client = new Client();

  client.on('ready', () => {
    console.log(`[${index}] logged in as ${client.user.tag}`);
    clients.push(client);
  });

  client.on('messageCreate', async (message) => {
    if (!userTokens.some(tok => message.author.id === client.user.id)) return;

    if (message.content.startsWith('!broadcast ')) {
      if (isSpamming) {
        console.log('Stop current spam first');
        return;
      }

      const args = message.content.split(' ').slice(1);
      if (args.length < 2) {
        console.log('Usage: !broadcast <serverId> <message>');
        return;
      }

      currentBroadcast = {
        serverId: args[0],
        message: args.slice(1).join(' ')
      };

      isSpamming = true;
      console.log(`Starting raid in ${currentBroadcast.serverId}`);

      await Promise.all(clients.map(async (botClient) => {
        const guild = botClient.guilds.cache.get(currentBroadcast.serverId);
        if (!guild) {
          console.log(`${botClient.user.username} not in server`);
          return;
        }

        const channels = [...guild.channels.cache.filter(ch => 
          ['text', 'news', 'GUILD_TEXT'].includes(ch.type)
        ).values()];

        while (isSpamming && currentBroadcast?.serverId === guild.id) {
          for (const channel of channels) {
            if (!isSpamming) break;
            
            let delay = INITIAL_DELAY;
            for (let attempt = 1; attempt <= MAX_RETRIES && isSpamming; attempt++) {
              try {
                await channel.send(currentBroadcast.message);
                console.log(`[${botClient.user.username}] Sent to #${channel.name}`);
                break;
              } catch (err) {
                console.error(`[${botClient.user.username}] Error:`, err.message);
                if (attempt < MAX_RETRIES) {
                  delay *= 2;
                  await new Promise(resolve => setTimeout(resolve, delay));
                }
              }
            }
            await new Promise(resolve => setTimeout(resolve, 30)); // delay here
          }
        }
      }));
    }
    else if (message.content === '!broadcaststop') {
      isSpamming = false;
      currentBroadcast = null;
      console.log('raid stopped');
    }
  });

  client.login(token).catch(err => {
    console.error(`[${index}] Login failed:`, err.message);
  });
});