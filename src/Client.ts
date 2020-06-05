import { Connection } from 'ssh2';

import Player from './Player';
import Screen from './Screen';

function noop() {}

export default class Client {
    private player: Player | null = null;
    private screen: Screen | null = null;
    private cols: number = 80;
    private rows: number = 24;
    private term: string = 'ansi';

    constructor(public id: number, private conn: Connection) {
        this.listen();
    }

    private listen() {
        this.conn.once('session', (sessionAccept) => {
            sessionAccept()
                .once('pty', (ptyAccept: any, _: any, info: any) => {
                    console.log('pty');
                    this.rows = info.rows || 24;
                    this.cols = info.cols || 80;
                    this.term = info.term || 'ansi';
                    ptyAccept();
                })
                .once('shell', (shellAccept: any) => {
                    const stream = shellAccept();
                    stream.rows = this.rows;
                    stream.columns = this.cols;
                    stream.isTTY = true;
                    stream.setRawMode = noop;
                    stream.on('error', noop);
                    this.screen = new Screen(stream, {
                        rows: this.rows,
                        cols: this.cols,
                        term: this.term,
                    });
                    this.player = new Player(stream, this.screen);
                    this.screen.append(this.player.widgets);
                    console.log('shelling');
                    this.screen.render();
                });
        });
    }
}
