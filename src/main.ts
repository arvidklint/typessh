import fs from 'fs';
import { Server, Connection } from 'ssh2';
import Game from './Game';

const game = new Game();
new Server(
    {
        hostKeys: [fs.readFileSync(process.env.KEY_PATH)],
    },
    function (client: Connection): void {
        game.newClient(client);
        console.log('Client connected');
    }
).listen(+process.env.PORT, process.env.HOST, function () {
    console.log('Listening on port ' + this.address().port);
});
