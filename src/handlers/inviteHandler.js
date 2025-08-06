const { Collection } = require('discord.js');
const Logger = require('../utils/logger');

class InviteHandler {
    constructor(client) {
        this.client = client;
        this.client.invites = new Collection();
        this.initialize();
    }

    initialize() {
        this.client.on('ready', () => this.onReady());
        this.client.on('guildCreate', (guild) => this.onGuildCreate(guild));
    }

    async onReady() {
        try {
            Logger.info('Caching invites for all guilds...', 'InviteHandler');
            for (const guild of this.client.guilds.cache.values()) {
                await this.fetchAndCacheInvites(guild);
            }
            Logger.success('Successfully cached all invites.', 'InviteHandler');
        } catch (error) {
            Logger.error(`Failed to cache invites on ready: ${error.message}`, 'InviteHandler');
        }
    }

    async onGuildCreate(guild) {
        await this.fetchAndCacheInvites(guild);
    }

    async fetchAndCacheInvites(guild) {
        try {
            const invites = await guild.invites.fetch();
            const codeUses = new Collection();
            invites.each(invite => codeUses.set(invite.code, invite.uses));
            this.client.invites.set(guild.id, codeUses);
        } catch (error) {
            Logger.warn(`Could not fetch invites for guild ${guild.id}: ${error.message}`, 'InviteHandler');
        }
    }

    async onGuildMemberAdd(member) {
        try {
            const cachedInvites = this.client.invites.get(member.guild.id);
            const newInvites = await member.guild.invites.fetch();

            const usedInvite = newInvites.find(invite => (cachedInvites.get(invite.code) || 0) < invite.uses);
            
            newInvites.each(invite => cachedInvites.set(invite.code, invite.uses));
            this.client.invites.set(member.guild.id, cachedInvites);

            if (usedInvite) {
                const inviter = await this.client.users.fetch(usedInvite.inviter.id).catch(() => null);
                return { invite: usedInvite, inviter: inviter };
            }
            return { invite: null, inviter: null };
        } catch (error) {
            Logger.error(`Error detecting used invite: ${error.message}`, 'InviteHandler');
            return { invite: null, inviter: null };
        }
    }
}

module.exports = InviteHandler;
