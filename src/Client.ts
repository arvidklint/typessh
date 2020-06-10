import { Connection } from 'ssh2';

import Text from './Text';
import Screen from './Screen';
import Race from './Race';

function noop() {}

export default class Client {
    private text: Text | null = null;
    private race: Race;
    private cols: number = 80;
    private rows: number = 24;
    private term: string = 'ansi';

    constructor(
        public id: string,
        private conn: Connection,
        private screen: Screen
    ) {
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
                    this.text = new Text(this.id, this.screen);
                    this.screen.append(this.text.box);
                    this.race = new Race(this.screen);
                    this.screen.append(this.race.box);
                    console.log('shelling');
                    this.screen.render();
                });
        });
    }

    public sharedData(): SharedClientData {
        return {
            name: this.id.toString(),
            percentage: this.text.percentage(),
        };
    }

    public update(dataArray: SharedClientData[]) {
        this.race.update(dataArray);
    }

    public render() {
        this.screen.render();
    }
}
