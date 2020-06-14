import path from 'path';
import logger from 'simple-node-logger';

const log = logger.createSimpleLogger({
    logFilePath: path.resolve(__dirname, '../log/main.log'),
    timestampFormat: 'YYYY-MM-DD HH:mm:ss'
});

export default log;
