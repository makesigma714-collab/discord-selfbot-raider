module.exports = {
    name: 'broadcast',
    isSpamming: false,
    currentBroadcast: null,
    MAX_RETRIES: 3,
    INITIAL_DELAY: 100,

    async execute(clients, message, args) {
        if (this.isSpamming) {
            message.channel.send('another raid is already running').catch(console.error);
            return;
        }

        if (args.length < 2) {
            message.channel.send('bad command').catch(console.error);
            return;
        }

        this.currentBroadcast = {
            serverId: args[0],
            message: args.length > 2 && args[2].length === 18 ? args.slice(1, -1).join(' ') : args.slice(1).join(' '),
            channelId: args.length > 2 && args[2].length === 18 ? args[args.length-1] : null
        };

        this.isSpamming = true;
        console.log(`Starting raid in ${this.currentBroadcast.serverId}` + 
                   (this.currentBroadcast.channelId ? ` (targeting channel ${this.currentBroadcast.channelId})` : ''));

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
                const permissions = channel.permissionsFor(botClient.user);
                if (!permissions || !permissions.has('VIEW_CHANNEL') || !permissions.has('SEND_MESSAGES')) {
                    console.log(`${botClient.user.username} invalid prems #${channel.name}`);
                    return;
                }

                console.log(`${botClient.user.username} targeting single channel #${channel.name}`);
                await this.spamChannel(botClient, channel, message);
                return;
            }

            const channels = [...guild.channels.cache.filter(ch => {
                if (!['text', 'news', 'GUILD_TEXT'].includes(ch.type)) return false;
                
                const permissions = ch.permissionsFor(botClient.user);
                return permissions && permissions.has('VIEW_CHANNEL') && permissions.has('SEND_MESSAGES');
            }).values()];

            if (channels.length === 0) {
                console.log(`${botClient.user.username} has no accessible channels in ${guild.name}`);
                return;
            }

            console.log(`${botClient.user.username} spamming ${channels.length} channels`);

            while (this.isSpamming && this.currentBroadcast?.serverId === guild.id) {
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
        await new Promise(resolve => setTimeout(resolve, 15));
    },

    stop() {
        this.isSpamming = false;
        this.currentBroadcast = null;
        console.log('raid stopped');
    }
};