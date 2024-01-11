const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName("solve")
    .setDescription("Find solves for a particular prompt.")
    .addStringOption(option => 
        option
        .setName("regex")
        .setDescription("The regex to filter words")
        .setRequired(true))
    .addBooleanOption(option => 
        option
        .setName("ephemeral")
        .setDescription('Whether to make it visible to only you or not')
        .setRequired(false)
    )
    .setDMPermission(true),
    needsWordData: true,
    async execute(interaction, client, words, templates, templateSolves) {
        var finalString = '';
        try {
            var matchingWords = [];
            for (var i = 0; i < words.length; i++) {
                if (words[i].match(new RegExp(interaction.options.getString("regex")))) {
                    matchingWords.push(words[i]);
                }
            }
            interaction.reply({ content: `Your regex has ${matchingWords.length} solves`, ephemeral: interaction.options.getBoolean("ephemeral")});
        }
        catch (e) {
            console.log(e);
            interaction.reply({ content: "Your regex gave an error. Please try again.", ephemeral: interaction.options.getBoolean("ephemeral")});
        }
    }
}