const database = require('../utility/database.js');
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
    .addStringOption(option => 
        option
        .setName("sort")
        .setDescription("How to sort the data")
        .addChoices(
            { name: 'Length', value: 'length' },
            { name: 'Alphabetical', value: 'alphabetical' }
        )
    )
    .addBooleanOption(option =>
        option
        .setName("reverse")
        .setDescription("Reverses the order to sort the results")
        .setRequired(false)
    )
    .addBooleanOption(option => 
        option
        .setName("ephemeral")
        .setDescription('Whether to make it visible to only you or not')
        .setRequired(false)
    )
    .setDMPermission(true),
    needsWordData: true,
    async execute(interaction, client, words, templates, templateSolves) {
        // the final string we will use to send the message
        var finalString = '';
        // whether to make the message visible to everyone or not, by default it isnt
        var ephemeral = interaction.options.getBoolean("ephemeral");
        try {
            // all of our matching words
            var matchingWords = [];
            for (var i = 0; i < words.length; i++) {
                // see if the query returns anything, then add to list
                var query = words[i].match(new RegExp(interaction.options.getString("regex")));
                if (query) {
                    boldedWord = words[i].substring(0, query.index) + "**" + words[i].substring(query.index, query.index + query[0].length) + "**" + words[i].substring(query.index + query[0].length, words[i].length + 1);
                    matchingWords.push(boldedWord);
                }
            }
            // sort by length if user wants to
            if (interaction.options.getString("sort") == "length") {
                matchingWords.sort((a, b) => a.length - b.length);
            }
            if (interaction.options.getBoolean("reverse")) {
                matchingWords.reverse();
            }
            finalString += `Your regex has ${matchingWords.length} solutions\n`;
            // if there are words to show, for loop shows a word if there are no solutions
            if (matchingWords.length != 0) {
                for (var i = 0; i < Math.min(5, matchingWords.length + 1); i++) {
                    finalString += `\n${matchingWords.shift()}`;
                }
            }
            try {
                interaction.reply({ content: finalString, ephemeral: ephemeral})
            }
            catch (error) {
                console.log("error sending message");
            }
            client.emit(`${database.getChannelFromServer(interaction.guild.id)}-solve`, interaction.user.id);
        }
        catch (e) {
            console.log(e);
            try {
                interaction.reply({ content: "Your regex gave an error. Please try again.", ephemeral: ephemeral})
            }
            catch (error) {
                console.log("error sending message");
            }
        }
    }
}