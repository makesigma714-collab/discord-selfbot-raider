const { Client } = require('discord.js-selfbot-v13');
const { getTokens, validateTokens } = require('./utils/config');
const broadcastCommand = require('./commands/broadcast');
const stopCommand = require('./commands/stop');
const forumSpamCommand = require('./commands/forumspam');
const joinCommand = require('./commands/join');
const userTokens = getTokens();
validateTokens(userTokens);
const clients = [];




function handleCommand(message) {
    if (!message.content.startsWith('!')) return;
    
    const args = message.content.slice(1).split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commandName === broadcastCommand.name) {
        broadcastCommand.execute(clients, message, args);
    } else if (commandName === stopCommand.name) {
        stopCommand.execute(clients, message);
    } else if (commandName === forumSpamCommand.name) {
        forumSpamCommand.execute(clients, message, args);
    } else if (commandName === joinCommand.name) {  
        joinCommand.execute(clients, message, args);  
    }
}

userTokens.forEach((token, index) => {
  const client = new Client();

  client.on('ready', () => {
    console.log(`[${index}] Logged in as ${client.user.tag}`);
    clients.push(client);
  });

  client.on('messageCreate', async (message) => {
    if (!userTokens.some(tok => message.author.id === client.user.id)) return;
    handleCommand(message);
  });

  client.login(token).catch(err => {
    console.error(`[${index}] Login failed:`, err.message);
  });
});

console.log('Bot started with', userTokens.length, 'accounts');