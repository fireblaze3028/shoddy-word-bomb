const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const database = require('../utility/database.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Shows the leaderboard of this server.")
        .addStringOption(option => 
            option
            .setName("sort")
            .setDescription("How to sort the leaderboards")
            .addChoices(
                { name: 'Solutions', value: 'solves' },
                { name: 'Exact Solutions', value: 'exacts' },
                { name: 'Time Solved', value: 'time' },
                { name: 'Solve Streak', value: 'streak' },
                { name: 'Unique Words', value: 'uniques'}
            )
        )
        .addBooleanOption(option => 
            option
            .setName("ephemeral")
            .setDescription('Whether to make it visible to only you or not')
        )
        .setDMPermission(false),
    async execute(interaction, client) {
        try {
            // suffixes to use depending on how the user wants
            // to sort data
            var suffixes = new Map()
            .set('solves', 'solves')
            .set('exacts', 'exacts')
            .set('time', 'ms')
            .set('streak', 'solves')
            .set('uniques', 'unique words');

            // get channel and see if there are people in the leaderboard
            const data = database.getChannel(database.getChannelFromServer(interaction.guild.id));
            var found = false;
            var channel = data.userData;
            if (channel.size == 0) {
                try {
                    interaction.reply({ embeds: [getErrorEmbed()], ephemeral: interaction.options.getBoolean("ephemeral") });
                }
                catch (error) {
                    console.log("error sending message");
                }
            }
            var sort = interaction.options.getString("sort");
            if (!sort) {
                sort = 'solves' // our default option if none provided
            }
            var sorted = [];

            // sort our people
            channel.forEach((value, key, map) => {
                sorted.push({ user: key, val: (eval(`value.${sort}`) || 0) });
            })

            // sort our list
            sorted.sort((a,b) => b.val - a.val);
            if (sort == 'time') { sorted.reverse() } // time should be in descending
            var embed = new EmbedBuilder()
                .setTitle(`Leaderboard for ${interaction.guild.name} - ${sort}`)
                .setColor(0x12d198)
                .setFooter({ text: `Unique words used: ${data.wordsUsed.length}` });
            
            // create the string to send
            var content = '';
            for (var i = 0; (i < 3) && (sorted.length != 0); i++) {
                switch (i) {
                    case 0:
                        content += ":first_place:: "
                        break;
                    case 1:
                        content += ":second_place:: "
                        break;
                    case 2:
                        content += ":third_place:: "
                        break;
                }
                var curr = sorted.shift();
                content += `<@${curr.user}>: ${curr.val} ${suffixes.get(sort)}\n\n`;
            }
            for (var i = 4; (i <= 10) && sorted.length != 0; i++) {
                var curr = sorted.shift();
                if (curr.user == interaction.user.id) {
                    found = true;
                    content += `**${i}**: <@${curr.user}>: ${curr.val} ${suffixes.get(sort)}\n`;
                }
                else {
                    content += `${i}: <@${curr.user}>: ${curr.val} ${suffixes.get(sort)}\n`;
                }
            }
            // maybe limit lb to 10 users and show user place if they are past 10th place
            for (var i = 11; (sorted.length != 0) && (!found); i++) {
                var curr = sorted.shift();
                if (curr.user == interaction.user.id) {
                    found = true;
                    content += `\n**${i}**: <@${curr.user}>: ${curr.val} ${suffixes.get(sort)}\n`;
                }
            }
            

            embed.setDescription(content);

            interaction.reply({ embeds: [embed], ephemeral: interaction.options.getBoolean('ephemeral') })
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
        } catch (error) {
            console.log(error);
        }
    }
}