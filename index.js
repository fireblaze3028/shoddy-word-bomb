const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');

// require our file system
const fs = require('fs');

const wbm = require("./commands/wbm");

const { token, clientId } = require('./config.json');

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
const words = fs.readFileSync('./files/dictionary.txt').toString().split("\n");
words.forEach(stripEnd);

// read our dictionary to our variable

const templates = fs.readFileSync('./files/templates.txt').toString().split("\n");
templates.forEach(stripEnd);
const templateSolves = new Array();
for (var i = 0; i < templates.length; i++) {
    // every solve for this specific template

    // getting every solve for this template
    for (var j = 0; j < words.length; j++) {
        var solvesDone = new Array();
        if (words[j].length < templates[i].length) {
            continue;
        }
        // for every position that the template can fit into the word
        for (var k = 0; k <= words[j].length - templates[i].length; k++) {
            // for every char in the template
            var currentPrompt = "";
            for (var l = k; l < k + templates[i].length; l++) {
                if (templates[i].charAt(l - k) == '.') {
                    currentPrompt += words[j].charAt(l);
                }
                else {
                    currentPrompt += '-';
                }
            }

            // if we already have a solve for this in our word, discount it
            if (!solvesDone.includes(currentPrompt)) {
                solvesDone[solvesDone.length] = currentPrompt;

                if (templateSolves[words[j].length] == undefined) {
                    templateSolves[words[j].length] = new Map();
                }
                if (templateSolves[words[j].length].get(currentPrompt)== undefined) {
                    templateSolves[words[j].length].set(currentPrompt, 1);
                }
                else {
                    templateSolves[words[j].length].set(currentPrompt, templateSolves[words[j].length].get(currentPrompt) + 1);
                }
            }
        }
    }
}

// our channels that we are gonna use
var channels = fs.readFileSync('./files/channels.txt').toString().split("\n");
channels.forEach(stripEnd);
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
        console.log("balls.");
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
        // scuffed way to pass stuff to only set-channel, needed to create a new instance
        if (interaction.commandName == "set-channel") {
            await command.execute(interaction, client, words, templates, templateSolves);
        }
        else {
            await command.execute(interaction, client);
        }
    }
    catch (error) {
        console.error(error);
    }
})

client.once('ready', client => {
    for (var channelID of channels) {
        var channel = client.channels.cache.get(channelID);
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

client.login(token);
