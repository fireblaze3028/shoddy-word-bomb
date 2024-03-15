const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");


module.exports = {
    data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Gets information about commands and how to play.")
    .setDMPermission(true),

    async execute(interaction, client) {
        var embed = new EmbedBuilder()
        .setTitle("This is Shoddy Word Bomb, a bot inspired by BombParty and Word Bomb.")
        .setColor(0x12d198);
        var content = "In order to play, first set the channel you want to play the game in using **/set-channel**. "
        + "Once the channel is set, you can play! Type a word that will match with the given prompt in any position. "
        + "For example, if given a prompt like :regional_indicator_a::regional_indicator_s:, **assign**, **peas**, or **trespass** "
        + "would all be valid solutions to this prompt. An :asterisk: means any character can be placed there!"
        + "\n\nCommands:\n";
        for (key of client.commands.keys()) {
            content += `/${key} - ${client.commands.get(key).data.description}\n`;
        }
        embed.setDescription(content);

        try {
            interaction.reply({ embeds: [embed] })
        }
        catch (error) {
            console.log("error sending message");
        }
    }
}