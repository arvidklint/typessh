import blessed from 'blessed';
import Screen from './Screen';

const TEXT =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const MAX_ERRORS = 5;
const HORIZONTAL_MARGIN = 3;
const TEXT_MARGIN = 2;

export default class Text {
    public box: blessed.Widgets.BoxElement;
    private header: blessed.Widgets.BoxElement;
    private body: blessed.Widgets.BoxElement;
    private scoreBox: blessed.Widgets.BoxElement;
    private score: blessed.Widgets.BoxElement;
    private stringLines: string[] = [];
    private lines: blessed.Widgets.BoxElement[] = [];
    private currentLine: number = 0;
    private currentCol: number = 0;
    private errorString: string = '';
    private startTime: number = 0;

    constructor(public readonly id: string, private screen: Screen) {
        // Manually divide text into lines to fix line break bugs
        const maxLength = this.width - TEXT_MARGIN * 2 - MAX_ERRORS;

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
            left: HORIZONTAL_MARGIN,
            right: HORIZONTAL_MARGIN,
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
            left: TEXT_MARGIN,
            right: TEXT_MARGIN,
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

        this.scoreBox = blessed.box({
            parent: this.box,
            top: 2,
            left: 'center',
            width: 25,
            height: 6,
            align: 'center',
            valign: 'middle',
            border: 'line',
        });

        this.score = blessed.box({
            parent: this.scoreBox,
            top: 1,
            left: 0,
            right: 0,
            align: 'center',
            type: 'line',
            content: 'WPM: __',
        });

        blessed.box({
            parent: this.scoreBox,
            top: 3,
            left: 0,
            right: 0,
            align: 'center',
            content: 'Ctrl+R to restart',
            type: 'line',
        });

        this.listen();
    }

    private get started(): boolean {
        return this.startTime !== 0;
    }

    private get completed(): boolean {
        return (
            this.started &&
            this.currentLine === this.stringLines.length - 1 &&
            this.currentCol === this.stringLines[this.currentLine].length
        );
    }

    private get width(): number {
        return this.screen.info.cols - HORIZONTAL_MARGIN * 2;
    }

    private formatLine(rawContent: string, index: number): string {
        if (index < this.currentLine) {
            return `{green-bg}${rawContent}{/green-bg}`;
        }
        if (index > this.currentLine) {
            return rawContent;
        }
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
        this.stringLines.forEach((line, index) => {
            this.lines[index].setContent(this.formatLine(line, index));
        });
        const TITLE = '——[ TypeSSH ]';
        this.header.setContent(
            TITLE +
                `/ WPM: ${this.wpm()} /——`.padStart(
                    this.width - TITLE.length,
                    '—'
                )
        );
        this.score.setContent(`WPM: ${this.wpm()}`);
        if (this.completed) {
            this.scoreBox.show();
        } else {
            this.scoreBox.hide();
        }
        this.screen.render();
    }

    private restart(): void {
        this.currentLine = 0;
        this.startTime = 0;
        this.errorString = '';
        this.currentCol = 0;
        this.render();
    }

    private listen(): void {
        this.screen.screen.key(['C-r'], () => {
            this.restart();
        });

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
