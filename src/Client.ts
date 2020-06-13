import { Connection } from 'ssh2';

import Text from './Text';
import Screen from './Screen';
import Highscore from './Highscore';
import { IUser } from './db/models/User';
import Record, { IRecord } from './db/models/Record';

function noop() {}

export default class Client {
    private text: Text | null = null;
    private screen: Screen | null = null;
    private cols: number = 80;
    private rows: number = 24;
    private term: string = 'ansi';
    private personalHighScore: Highscore | null = null;
    private globalHighScore: Highscore | null = null;

    constructor(
        public user: IUser,
        private conn: Connection,
        private updateGlobalHighscore: Function
    ) {
        this.listen();
    }

    private listen() {
        this.conn.once('session', (sessionAccept) => {
            sessionAccept()
                .once('pty', (ptyAccept: any, _: any, info: any) => {
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
                    this.text = new Text(
                        this.user.username,
                        this.screen,
                        this.reportScore.bind(this)
                    );
                    this.screen.append(this.text.box);

                    this.personalHighScore = new Highscore(
                        this.screen,
                        'Personal'
                    );
                    Record.find({ username: this.user.username })
                        .sort({ wpm: -1 })
                        .limit(10)
                        .then((items) => {
                            this.personalHighScore.setItems(items);
                        });
                    this.screen.append(this.personalHighScore.box);

                    this.globalHighScore = new Highscore(
                        this.screen,
                        'Global',
                        true
                    );
                    Record.find()
                        .sort({ wpm: -1 })
                        .limit(10)
                        .then((items) => {
                            this.setGlobalHighscore(items);
                        });
                    this.screen.append(this.globalHighScore.box);

                    this.screen.render();
                });
        });
    }

    private reportScore(wpm: number) {
        const record = new Record({
            username: this.user.username,
            wpm,
        });

        record.save();

        this.personalHighScore.considerItem(record);

        this.updateGlobalHighscore();
    }

    public sharedData(): SharedClientData {
        return {
            name: this.user.username,
            percentage: this.text.percentage(),
        };
    }

    public update(dataArray: SharedClientData[]) {}

    public render() {
        this.screen.render();
    }

    public setGlobalHighscore(items: IRecord[]) {
        this.globalHighScore.setItems(items);
    }
}
