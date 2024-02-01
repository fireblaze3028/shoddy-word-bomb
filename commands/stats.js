const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const database = require('../utility/database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stats")
        .setDescription("See the stats for a user.")
        .addUserOption(option => 
            option
            .setName('target')
            .setDescription('The person to see the stats of'))
        .addBooleanOption(option =>
            option
            .setName('ephemeral')
            .setDescription('Whether to make it visible to only you or not'))
        .setDMPermission(false),
    
    async execute(interaction, client) {
        // get the stats of the target user
        var user = interaction.user;
        if (interaction.options.getUser('target')) {
            user = interaction.options.getUser('target');
        }
        var content = database.getUser(database.getChannelFromServer(interaction.guild.id), user.id);

        // checking if time is undefined, then no solves have occured
        if (content.time == undefined) {
            await interaction.reply({ embeds: [getErrorEmbed()], ephemeral: interaction.options.getBoolean('ephemeral') })
            .catch("error sending message");
            return;
        }

        // create our embed with stats
        const embed = new EmbedBuilder()
        .setTitle(`Stats for ${user.username}`)
        .setColor(0x12d198)
        .addFields(
        { name: `Solves: `, value: `${content.solves}` },
        { name: `Exact solves: `, value: `${content.exacts}` },
        { name: `Fastest time to solve: `, value: `${content.time} ms` },
        { name: `Largest streak: `, value: `${content.streak}` });

        // reply with just the embed and the option for the message to be ephemeral
        await interaction.reply({embeds: [embed], ephemeral: interaction.options.getBoolean('ephemeral')})
        .catch("error sending message");

        // create and return our error embed
        function getErrorEmbed() {
            const embed = new EmbedBuilder()
            .setTitle(`Error`)
            .setColor(0xFF0000)
            .addFields(
                { name: `You haven't played yet!`, value: `Solve a prompt in order to get your stats.` }
            );
            return embed;
        }
    }
}