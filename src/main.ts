import fs from 'fs';
import { Server, Connection, AuthContext } from 'ssh2';
import blessed from 'blessed';

function noop() {}

new Server(
    {
        hostKeys: [fs.readFileSync('key')],
    },
    function (client: Connection): void {
        console.log('Client connected');

        client
            .on('authentication', function (ctx: AuthContext) {
                ctx.accept();
            })
            .on('ready', function () {
                console.log('Client "authenticated"');
                let term: string;
                let rows: number;
                let cols: number;
                client.once('session', function (sessionAccept) {
                    sessionAccept()
                        .once('pty', function (
                            ptyAccept: any,
                            _: any,
                            info: any
                        ) {
                            console.log('pty');
                            term = info.term;
                            rows = info.rows;
                            cols = info.cols;
                            ptyAccept();
                        })
                        .once('shell', function (shellAccept: any) {
                            const stream = shellAccept();
                            console.log('shelling');
                            stream.name = 'stream name';
                            stream.rows = rows || 24;
                            stream.columns = cols || 80;
                            stream.isTTY = true;
                            stream.setRawMode = noop;
                            stream.on('error', noop);

                            const screen = blessed.screen({
                                autoPadding: true,
                                smartCSR: true,
                                program: blessed.program({
                                    input: stream,
                                    output: stream,
                                }),
                                terminal: term || 'ansi',
                            });
                            screen.title = 'TypeSSH';

                            const box = blessed.box({
                                screen: screen,
                                height: 1,
                                top: 1,
                                left: 0,
                                width: '100%',
                                type: 'line',
                                ch: '=',
                            });
                            screen.append(box);

                            const textBox = blessed.box({
                                screen: screen,
                                shadow: true,
                                height: 1,
                                top: 0,
                                left: 0,
                                width: '100%',
                                tags: true,
                                type: 'line',
                            });
                            screen.append(textBox);

                            const TEXT =
                                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
                            let comingText = TEXT;
                            let userText = '';
                            let nextChar = comingText.charAt(0);
                            comingText = comingText.substring(1);
                            textBox.setContent(
                                `{blue-bg}${nextChar}{/blue-bg}${comingText}`
                            );
                            screen.on('keypress', function (key) {
                                const corr = nextChar === key;
                                const startTag = corr
                                    ? '{green-fg}'
                                    : '{red-fg}';
                                const endTag = corr
                                    ? '{/green-fg}'
                                    : '{/red-fg}';
                                userText = `${userText}${startTag}${nextChar}${endTag}`;
                                nextChar = comingText.charAt(0);
                                comingText = comingText.substring(1);
                                const newText = `${userText}{blue-bg}${nextChar}{/blue-bg}${comingText}`;
                                textBox.setContent(newText);
                                screen.render();
                            });

                            screen.key(['escape'], function () {
                                stream.exit(0);
                                stream.end();
                            });

                            screen.render();
                            screen.program.emit('resize');
                        });
                });
            })
            .on('end', function () {
                console.log('Client disconnected');
            })
            .on('error', function (error) {
                console.log(error);
            });
    }
).listen(9090, '127.0.0.1', function () {
    console.log('Listening on port ' + this.address().port);
});
