import mongoose from 'mongoose';
import log from '../log';

mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    log.info('Database connected');
});
