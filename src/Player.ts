import blessed from 'blessed';
import Screen from './Screen';
function noop() {}

const TEXT =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

export default class Player {
    private box: blessed.Widgets.BoxElement;
    public widgets: any[] = [];

    constructor(private stream: any, private screen: Screen) {
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
        this.widgets.push(this.box);

        this.listen();
    }

    private listen() {
        let comingText = TEXT;
        let userText = '';
        let nextChar = comingText.charAt(0);
        comingText = comingText.substring(1);
        this.box.setContent(`{blue-bg}${nextChar}{/blue-bg}${comingText}`);
        let index = 0;
        this.screen.screen.on('keypress', (key) => {
            index++;
            if (
                index > this.screen.info.cols / 2 &&
                comingText.length > this.screen.info.cols / 2
            ) {
                userText = userText.replace(new RegExp('^{.+?}.{/.+?}'), '');
            }
            const corr = nextChar === key;
            const startTag = corr ? '{green-fg}' : '{red-fg}';
            const endTag = corr ? '{/green-fg}' : '{/red-fg}';
            userText = `${userText}${startTag}${nextChar}${endTag}`;
            nextChar = comingText.charAt(0);
            comingText = comingText.substring(1);
            const newText = `${userText}{blue-bg}${nextChar}{/blue-bg}${comingText}`;
            this.box.setContent(newText);
            this.screen.render();
        });
    }
}
