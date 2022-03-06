import mongoose = require ('mongoose');

const { DB_URL } = require('../config');

class MongoConnection {

    constructor() {
        console.log(`Connecting Database on ${DB_URL}`);
        this.init();
    }

    init() {
        mongoose.connect(DB_URL);

        mongoose.connection.on('error', err => {
            console.log(err);
        });
    }
}

export { MongoConnection };