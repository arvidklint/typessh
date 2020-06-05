import { Connection } from 'ssh2';
import blessed from 'blessed';

function noop() {}

const TEXT =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

export default class Player {
    private screen: blessed.Widgets.Screen;
    private cols: number = 80;
    private rows: number = 24;
    private term: string = 'ansi';

    constructor(public readonly id: number, private client: Connection) {
        this.listen();
    }

    public render(): void {
        this.screen.render();
        this.screen.program.emit('resize');
    }

    private listen() {
        this.client.once('session', (sessionAccept) => {
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
                    console.log('shelling');
                    stream.name = 'stream name';
                    stream.rows = this.rows;
                    stream.columns = this.cols;
                    stream.isTTY = true;
                    stream.setRawMode = noop;
                    stream.on('error', noop);

                    this.screen = blessed.screen({
                        autoPadding: true,
                        smartCSR: true,
                        program: blessed.program({
                            input: stream,
                            output: stream,
                        }),
                        terminal: this.term,
                    });
                    this.screen.title = 'TypeSSH';
                    this.screen.program.disableMouse();

                    const box = blessed.box({
                        screen: this.screen,
                        height: 1,
                        top: 1,
                        left: 0,
                        width: '100%',
                        type: 'line',
                        ch: '=',
                    });
                    this.screen.append(box);

                    const textBox = blessed.box({
                        screen: this.screen,
                        shadow: true,
                        height: 1,
                        top: 0,
                        left: 0,
                        right: 0,
                        tags: true,
                        type: 'line',
                    });
                    this.screen.append(textBox);

                    let comingText = TEXT;
                    let userText = '';
                    let nextChar = comingText.charAt(0);
                    comingText = comingText.substring(1);
                    textBox.setContent(
                        `{blue-bg}${nextChar}{/blue-bg}${comingText}`
                    );
                    let index = 0;
                    this.screen.on('keypress', (key) => {
                        index++;
                        if (
                            index > this.cols / 2 &&
                            comingText.length > this.cols / 2
                        ) {
                            userText = userText.replace(
                                new RegExp('^{.+?}.{/.+?}'),
                                ''
                            );
                        }
                        const corr = nextChar === key;
                        const startTag = corr ? '{green-fg}' : '{red-fg}';
                        const endTag = corr ? '{/green-fg}' : '{/red-fg}';
                        userText = `${userText}${startTag}${nextChar}${endTag}`;
                        nextChar = comingText.charAt(0);
                        comingText = comingText.substring(1);
                        const newText = `${userText}{blue-bg}${nextChar}{/blue-bg}${comingText}`;
                        textBox.setContent(newText);
                        this.render();
                    });

                    this.screen.key(['escape'], () => {
                        stream.exit(0);
                        stream.end();
                    });

                    this.render();
                });
        });
    }
}
