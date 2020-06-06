import blessed from 'blessed';
import Screen from './Screen';
function noop() {}

const TEXT =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export default class Player {
    public box: blessed.Widgets.BoxElement;
    private stringLines: string[] = [];
    private lines: blessed.Widgets.BoxElement[] = [];
    private comingText: string = TEXT;
    private currentLine: number = 0;

    constructor(public readonly id: number, private screen: Screen) {
        // Manually divide text into lines to fix line break bugs
        const maxLength = this.screen.info.cols - 14;
        this.stringLines = TEXT.split(' ').reduce((acc, word) => {
            const i = acc.length - 1;
            if (!acc[i]) {
                acc[i] = '';
            }
            if (acc[i].length + word.length > maxLength) {
                return [...acc, word];
            }
            acc[i] = `${acc[i]} ${word}`;
            return acc;
        }, []);

        this.box = blessed.box({
            screen: this.screen.screen,
            shadow: true,
            top: 5,
            left: 5,
            right: 5,
        });

        this.lines = this.stringLines.map((str, index) => {
            return blessed.box({
                parent: this.box,
                top: index,
                left: 0,
                right: 0,
                align: 'center',
                type: 'line',
                tags: true,
                content: str,
            });
        });

        this.listen();
    }

    private listen() {
        let userText = '';
        this.comingText = this.stringLines[this.currentLine];
        let nextChar = this.comingText.charAt(0);
        this.comingText = this.comingText.substring(1);
        this.lines[this.currentLine].setContent(
            `{blue-bg}${nextChar}{/blue-bg}${this.comingText}`
        );
        this.screen.screen.on('keypress', (key) => {
            if (this.currentLine > this.stringLines.length - 1) return;
            const corr = nextChar === key;
            const startTag = corr ? '{green-fg}' : '{red-fg}';
            const endTag = corr ? '{/green-fg}' : '{/red-fg}';
            userText = `${userText}${startTag}${nextChar}${endTag}`;

            if (this.comingText.length === 0) {
                this.lines[this.currentLine].setContent(userText);
                this.currentLine++;
                userText = '';
                this.comingText = this.stringLines[this.currentLine];
            } else {
                nextChar = this.comingText.charAt(0);
                this.comingText = this.comingText.substring(1);
                const newText = `${userText}{blue-bg}${nextChar}{/blue-bg}${this.comingText}`;
                this.lines[this.currentLine].setContent(newText);
            }

            this.screen.render();
        });
    }

    public percentage(): number {
        let completed = 0;
        for (let i = 0; i < this.currentLine; i++) {
            completed += this.stringLines[i].length;
        }
        const total = this.comingText.length + completed;
        return 1 - total / TEXT.length;
    }
}
