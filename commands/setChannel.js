const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const database = require('../utility/database.js');
const wbm = require('./wbm.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("set-channel")
        .setDescription("Set the channel you want to use to play on.")
        .addChannelOption(option => 
            option.setName("channel")
                .setDescription("The channel you want to use to play on.")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    needsWordData: true,
    async execute(interaction, client, words, templates, templateSolves) {
        var newChannelID = interaction.options.getChannel("channel").id;
        var oldchannelID = database.getChannelFromServer(interaction.guild.id);

        var perms = interaction.guild.members.me?.permissionsIn(newChannelID);
        if (newChannelID == oldchannelID) {
            await interaction.reply({content: "Cannot change to the same channel!", ephemeral: true});
            return;
        }
        else if (!perms.has(PermissionFlagsBits.ViewChannel) || !perms.has(PermissionFlagsBits.SendMessages)) {
            await interaction.reply({content: `The bot does not have access or cannot send messages to <#${newChannelID}>.`, ephemeral: true});
            return;
        }
        if (oldchannelID != undefined) {
            // set the channel and stuf
            client.removeAllListeners(oldchannelID);
        }
        // change the channel and stuf
        database.switchChannels(oldchannelID, newChannelID, interaction.guild.id);
        wbm.execute(client, client.channels.cache.get(newChannelID), words, templates, templateSolves);

        await interaction.reply({content: `Successfully set channel to <#${newChannelID}>.`, ephemeral: true});
    }
}