const Discord = require('discord.js');
const schedule = require('node-schedule');
import { Channel, Client, Intents, Message, TextChannel, Permissions } from "discord.js";
import { Job, scheduleJob } from "node-schedule";
import { Paragraph, IParagraph } from "../models/Paragraph";
import { ISettings, Settings } from "../models/Settings";

const { DISCORD_TOKEN } = require('../config');

class DiscordController {
    client: Client;

    commandIdentifier: string;
    commandAlias: string;
    quoteJob: Job;
    settings: ISettings;

    constructor() {
        this.commandIdentifier = "!havabot";

        this.client = new Discord.Client({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
            ]
        });

        this.loadSettings().then(() => this.initClient());
    }

    initClient() {
        console.log("Initializing client!");

        if (!DISCORD_TOKEN || DISCORD_TOKEN === "" || DISCORD_TOKEN === null || DISCORD_TOKEN === undefined) {
            console.log("DISCORD_TOKEN not present");
            return;
        }

        if (this.settings) {
            this.commandAlias = this.settings.alias;
            this.setQuotesSchedule(this.settings.scheduleHour || 0, this.settings.scheduleMinute || 0, this.settings.scheduleTz || 'Etc/UTC');
        }

        this.client.on('ready', () => {
            console.log("Hávamál bot logged in");
            console.log(`Command alias: ${this.commandAlias}`);
        });

        this.client.on('messageCreate', async (message: Message) => {
            this.handleCommand(message);
        });

        this.client.login(DISCORD_TOKEN);
    }

    async loadSettings() {
        this.settings = await Settings.findOne({});
    }

    setQuotesSchedule(hour: number, minute: number, tz: string) {
        this.quoteJob = scheduleJob({ hour: hour, minute: minute, tz: tz }, () => {
            if (this.settings.scheduleActive) {
                this.pushRandomQuoteToChannel();
            }
        });
        console.log(`Job sceduled for ${hour}:${minute} ${tz}`);
    }

    handleCommand(message: Message) {
        let usedAlias: boolean = false;
        if (message.content.startsWith(this.commandAlias)) {
            usedAlias = true;
        }
        else if (!message.content.startsWith(this.commandIdentifier)) {
            return;
        }
        //Added my own discord id so I can help with debugging.
        if((message.author.id !== message.member.guild.ownerId) && (message.author.id !== '222814295317020673')) return;
        const args: string[] = usedAlias ? message.content.slice(this.commandAlias.length).trim().split(/ +/) : message.content.slice(this.commandIdentifier.length).trim().split(/ +/);
        switch (args[0]) {
            case "activate":
                this.activate(message, true);
                break;
            case "add":
                this.addQuote(message);
                break;
            case "alias":
                this.setAlias(message, args[1]);
                break;
            case "channel":
                this.setQuoteChannel(message, args[1]);
                break;
            case "deactivate":
                this.activate(message, false);
                break;
            case "get":
                this.getQuote(message, args[1])
                break;
            case "help":
                this.help(message);
                break;
            case "random":
                this.pushRandomQuoteToChannel();
                break;
            case "remove":
                this.removeQuote(message, args[1]);
                break;
            case "schedule":
                this.schedule(message);
                break;
            case "status":
                this.getStatus(message);
                break;
            case "info":
                message.reply("HávaBot is a quotes bot created by Talimere");
                break;
            default:
                message.reply("I didn't understand that...");
                break;
        }
    }

    async setAlias(message: Message, alias: string) {
        if (!alias || !alias.startsWith("!")) {
            message.reply("Usage: !havabot alias !<alias>");
            return;
        }
        if (!this.settings) {
            await Settings.create({
                alias: alias
            });
        }
        else {
            await Settings.findOneAndUpdate({}, {
                alias: alias
            });
        }
        this.settings = await Settings.findOne({});
        this.commandAlias = this.settings.alias;
        message.reply(`Command alias set to ${alias}`);
    }

    async setQuoteChannel(message: Message, channel: string) {
        if (!channel || !channel.startsWith("<#")) {
            message.reply("Usage !havabot channel <channel>");
            return;
        }
        if (!this.settings) {
            await Settings.create({
                quoteChannel: message.mentions.channels.first().id
            });
        }
        else {
            await Settings.findOneAndUpdate({}, {
                quoteChannel: message.mentions.channels.first().id
            });
        }
        this.settings = await Settings.findOne({});
        message.reply(`Quote channel set to ${channel}`);
    }

    async addQuote(message: Message) {
        const indexOfAdd: number = message.content.indexOf('add ');
        const quote: string = message.content.substring(indexOfAdd + 4);
        const numOfParagraphs: number = await Paragraph.countDocuments();
        await Paragraph.create({
            index: numOfParagraphs,
            paragraph: quote
        });
        message.reply(`Added quote #${numOfParagraphs + 1}`);
    }

    async getQuote(message: Message, index: string) {
        const intIndex: number = (Number.parseInt(index) || 0) - 1;
        const numOfParagraphs: number = await Paragraph.countDocuments();
        if ((intIndex < 0) || (intIndex >= numOfParagraphs)) {
            message.reply("Quote not found");
            return;
        }
        const quote: IParagraph = await Paragraph.findOne({
            index: intIndex
        });
        if (!quote) {
            message.reply("Quote not found");
            return;
        }
        message.reply(quote.paragraph);
    }

    randomIntInRange(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    async getRandomQuote(): Promise<IParagraph> {
        const numOfParagraphs: number = await Paragraph.countDocuments();
        return Paragraph.findOne({
            index: this.randomIntInRange(0, numOfParagraphs - 1)
        });
    }

    async pushRandomQuoteToChannel() {
        const paragraph: IParagraph = await this.getRandomQuote();
        if (!paragraph) return;
        if (!this.settings.quoteChannel) return;
        (this.client.channels.cache.get(this.settings.quoteChannel) as TextChannel).send(paragraph.paragraph);
    }

    async removeQuote(message: Message, index: string) {
        const numOfParagraphs: number = await Paragraph.countDocuments();
        const intIndex: number = Number.parseInt(index) || 0;
        if ((intIndex < 1) || (intIndex > numOfParagraphs)) {
            message.reply("Quote out of range");
            return;
        }
        await Paragraph.deleteOne({
            index: intIndex - 1
        });
        message.reply(`Quote #${index} has been removed`);
        this.updateIndexes(intIndex, numOfParagraphs);
    }

    async updateIndexes(index: number, numOfParagraphs: number) {
        for (let i = index; i < numOfParagraphs; i++) {
            await Paragraph.findOneAndUpdate({
                index: i
            }, {
                index: i - 1
            });
        }
    }

    async schedule(message: Message) {
        const indexOfSchedule: number = message.content.indexOf('schedule ');
        const timeString: string = message.content.substring(indexOfSchedule + 9);
        const timeAndTz: string[] = timeString.trim().split(/ +/);
        const hourAndMinute: string[] = timeAndTz[0].trim().split(/:/);
        const hour: number = Number.parseInt(hourAndMinute[0]) || 0;
        const minute: number = Number.parseInt(hourAndMinute[1]) || 0;
        const tz: string = timeAndTz[1] || 'Etc/UTC';

        if (!this.settings) {
            await Settings.create({
                scheduleHour: hour,
                scheduleMinute: minute,
                scheduleTz: tz
            });
        }
        else {
            await Settings.findOneAndUpdate({}, {
                scheduleHour: hour,
                scheduleMinute: minute,
                scheduleTz: tz
            });
        }
        this.settings = await Settings.findOne({});

        this.setQuotesSchedule(hour, minute, tz);
        message.reply(`Schedule updated to: ${hour}:${minute} ${tz}`);
    }

    async getStatus(message: Message) {
        if(!this.settings) {
            message.reply("HávaBot is not set up, please consult !havabot help");
            return;
        }
        if(!this.settings.scheduleActive || !this.settings.quoteChannel) {
            message.reply(`HávaBot is ${this.settings.scheduleActive ? 'active' : 'not active'} and channel is set to: ${this.settings.quoteChannel ? await this.client.channels.fetch(this.settings.quoteChannel) : 'None'}`);
            return;
        }
        message.reply(`HávaBot is sending a random quote to ${await this.client.channels.fetch(this.settings.quoteChannel)} every day at ${this.settings.scheduleHour || 0}:${this.settings.scheduleMinute || 0} ${this.settings.scheduleTz || 'Etc/UTC'}`);
    }

    async activate(message: Message, active: boolean) {
        if(!this.settings) {
            await Settings.create({
                scheduleActive: active
            });
        }
        else {
            await Settings.findOneAndUpdate({}, {
                scheduleActive: active
            });
        }
        this.settings = await Settings.findOne({});

        message.reply(`HávaBot is ${active ? 'active' : 'not active'}`);
    }

    help(message: Message) {
        message.reply(`Usage: !havabot <command> <arguments>
activate: activates HávaBot
add <quote>: adds a quote to the database
alias !<alias>: set a custom command alias for !havabot
channel <channel>: sets the channel HávaBot messages
deactivate: deactivates HávaBot
get <number>: gets a quote from the database
help: shows this message
random: pushes a random quote to the channel (used for testing)
remove <number>: removes a quote from the database
schedule <hh:mm timezone>: sets the time for the daily quote
status: displays HávaBot status
info: what is even HávaBot?`);
    }
}

export { DiscordController };