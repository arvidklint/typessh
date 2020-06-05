import blessed from 'blessed';

import Screen from './Screen';

const TAGS = ['red-bg', 'blue-bg', 'green-bg', 'cyan-bg', 'yellow-bg'];
const PADDING_START = 6;

function padSides(str: string, len: number, pad: string): string {
    return str.padStart((str.length + len) / 2, pad).padEnd(len, pad);
}

export default class Race {
    public box: blessed.Widgets.BoxElement;
    private raceBox: blessed.Widgets.BoxElement;

    constructor(private readonly screen: Screen) {
        this.box = blessed.box({
            screen: this.screen.screen,
            top: 5,
            left: 1,
            right: 1,
            height: 10,
        });

        // Title
        blessed.box({
            parent: this.box,
            left: 0,
            right: 0,
            top: 0,
            align: 'center',
            content: padSides(' | RACE | ', this.screen.info.cols - 8, '-_'),
            type: 'line',
        });

        this.raceBox = blessed.box({
            parent: this.box,
            left: 0,
            right: 0,
            top: 2,
            bottom: 2,
            tags: true,
        });
    }

    public update(dataArray: SharedClientData[]) {
        const content = dataArray
            .map((data, index) => {
                const width = this.screen.info.cols - 2 - PADDING_START - 1;
                const padding = width * data.percentage;
                const tag = TAGS[index];
                const str = `${data.name.substring(0, 5)}`.padStart(
                    padding + PADDING_START,
                    ' '
                );
                return `{${tag}}${str}{/${tag}}`;
            })
            .join('\n\n');
        this.raceBox.setContent(content);
    }
}
