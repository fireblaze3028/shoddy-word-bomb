const fs = require('fs');
const { binarySearchWord } = require("../utility/game-info.js");

module.exports = {
    updateUser(channelID, userID, exact, time, streak, word) {
        var newWord = false;
        var channelStats = this.getChannel(channelID);
        if (!channelStats.userData.has(userID)) {
            channelStats.userData.set(userID, {solves: 0, exacts: 0, time: undefined, streak: 0, uniques: 0});
        }
        var userStats = channelStats.userData.get(userID);
        userStats.solves++;
        if (exact) { userStats.exacts++; }
        if (time < userStats.time || userStats.time == undefined) { userStats.time = time; }
        if (streak > userStats.streak) { userStats.streak = streak; }

        const index = binarySearchWord(word, channelStats.wordsUsed, 0, channelStats.wordsUsed.length);
        if (channelStats.wordsUsed[index] != word) {
            newWord = true;
            channelStats.wordsUsed.splice(index, 0, word);
            // if old data still exists
            if (!userStats.uniques) userStats.uniques = 0;
            userStats.uniques++;
        }

        // convert back to array to write
        channelStats.userData = Array.from(channelStats.userData.entries());
        try {
            fs.writeFileSync('./stats/' + channelID + '.txt', JSON.stringify(channelStats));
        } catch (error) {
            let string = `${channelID}:\n${JSON.stringify(Array.from(channelStats.entries()))}`; // in case writing to file fails
            console.log(error);
            console.log(string);
        }
        return newWord;
    },
    getUser(channelID, userID) {
        var channelStats = this.getChannel(channelID).userData;
        if (!channelStats.has(userID)) {
            channelStats.set(userID, {solves: 0, exacts: 0, time: undefined, streak: 0});
        }
        return channelStats.get(userID);
    },
    getChannel(channelID) {
        if (!fs.existsSync('./stats/' + channelID + '.txt')) {
            return { userData: new Map(), wordsUsed: [] }
        }
        const data = JSON.parse(fs.readFileSync('./stats/' + channelID + '.txt'));
        if (data.userData) {
            // since userData is stored as a 2D array, we need to convert it back to a map
            data.userData = new Map(data.userData);
            return data;
        }
        // conversion from old data system to new
        return { userData: new Map(data), wordsUsed: [] }
    },
    deleteChannel(channelID) {
        // we don't delete stats for channel
        // in case they want to use it again
        fs.rmSync('./stats/' + channelID + '.txt');
        return;
    },
    getChannelFromServer(serverID) {
        var content = fs.readFileSync('./files/channels.txt').toString();
        var channels = content.split("\n");
        for (var line of channels) {
            line = line.split(",");
            if (line[1] == serverID) {
                return line[0].trim();
            }
        }
        return undefined;
    },
    switchChannels(oldchannelID, newChannelID, guildID) {
        // update channels.txt
        var content = fs.readFileSync('./files/channels.txt').toString();
        content = content.replace(oldchannelID, newChannelID);
        if (oldchannelID == undefined) {
            content += `\n${newChannelID},${guildID}`;
        }
        else {
            // rename the stats file
            fs.renameSync('./stats/' + oldchannelID + '.txt', './stats/' + newChannelID + '.txt');
        }
        fs.writeFileSync('./files/channels.txt', content);
    }
}