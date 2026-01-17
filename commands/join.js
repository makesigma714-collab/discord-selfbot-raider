module.exports = {
    name: 'join',
    description: 'autojoin',
    isProcessing: false,
    joinDelay: 5000,
    
    async execute(clients, message, args) {
        if (this.isProcessing) {
            message.channel.send('in progress').catch(console.error);
            return;
        }

        if (args.length < 1) {
            message.channel.send('use !join (invcode)').catch(console.error);
            return;
        }

        this.isProcessing = true;
        const inviteCode = this.sanitizeInvite(args[0]);
        const results = [];

        try {
            for (const [index, client] of clients.entries()) {
                try {
                    await this.attemptJoin(client, inviteCode);
                    results.push({ success: true, username: client.user.username });
                    console.log(`[${client.user.username}] (${index+1}/${clients.length}) Joined successfully`);
                    
                    if ((index + 1) % 5 === 0 || index === clients.length - 1) {
                        message.channel.send(`🔄 ${index+1}/${clients.length} accounts processed...`).catch(console.error);
                    }
                } catch (err) {
                    results.push({ 
                        success: false, 
                        username: client.user.username, 
                        error: err.message 
                    });
                    console.error(`[${client.user.username}] Join failed:`, err.message);
                    
                    if (err.message.includes('CAPTCHA')) {
                        message.channel.send(`${client.user.username} hit CAPTCHA manual solve required`).catch(console.error);
                        break;
                    }
                }
                
                if (index < clients.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.joinDelay));
                }
            }

            const successCount = results.filter(r => r.success).length;
            message.channel.send(
                `results: ${successCount}/${clients.length} succeeded\n` +
                `fails: ${results.filter(r => !r.success).length}`
            ).catch(console.error);
            
        } finally {
            this.isProcessing = false;
        }
    },

    sanitizeInvite(code) {
        return code.replace('discord.gg/', '')
                  .replace('https://', '')
                  .replace('http://', '')
                  .trim();
    },

    async attemptJoin(client, inviteCode) {
        try {
            await client.acceptInvite(inviteCode);
        } catch (err) {
            if (err.message.includes('CAPTCHA') || err.code === 50035) {
                throw new Error('frogot to make captcha solver make it urself lazy ass');
            }
            throw err;
        }
    }
};