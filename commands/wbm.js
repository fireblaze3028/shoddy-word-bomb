const emoji = require("../utility/emoji.js");
const database = require("../utility/database.js");
const { PermissionFlagsBits } = require("discord.js");


module.exports = {

    async execute(client, channel, words, templates, templateSolves) {
        // streak counter
        var currentStreak = 0;
        var streakOwner;

        var mContent = [];
        mContent[1] = [];

        // current word that we are using
        var currentWord;
        // current prompt
        var currentPrompt = "";
        // current message object
        var currentMessage = undefined;

        // variables to keep track after solves
        var solveOwners = [];
        var timeSent = 0;
        var timeSolved = 0;

        // to see if we have to match length or not
        var matchLength = true;

        // if the prompt mode is hard mode
        var hardMode = false;

        // people who use /solve and then solve the prompt
        var solveUsers = [];

        // checking if we have perms to view + send messages
        var perms = channel.guild.members.me?.permissionsIn(channel.id);
        if (!perms.has(PermissionFlagsBits.ViewChannel) || !perms.has(PermissionFlagsBits.SendMessages)) {
            console.log(`cannot send in channel ${channel.id} anymore, turning off`);
            return; // do not need to remove listeners since not created, just return
        }
        channel.send("Starting up!")
        mainGameLoop();

        client.on(channel.id, (m) => {
            // checking if we have perms to view + send messages while bot is running
            var perms = channel.guild.members.me?.permissionsIn(channel.id);
            if (!perms.has(PermissionFlagsBits.ViewChannel) || !perms.has(PermissionFlagsBits.SendMessages)) {
                console.log(`cannot send in channel ${channel.id} anymore, turning off`);
                client.removeAllListeners(channel.id);
                client.removeAllListeners(`${channel.id}-hard`);
                return;
            }

            if (solveOwners.length != 0) {
                if (checkPrompt(m.content.trim().toLowerCase(), m) && (m.createdTimestamp - timeSolved) <= 1000 && !solveOwners.includes(m.author.id)) {
                    mContent[1].push("\n" + m.author.username + " was **" + (m.createdTimestamp - timeSolved) + "** ms late...");
                    solveOwners.push(m.author.id);
                }
                return;
            }
            mContent[0] = "Solved by " + m.author.username + ", created from the word \"" + currentWord + "\"";

            if (checkPrompt(m.content.trim().toLowerCase(), m)) {
                timeSolved = m.createdTimestamp;
                solveOwners.push(m.author.id);
                console.log(timeSolved - timeSent);
                if (!solveUsers.includes(m.author.id)) {
                    var exact = checkExact(m);
                    updateStreak(m);
                    database.updateUser(channel.id, streakOwner.id, exact, timeSolved - timeSent, currentStreak);
                }
                else {
                    mContent[4] = `\n**${m.author.username}** used the solver this round.`;
                }

                m.reply(stitchMessage(mContent.flat())).then((message) => {
                    currentMessage = message;
                })
                .catch("error sending message");
                // set our timeout so no one else can solve this prompt
                setTimeout(() => {
                    if (solveOwners.length > 1) {
                        currentMessage.edit(stitchMessage(mContent.flat()))
                    }
                }, 1000);
                // start the loop again after three seconds
                setTimeout(() => {
                    mContent = [];
                    mContent[1] = [];
                    solveOwners = [];
                    solveUsers = [];
                    currentMessage = undefined;
                    mainGameLoop()
                }, 3000)
            }
        });

        // toggle hard mode once given signal
        client.on(`${channel.id}-hard`, (i) => {
            hardMode = !hardMode;
            i.reply(`Hard mode ${hardMode ? "enabled in this channel." : "disabled in this channel."}`)
            .catch("error sending message");
        });

        // add people who use /solve to a list
        client.on(`${channel.id}-solve`, (id) => {
            solveUsers.push(id);
        });

        function mainGameLoop() {
            matchLength = true;
            createPrompt();
            var solutionsCount = solves();
            if (solutionsCount < 150) {
                matchLength = false;
                solutionsCount = solves();
            }
            mainm = "Type a word containing: " + emoji.promptToEmoji(currentPrompt) + " (" + solves() + " solutions)";
            if (matchLength) {
                mainm += "\n\nMust be " + (currentWord.length) + " characters long!";
            }
            channel.send(mainm).then((message) => {
                timeSent = message.createdTimestamp;
            })
        
        }

        function createPrompt() {
            currentPrompt = "";
            matchLength = false;
        
            // get current word
            currentWord = words[Math.floor(Math.random() * words.length)];
        
            var currentTemplate = templates[Math.floor(Math.random() * templates.length)];
        
            while (currentWord.length < currentTemplate.length) {
                currentWord = words[Math.floor(Math.random() * words.length)];
            }
        
            var upperBound = currentWord.length - currentTemplate.length;
        
            var place = Math.floor(Math.random() * upperBound);
        
            if (hardMode) {
                var lowestSolves = 99999; // very bad code
                for (var i = 0; i < upperBound; i++) {
                    currentPrompt = "";
                    for (var j = i; j < i + currentTemplate.length; j++) {
                        if (currentTemplate.charAt(j - i) == '.') {
                            currentPrompt += currentWord.charAt(j);
                        }
                        else {
                            currentPrompt += '-';
                        }
                    }
                    currentSolves = solves();
                    if (lowestSolves > currentSolves) {
                        lowestSolves = currentSolves;
                        place = i;
                    }
                }
            }
            matchLength = true;
            currentPrompt = "";
            for (var i = place; i < place + currentTemplate.length; i++) {
                if (currentTemplate.charAt(i - place) == '.') {
                    currentPrompt += currentWord.charAt(i);
                }
                else {
                    currentPrompt += '-';
                }
            }
        
        }

        function solves() {
            if (matchLength) {
                return templateSolves[currentWord.length].get(currentPrompt);
            }
            var count = 0;
            for (var i = 0; i < templateSolves.length; i++) {
                if (templateSolves[i] == undefined || templateSolves[i].get(currentPrompt) == undefined) {
                    continue;
                }
                count += templateSolves[i].get(currentPrompt);
            }
            return count;
        }

        function checkPrompt(word, m) {
    
            for (var i = 0; i < (word.length - currentPrompt.length) + 1; i++) {
                for (var j = 0; j < currentPrompt.length; j++) {
        
                    if (word.charAt(i + j) != currentPrompt.charAt(j) && currentPrompt.charAt(j) != '-') {
                        break;
                    }
        
                    if (j == currentPrompt.length - 1) {
                        for (var k = 0; k < words.length; k++) {
                            if (word == words[k]) {
        
                                // if the length has to match
                                if (matchLength && solveOwners.length == 0) {
                                    if (word.length < currentWord.length) {
                                        m.reply("Your word must be " + (currentWord.length) + " characters long!\nYour word has **" + word.length + "** characters, go higher :arrow_up:")
                                        .catch("error sending message");
                                        return false;
                                    }
                                    if (word.length > currentWord.length) {
                                        m.reply("Your word must be " + (currentWord.length) + " characters long!\nYour word has **" + word.length + "** characters, go lower :arrow_down:")
                                        .catch("error sending message");
                                        return false;
                                    }
                                }
        
                                return true;
                            }
                        }
                        return false;
                    }
                }
            }
            return false;
        
        }

        function updateStreak(m) {

            if (currentStreak == 0) {
                currentStreak++;
                streakOwner = m.author;
                return;
            }
        
            if (streakOwner.id == m.author.id) {
                currentStreak++;
        
                if (currentStreak >= 3) {
                    mContent[2] = "\n" + streakOwner.username + " has a streak of " + emoji.numberToEmoji(currentStreak) + "!";
                }
            }
            else {
                if (currentStreak >= 3) {
                    mContent[2] = "\nStreak of " + emoji.numberToEmoji(currentStreak) + " by " + streakOwner.username + " was broken by " + m.author.username + "!";
                }
                currentStreak = 1;
                streakOwner = m.author;
            }
        }

        function checkExact(m) {
            if (m.content.trim().toLowerCase() == currentWord) {
                mContent[3] = "\n" + "**That is exact solve #" + (database.getUser(channel, m.author.id).exacts + 1) + "!**";
                return true;
            }
            return false;
        }

        function stitchMessage(m) {
            var c = "";
            for (x of m) {
                c += x;
            }
            return c;
        }

    }
}