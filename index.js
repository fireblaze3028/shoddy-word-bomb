const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { getWords, getTemplates, getTemplateSolves } = require('./utility/game-info');

// require our file system
const fs = require('fs');

const wbm = require("./commands/wbm");

const { token, clientId, authorId } = require('./config.json');

// create our client with intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

// create our words variable to hold all words
const words = getWords();

// read our dictionary to our variable

const templates = getTemplates();
templates.pop();
const templateSolves = getTemplateSolves(templates, words);

// our channels that we are gonna use
var channels = fs.readFileSync('./files/channels.txt').toString().split("\n");
for (var i = 0; i < channels.length; i++) {
    channels[i] = channels[i].split(",")[0];
}

// handling slash commands
client.commands = new Collection();
var commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require('./commands/'+ file);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }
    else {
        console.log(file + " is not a command, skipping");
    }
}

// refreshing slash commands
const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(clientId),
            {body: commands}
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    }
    catch (error) {
        console.error(error);
    }
})();

// processing slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error("you are dumb and cringe and stupid");
        return;
    }

    try {
        if (command.needsWordData) {
            try {
                await command.execute(interaction, client, words, templates, templateSolves);
            } catch (e) {
                console.log(e);
                try {
                    client.users.fetch(authorId, false).then((user) => {
                        user.send("```\n" + e + "\n```");
                    })
                } catch (e2) {}
            }
        }
        else {
            try {
                await command.execute(interaction, client);
            } catch (e) {
                console.log(e);
                try {
                    client.users.fetch(authorId, false).then((user) => {
                        user.send("```\n" + e + "\n```");
                    })
                } catch (e2) {}
            }
        }
    }
    catch (error) {
        console.error(error);
    }
})

client.once('ready', client => {
    for (var channelID of channels) {
        if (channelID.startsWith("//")) continue; // dont start commented out channels
        var channel = client.channels.cache.get(channelID);
	if (!channel) return;
        wbm.execute(client, channel, words, templates, templateSolves);
    }
})

function stripEnd(value, index, array) {
    array[index] = array[index].substring(0, array[index].length - 1);
}

client.on('messageCreate', (message) => {
    if (message.author.bot) { return; }
    client.emit(message.channel.id, message);
})

client.on('warn', (message) => {
    client.users.fetch(authorId, false).then((user) => {
        user.send("```\n" + message + "\n```");
    })
})

client.on('error', (message) => {
    client.users.fetch(authorId, false).then((user) => {
        user.send("```\n" + message + "\n```");
    })
})

client.login(token);
