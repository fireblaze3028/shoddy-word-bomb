const { SlashCommandBuilder } = require("discord.js");


module.exports = {
    data: new SlashCommandBuilder()
    .setName("check")
    .setDescription("Checks whether or not a word is valid.")
    .addStringOption(option => 
        option
        .setName("word")
        .setDescription("The word to check")
    )
    .addBooleanOption(option => 
        option
        .setName("ephemeral")
        .setDescription('Whether to make it visible to only you or not')
        .setRequired(false)
    ),
    needsWordData: true,
    async execute(interaction, client, words, templates, templateSolves) {
        // set our message to not include unless the word is found in dictionary, then change
        var message = `:red_square: "${interaction.options.getString("word")}" is not a valid word.`;
        for (var word of words) {
            if (word == interaction.options.getString("word")) {
                message = `:green_square: "${word}" is a valid word.`;
                break;
            }
        }
        interaction.reply({ content: message, ephemeral: interaction.options.getBoolean("ephemeral")});
    }
}