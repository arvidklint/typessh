import blessed from 'blessed';
import Screen from './Screen';
function noop() {}

const TEXT =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export default class Player {
    public box: blessed.Widgets.BoxElement;
    private comingText: string = TEXT;

    constructor(public readonly id: number, private screen: Screen) {
        this.box = blessed.box({
            screen: this.screen.screen,
            shadow: true,
            height: 1,
            top: 0,
            left: 0,
            right: 0,
            tags: true,
            type: 'line',
        });

        this.listen();
    }

    private listen() {
        let userText = '';
        let nextChar = this.comingText.charAt(0);
        this.comingText = this.comingText.substring(1);
        this.box.setContent(`{blue-bg}${nextChar}{/blue-bg}${this.comingText}`);
        let index = 0;
        this.screen.screen.on('keypress', (key) => {
            index++;
            if (
                index > this.screen.info.cols / 2 &&
                this.comingText.length > this.screen.info.cols / 2
            ) {
                userText = userText.replace(new RegExp('^{.+?}.{/.+?}'), '');
            }
            const corr = nextChar === key;
            const startTag = corr ? '{green-fg}' : '{red-fg}';
            const endTag = corr ? '{/green-fg}' : '{/red-fg}';
            userText = `${userText}${startTag}${nextChar}${endTag}`;
            nextChar = this.comingText.charAt(0);
            this.comingText = this.comingText.substring(1);
            const newText = `${userText}{blue-bg}${nextChar}{/blue-bg}${this.comingText}`;
            this.box.setContent(newText);
            this.screen.render();
        });
    }

    public percentage(): number {
        return 1 - this.comingText.length / TEXT.length;
    }
}
