// doesent work wow
module.exports = {
    name: 'broadcast',
    isSpamming: false,
    currentBroadcast: null,
    MAX_RETRIES: 3,
    INITIAL_DELAY: 100,

    async execute(clients, message, args) {
        if (this.isSpamming) {
            message.channel.send('Another raid is already running').catch(console.error);
            return;
        }

        if (args.length < 2) {
            message.channel.send('bad message').catch(console.error);
            return;
        }

        const serverId = args[0];
        let channelId = null;
        let messageText = args.slice(1).join(' ');

        if (args.length >= 3 && args[1].match(/^\d{18}$/)) {
            channelId = args[1];
            messageText = args.slice(2).join(' ');
        }

        this.currentBroadcast = {
            serverId,
            channelId,
            message: messageText
        };

        this.isSpamming = true;
        console.log(`Starting raid in ${serverId}` + 
                  (channelId ? ` (targeting channel ${channelId})` : ' (all channels)'));

        await this.startBroadcast(clients, message);
    },

    async startBroadcast(clients, triggerMessage) {
        const { serverId, message, channelId } = this.currentBroadcast;
        
        await Promise.all(clients.map(async (botClient) => {
            const guild = botClient.guilds.cache.get(serverId);
            if (!guild) {
                console.log(`${botClient.user.username} not in server`);
                return;
            }

            if (channelId) {
                const channel = guild.channels.cache.get(channelId);
                if (!channel) {
                    triggerMessage.channel.send('Specified channel not found').catch(console.error);
                    return;
                }

                if (!['text', 'news', 'GUILD_TEXT'].includes(channel.type)) {
                    triggerMessage.channel.send('Specified channel is not a text channel').catch(console.error);
                    return;
                }

                console.log(`${botClient.user.username} targeting channel #${channel.name}`);
                while (this.isSpamming) {
                    await this.spamChannel(botClient, channel, message);
                }
                return;
            }

            const channels = [...guild.channels.cache.filter(ch => 
                ['text', 'news', 'GUILD_TEXT'].includes(ch.type)
            ).values()];

            console.log(`${botClient.user.username} spamming ${channels.length} channels`);
            while (this.isSpamming) {
                for (const channel of channels) {
                    if (!this.isSpamming) break;
                    await this.spamChannel(botClient, channel, message);
                }
            }
        }));
    },

    async spamChannel(botClient, channel, message) {
        let delay = this.INITIAL_DELAY;
        for (let attempt = 1; attempt <= this.MAX_RETRIES && this.isSpamming; attempt++) {
            try {
                await channel.send(message);
                console.log(`[${botClient.user.username}] Sent to #${channel.name}`);
                break;
            } catch (err) {
                console.error(`[${botClient.user.username}] Error:`, err.message);
                if (attempt < this.MAX_RETRIES) {
                    delay *= 2;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        await new Promise(resolve => setTimeout(resolve, 30));
    },

    stop() {
        this.isSpamming = false;
        this.currentBroadcast = null;
        console.log('Raid stopped');
    }
};