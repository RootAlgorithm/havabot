import { MongoConnection } from "./db/MongoConnection";
import { DiscordController } from "./discord/DiscordController";

const mongoose = new MongoConnection();

const discordController = new DiscordController();