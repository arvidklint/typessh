import fs from 'fs';
import { Server, Connection } from 'ssh2';
import Game from './game';

const game = new Game();
new Server(
    {
        hostKeys: [fs.readFileSync('key')],
    },
    function (client: Connection): void {
        game.newClient(client);
        console.log('Client connected');
    }
).listen(9090, '127.0.0.1', function () {
    console.log('Listening on port ' + this.address().port);
});
