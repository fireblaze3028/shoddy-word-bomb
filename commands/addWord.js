const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { authorId } = require("../config.json");
const { getWords, getTemplates, getTemplateSolves, binarySearchWord } = require('../utility/game-info');
const fs = require('fs');


module.exports = {
    data: new SlashCommandBuilder()
    .setName("add-word")
    .setDescription("Adds a word to the global dictionary. Only the owner of this bot can run this command.")
    .addStringOption(option => 
        option
        .setName("word")
        .setDescription("The word to be added.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    needsWordData: true,
    async execute(interaction, client, words, templates, templateSolves) {
        await interaction.deferReply();
        const newWord = interaction.options.getString("word").toLowerCase();
        if (interaction.user.id != authorId) {
            await interaction.editReply({ content: `:red_square: You cannot use this command unless you are the owner of the bot.`, ephemeral: true });
            return;
        }
        if (newWord.match(/[^a-z]/)) {
            await interaction.editReply(`:red_square: "${newWord}" has non-alphanumeric characters.`);
            return;
        }
        if (words[binarySearchWord(newWord, 0, words.length)] == newWord) {
            await interaction.editReply(`:red_square: "${newWord}" is already in the dictionary.`);
            return;
        }

        console.log(templateSolves[13].get("ary"));
        words.splice(binarySearchWord(newWord, words, 0, words.length), 0, newWord);
        fs.writeFile("./files/dictionary.txt", getWordString(), err => {
            if (err) {
                console.error(err);
            }
        });
        const templateSolvesCopy = getTemplateSolves(templates, words);
        for (var i = 0; i < templateSolvesCopy.length; i++) {
            templateSolves[i] = templateSolvesCopy[i];
        }
        console.log(templateSolves[13].get("ary"));
        await interaction.editReply(`:green_square: "${newWord}" has been added to the dictionary.`);

        function getWordString() {
            var s = "";
            for (var word of words) {
                s += word + '\n';
            }
            s = s.trimEnd();
            return s;
        }
    }
}