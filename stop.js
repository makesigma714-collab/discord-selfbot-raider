const broadcastCommand = require('./broadcast');
const forumSpamCommand = require('./forumspam');

module.exports = {
    name: 'stop',
    description: 'Stop raiding',
    async execute(clients, message) {
        let anythingStopped = false;
        
        if (broadcastCommand.isSpamming) {
            broadcastCommand.stop();
            anythingStopped = true;
        }
        
        if (forumSpamCommand.isSpamming) {
            forumSpamCommand.stop();
            anythingStopped = true;
        }

        if (anythingStopped) {
            message.channel.send('All raid operations stopped').catch(console.error);
            console.log(`All spraidam stopped by ${message.author.tag}`);
        } else {
            message.channel.send('No active raid operations to stop').catch(console.error);
        }
    }
};