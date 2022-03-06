import { Document, Schema, model } from 'mongoose';

interface ISettings extends Document {
    alias: string;
    quoteChannel: string;
    scheduleHour: number;
    scheduleMinute: number;
    scheduleTz: string;
    scheduleActive: boolean;
}

const SettingsSchema = new Schema<ISettings>({
    alias: { type: String, required: false, unique: true },
    quoteChannel: { type: String, required: false, unique: true },
    scheduleHour: { type: Number, required: false, unique: true },
    scheduleMinute: { type: Number, required: false, unique: true },
    scheduleTz: { type: String, required: false, unique: true },
    scheduleActive: { type: Boolean, required: false, unique: true, default: true }
});

const Settings = model('Settings', SettingsSchema);

export { ISettings, Settings };