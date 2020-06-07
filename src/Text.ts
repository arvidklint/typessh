import blessed from 'blessed';
import Screen from './Screen';

const TEXT =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const MAX_ERRORS = 5;

export default class Text  {
    public box: blessed.Widgets.BoxElement;
    private stringLines: string[] = [];
    private lines: blessed.Widgets.BoxElement[] = [];
    private currentLine: number = 0;
    private currentCol: number = 0;
    private errorString: string = '';

    constructor(public readonly id: number, private screen: Screen) {
        // Manually divide text into lines to fix line break bugs
        const maxLength = this.screen.info.cols - 14;

        this.stringLines = TEXT.split(' ').reduce(
            (acc: Array<string>, word: string) => {
                const i = Math.max(0, acc.length - 1);
                if (!acc[i]) {
                    acc[i] = '';
                }
                if (acc[i].length + word.length > maxLength) {
                    acc[i] += ' ';
                    return [...acc, word];
                }

                if (acc[i].length === 0) acc[i] = word;
                else acc[i] = `${acc[i]} ${word}`;

                return acc;
            },
            []
        );

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
                align: 'left',
                type: 'line',
                tags: true,
                content: str,
            });
        });

        this.listen();
    }

    private createContent(): string {
        const rawContent = this.stringLines[this.currentLine];
        const done = `{green-bg}${rawContent.substring(
            0,
            this.currentCol
        )}{/green-bg}`;
        const next = `{blue-bg}${rawContent.charAt(this.currentCol)}{/blue-bg}`;
        const left = rawContent.substring(this.currentCol + 1);
        if (this.errorString.length !== 0) {
            return `${done}{red-bg}${this.errorString}{/red-bg}${next}${left}`;
        }
        if (this.currentCol === rawContent.length) {
            return `{green-bg}${rawContent}{/green-bg}`;
        }
        return `${done}${next}${left}`;
    }

    public render() {
        this.lines[this.currentLine].setContent(this.createContent());
        this.screen.render();
    }

    private listen() {
        this.render();
        this.screen.screen.on('keypress', (key, keyInfo) => {
            if (this.currentLine > this.stringLines.length - 1) return;

            if (keyInfo.name === 'backspace') {
                if (this.errorString.length !== 0) {
                    this.errorString = this.errorString.slice(0, -1);
                } else {
                    this.currentCol--;
                }
                this.render();
                return;
            }

            const nextChar = this.stringLines[this.currentLine].charAt(
                this.currentCol
            );
            const corr = nextChar === key;
            if (corr && this.errorString.length === 0) {
                this.currentCol++;
            } else {
                if (this.errorString.length < MAX_ERRORS) {
                    this.errorString += key;
                }
            }

            this.render();
            if (this.currentCol === this.stringLines[this.currentLine].length) {
                this.currentLine++;
                this.currentCol = 0;
                if (this.currentLine < this.stringLines.length) this.render();
            }
        });
    }

    public percentage(): number {
        let completed = 0;
        for (let i = 0; i < this.currentLine; i++) {
            completed += this.stringLines[i].length;
        }
        const total = this.currentCol + completed;
        return total / TEXT.length;
    }
}
