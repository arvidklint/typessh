import blessed from 'blessed';
import Screen from './Screen';
import words from './words';

const MAX_ERRORS = 5;
const HORIZONTAL_MARGIN = 3;
const TEXT_MARGIN = 2;

function rword() {
    return words[Math.floor(Math.random() * words.length)];
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

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
    private lastCompleted: boolean = false;
    private text: string = '';
    private maxLineWidth: number;

    constructor(
        private readonly username: string,
        private screen: Screen,
        private reportScore: Function
    ) {
        const bodyWidth = clamp(this.width - TEXT_MARGIN * 2, 30, 70);
        this.maxLineWidth = bodyWidth - MAX_ERRORS - 2;

        this.stringLines = this.createText();

        this.box = blessed.box({
            screen: this.screen.screen,
            top: 1,
            height: 10,
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
            top: 3,
            left: TEXT_MARGIN,
            right: TEXT_MARGIN,
            height: this.stringLines.length,
        });

        // footer
        blessed.box({
            parent: this.box,
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            type: 'line',
            content: ''.padEnd(this.width, '—'),
        });

        this.lines = this.stringLines.map((str, index) => {
            return blessed.box({
                parent: this.body,
                top: index,
                left: 'center',
                right: 0,
                align: 'left',
                width: bodyWidth,
                type: 'line',
                tags: true,
                content: str,
            });
        });

        this.scoreBox = blessed.box({
            parent: this.box,
            top: 1,
            left: 'center',
            width: 25,
            height: 8,
            align: 'center',
            valign: 'middle',
            border: 'line',
        });

        this.score = blessed.box({
            parent: this.scoreBox,
            top: 2,
            left: 0,
            right: 0,
            align: 'center',
            type: 'line',
            content: 'WPM: __',
        });

        blessed.box({
            parent: this.scoreBox,
            top: 5,
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
        const wpm = this.wpm();
        const wpmTitleString = ` WPM: ${wpm} `.padEnd(10, ' ');
        const TITLE = `——[${wpmTitleString}]`;
        this.header.setContent(
            TITLE +
                `/ ${this.username} /——`.padStart(
                    this.width - TITLE.length,
                    '—'
                )
        );
        if (this.completed && !this.lastCompleted) this.reportScore(wpm);
        this.lastCompleted = this.completed;
        this.score.setContent(`WPM: ${wpm}`);
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
        this.lastCompleted = false;
        this.stringLines = this.createText();
        this.render();
    }

    private listen(): void {
        this.screen.screen.key(['C-r'], () => {
            this.restart();
        });

        this.render();
        this.screen.screen.on('keypress', (key, keyInfo) => {
            if (!/[a-zA-Z0-9\ \']/.test(key) && keyInfo.name !== 'backspace') {
                return;
            }

            if (!this.started) this.startTime = Date.now();

            if (this.currentLine > this.stringLines.length - 1) return;

            if (keyInfo.name === 'backspace') {
                if (this.errorString.length !== 0) {
                    this.errorString = this.errorString.slice(0, -1);
                } else {
                    this.currentCol = Math.max(this.currentCol - 1, 0);
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
        return total / this.text.length;
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

    private createLine(): string {
        let text = rword();
        let word = rword();
        do {
            text = `${text} ${word}`;
            word = rword();
        } while (`${text} ${word}`.length < this.maxLineWidth);
        return `${text} `;
    }

    private createText(): string[] {
        const lines = [];
        for (let i = 0; i < 4; i++) {
            lines.push(this.createLine());
        }
        lines[lines.length - 1] = lines[lines.length - 1].trim();
        return lines;
    }
}
