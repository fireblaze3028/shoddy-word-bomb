const emoji = require("../utility/emoji.js");
const database = require("../utility/database.js");
const { PermissionFlagsBits } = require("discord.js");
const { binarySearchWord } = require("../utility/game-info.js");


module.exports = {

    async execute(client, channel, words, templates, templateSolves) {
        // streak counter
        var currentStreak = 0;
        var streakOwner;

        var mContent = [];
        mContent[1] = [];

        // current word that we are using
        var currentWord;
        // current letter we use to find prompts with letter requirements
        var currentLetter;
        var currentLetterCount;
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
        var matchLetter = true;

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
                    mContent[1].push("\n" + m.author.username + " was **" + (m.createdTimestamp - timeSolved) + "**ms late" + ((m.createdTimestamp - timeSolved) > 0 ? "..." : " get ping diffed lmao"));
                    solveOwners.push(m.author.id);
                }
                return;
            }
            mContent[0] = "Solved by " + m.author.username + ", created from the word \"" + currentWord + "\"";

            if (checkPrompt(m.content.trim().toLowerCase(), m)) {
                timeSolved = m.createdTimestamp;
                solveOwners.push(m.author.id);
                //console.log(timeSolved - timeSent);
                if (timeSolved - timeSent < 1500) {
                    mContent[5] = "\n**" + m.author.username + " solved in " + (timeSolved - timeSent) + " ms!**";
                }
                if (!solveUsers.includes(m.author.id)) {
                    var exact = checkExact(m);
                    updateStreak(m);
                    if (database.updateUser(channel.id, streakOwner.id, exact, timeSolved - timeSent, currentStreak, m.content.trim().toLowerCase())) {
                        mContent[6] = `\n\nThat's the **first** time "${m.content.trim().toLowerCase()}" has been used in a solve!`;
                    };
                }
                else {
                    mContent[4] = `\n**${m.author.username}** used the solver this round.`;
                    if (streakOwner.id === m.author.id) {
                        streakOwner = null;
                        currentStreak = 0;
                    }
                }

                m.reply(stitchMessage(mContent.flat())).then((message) => {
                    currentMessage = message;
                })
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
        });

        // add people who use /solve to a list
        client.on(`${channel.id}-solve`, (id) => {
            solveUsers.push(id);
        });

        //resend prompt when given signal
        client.on(`${channel.id}-prompt`, (i) => {
            i.reply(mainm);
        })

        function mainGameLoop() {
            createPrompt();
            var i = hardMode ? 3 : 2;
            var bias = Math.random() > 0.5; // add bias to favour to match length or letter randomly
            // this while loop tries all possibilites while trying to keep solutionsCount greater than 150:
            // matching length and matching letter count (hard mode only)
            // matching letter count
            // matching length
            var solutionsCount = 0;
            while (solutionsCount < (hardMode ? 150 : 500) && (matchLength || matchLetter)) {
                matchLength = (i & (1 + bias)) > 0;
                matchLetter = (i & (2 - bias)) > 0;
                i--;
                solutionsCount = solves();
            }
            mainm = "Type a word containing: " + emoji.promptToEmoji(currentPrompt) + "  (" + solves() + " solutions)\n";
            if (matchLength) {
                mainm += "\nMust be **" + (emoji.numberToEmoji(currentWord.length)) + "** characters long!";
            }
            if (matchLetter) {
                mainm += `\nMust contain **${currentLetterCount} ${emoji.promptToEmoji(currentLetter)}**` + ((currentLetterCount == 1) ? "!" : `s!`);
            }
            channel.send(mainm.trim()).then((message) => {  
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

            // we have two methods to get the letter constraint:
            // picking a random letter that the word has (to get some random letters)
            // and picking from the 5 most common letters in english (to possibly have a constraint with 0 letters)
            const letterMethod = Math.floor(Math.random() * 2);

            if (letterMethod) {
                const letters = new Map();
                for (var c of currentWord) {
                    if (!letters.has(c)) letters.set(c, 0);
                    letters.set(c, letters.get(c) + 1);
                }
                const lettersArray = Array.from(letters);

                currentLetter = lettersArray[Math.floor(Math.random() * lettersArray.length)];
                currentLetterCount = currentLetter[1];
                currentLetter = currentLetter[0];
                return;
            }
            

            // get random letter to use
            const letters = ["e", "s", "i", "a", "r"];
            currentLetter = letters[Math.floor(Math.random() * letters.length)];

            currentLetterCount = 0;

            for (var c of currentWord) {
                currentLetterCount += (c == currentLetter) ? 1 : 0;
            }
        }

        function solves() {
            var count = 0;
            var letterCount;
            if (matchLetter && matchLength) {
                for (const word of templateSolves.get(currentPrompt).get(currentWord.length)) {
                    letterCount = 0;
                    for (const c of word) {
                        letterCount += (c == currentLetter) ? 1 : 0;
                    } 

                    count += (letterCount == currentLetterCount) ? 1 : 0;
                }
            }
            else if (!matchLetter && matchLength) {
                count = templateSolves.get(currentPrompt).get(currentWord.length).length;
            }
            else if (matchLetter && !matchLength) {
                for (const c of templateSolves.get(currentPrompt)) {
                    for (const word of c[1]) {
                        letterCount = 0;
                        for (const ch of word) {
                            letterCount += (ch == currentLetter) ? 1 : 0;
                        } 
    
                        count += (letterCount == currentLetterCount) ? 1 : 0;
                    }
                }
            }
            else if (!matchLength && !matchLetter) {
                for (const c of templateSolves.get(currentPrompt)) {
                    count += c[1].length;
                }
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
                        if (words[binarySearchWord(word, words, 0, words.length)] != word) return false;
                        // if the length has to match
                        if (matchLength && solveOwners.length == 0) {
                            if (word.length < currentWord.length) {
                                m.reply("Your word must be " + emoji.numberToEmoji(currentWord.length) + " characters long!\nYour word has **" + emoji.numberToEmoji(word.length) + "** characters, go higher :arrow_up:")
                                return false;
                            }
                            if (word.length > currentWord.length) {
                                m.reply("Your word must be " + emoji.numberToEmoji(currentWord.length) + " characters long!\nYour word has **" + emoji.numberToEmoji(word.length) + "** characters, go lower :arrow_down:")
                                return false;
                            }
                        }

                        var letterCount = 0;
                        for (var c of word) {
                            letterCount += (c == currentLetter) ? 1 : 0;
                        }

                        if (matchLetter && solveOwners.length == 0) {
                            if (letterCount < currentLetterCount) {
                                m.reply("Your word must contain " + (currentLetterCount) + " " + emoji.promptToEmoji(currentLetter) + ((currentLetterCount == 1) ? "" : "s") + "!\nYour word has **" + (letterCount) + "** " + emoji.promptToEmoji(currentLetter) + ((letterCount == 1) ? "" : "s") + ", go higher :arrow_up:")
                                return false;
                            }
                            if (letterCount > currentLetterCount) {
                                m.reply("Your word must contain " + (currentLetterCount) + " " + emoji.promptToEmoji(currentLetter) + ((currentLetterCount == 1) ? "" : "s") + "!\nYour word has **" + (letterCount) + "** " + emoji.promptToEmoji(currentLetter) + ((letterCount == 1) ? "" : "s") + ", go lower :arrow_down:")
                                return false;
                            }
                        }

                        // return true if the user doesn't have to match length or if the word lengths are equal
                        // this is better than just returning true since it will only show late users if they
                        // correctly solved it instead of just finding a correct word for a prompt with a specific amount of characters
                        return ((!matchLength) || word.length == currentWord.length) && ((!matchLetter) || letterCount == currentLetterCount);
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