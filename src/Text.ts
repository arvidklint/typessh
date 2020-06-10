import blessed from 'blessed';
import Screen from './Screen';

const TEXT =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const MAX_ERRORS = 5;
const HORIZONTAL_PADDING = 3;
const TEXT_PADDING = 2;

export default class Text {
    public box: blessed.Widgets.BoxElement;
    private header: blessed.Widgets.BoxElement;
    private body: blessed.Widgets.BoxElement;
    private stringLines: string[] = [];
    private lines: blessed.Widgets.BoxElement[] = [];
    private currentLine: number = 0;
    private currentCol: number = 0;
    private errorString: string = '';
    private startTime: number = 0;

    constructor(public readonly id: string, private screen: Screen) {
        // Manually divide text into lines to fix line break bugs
        const maxLength = this.width - TEXT_PADDING * 2 - MAX_ERRORS;

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
            top: 5,
            left: HORIZONTAL_PADDING,
            right: HORIZONTAL_PADDING,
        });

        this.header = blessed.box({
            parent: this.box,
            top: 0,
            left: 0,
            right: 0,
            type: 'line',
        });

        this.body = blessed.box({
            parent: this.box,
            top: 2,
            left: TEXT_PADDING,
            right: TEXT_PADDING,
            height: this.stringLines.length,
        });

        this.lines = this.stringLines.map((str, index) => {
            return blessed.box({
                parent: this.body,
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

    private get started(): boolean {
        return this.startTime !== 0;
    }

    private get width(): number {
        return this.screen.info.cols - HORIZONTAL_PADDING * 2;
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

    private render(): void {
        this.lines[this.currentLine].setContent(this.createContent());
        const TITLE = '——[ TypeSSH ]';
        this.header.setContent(
            TITLE +
                `/ WPM: ${this.wpm()} /——`.padStart(
                    this.width - TITLE.length,
                    '—'
                )
        );
        this.screen.render();
    }

    private listen(): void {
        this.render();
        this.screen.screen.on('keypress', (key, keyInfo) => {
            if (!this.started) this.startTime = Date.now();

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

    private wpm(): number {
        if (!this.started) return 0;

        const deltaTime = Date.now() - this.startTime;
        let wordCount = 0;
        for (let i = 0; i < this.currentLine; i++) {
            wordCount += this.stringLines[i].split(' ').length;
        }
        wordCount +=
            this.stringLines[this.currentLine]
                .substring(0, this.currentCol)
                .split(' ').length - 1;
        return Math.round(((wordCount * 1000) / deltaTime) * 60);
    }
}
