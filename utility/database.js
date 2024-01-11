const fs = require('fs');

module.exports = {
    updateUser(channelID, userID, exact, time, streak) {
        var channelStats = this.getChannel(channelID);
        if (!channelStats.has(userID)) {
            channelStats.set(userID, {solves: 0, exacts: 0, time: undefined, streak: 0});
        }
        var userStats = channelStats.get(userID);
        userStats.solves++;
        if (exact) { userStats.exacts++; }
        if (time < userStats.time || userStats.time == undefined) { userStats.time = time; }
        if (streak > userStats.streak) { userStats.streak = streak; }

        fs.writeFileSync('./stats/' + channelID + '.txt', JSON.stringify(Array.from(channelStats.entries())));
    },
    getUser(channelID, userID) {
        var channelStats = this.getChannel(channelID);
        if (!channelStats.has(userID)) {
            channelStats.set(userID, {solves: 0, exacts: 0, time: undefined, streak: 0});
        }
        return channelStats.get(userID);
    },
    getChannel(channelID) {
        if (!fs.existsSync('./stats/' + channelID + '.txt')) {
            return new Map();
        }
        return new Map(JSON.parse(fs.readFileSync('./stats/' + channelID + '.txt')));
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