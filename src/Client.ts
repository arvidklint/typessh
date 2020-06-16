import { Connection } from 'ssh2';
import blessed from 'blessed';

import log from './log';
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
    private highscoreBox: blessed.Widgets.BoxElement;
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
                    stream.on('error', (e) => {
                        log.error(e);
                    });
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

                    this.highscoreBox = blessed.box({
                        left: 'center',
                        top: 15,
                        width: 44,
                    });
                    this.screen.append(this.highscoreBox);

                    this.personalHighScore = new Highscore(this.screen, {
                        parent: this.highscoreBox,
                        label: 'Personal',
                    });
                    Record.find({ username: this.user.username })
                        .sort({ wpm: -1 })
                        .limit(10)
                        .then((items) => {
                            this.personalHighScore.setItems(items);
                        });

                    blessed.box({
                        parent: this.highscoreBox,
                        left: 20,
                        top: 0,
                        width: 1,
                        type: 'line',
                        content: '\n|\n|\n|\n|\n|\n|\n|\n|\n|\n|\n|\n|\n',
                    });

                    this.globalHighScore = new Highscore(this.screen, {
                        parent: this.highscoreBox,
                        label: 'Global',
                        left: 21,
                        top: 0,
                        showName: true,
                    });
                    Record.find()
                        .sort({ wpm: -1 })
                        .limit(10)
                        .then((items) => {
                            this.setGlobalHighscore(items);
                        });

                    this.screen.render();
                });
        });
    }

    private async reportScore(wpm: number) {
        const record = new Record({
            username: this.user.username,
            wpm,
        });

        this.personalHighScore.considerItem(record);

        await record.save();

        this.updateGlobalHighscore();
    }

    public sharedData(): SharedClientData {
        return {
            name: this.user?.username || '',
            percentage: this.text?.percentage() || 0,
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
