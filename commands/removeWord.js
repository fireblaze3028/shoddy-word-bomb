const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { authorId } = require("../config.json");
const { getWords, getTemplates, getTemplateSolves } = require('../utility/game-info');
const fs = require('fs');


module.exports = {
    data: new SlashCommandBuilder()
    .setName("remove-word")
    .setDescription("Remove a word from the global dictionary. Only the owner of this bot can run this command.")
    .addStringOption(option => 
        option
        .setName("word")
        .setDescription("The word to be removed.")
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
        var index = binarySearchWord(newWord, 0, words.length);
        if (words[index] != newWord) {
            await interaction.editReply(`:red_square: "${newWord}" is not in the dictionary.`);
            return;
        }
        words.splice(index, 1);
        fs.writeFile("./files/dictionary.txt", getWordString(), err => {
            if (err) {
                console.error(err);
            }
        });
        const templateSolvesCopy = getTemplateSolves(templates, words);
        for (var i = 0; i < templateSolves.length; i++) {
            templateSolves[i] = templateSolvesCopy[i];
        }

        await interaction.editReply(`:green_square: "${newWord}" has been removed from the dictionary.`);

        function binarySearchWord(word, low, high) {
            if (low >= high) return low;
            if (word > words[Math.floor((low + high) / 2)]) {
                return binarySearchWord(word, Math.ceil((low + high) / 2), high);
            }
            return binarySearchWord(word, low, Math.floor((low + high) / 2));
        }

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