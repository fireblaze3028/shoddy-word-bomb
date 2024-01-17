const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Invites the bot to your server."),
    async execute(interaction, client) {
        interaction.reply(`You can invite this bot to a server by following [this link.](https://discord.com/oauth2/authorize?client_id=1027757253996060702&scope=bot&permissions=3072)`);
    }
}