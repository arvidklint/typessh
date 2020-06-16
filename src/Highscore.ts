import blessed from 'blessed';
import Screen from './Screen';
import { IRecord } from './db/models/Record';

export interface HighscoreOptions {
    parent?: blessed.Widgets.BoxElement;
    left?: number;
    top?: number;
    label?: string;
    showName?: boolean;
    width?: number;
}

export default class Highscore {
    public box: blessed.Widgets.BoxElement;
    private list: blessed.Widgets.ListElement;
    private items: IRecord[] = [];
    private options: HighscoreOptions = {
        left: 0,
        top: 0,
        label: 'Highscore',
        showName: false,
        width: 20,
    };

    constructor(private screen: Screen, options: HighscoreOptions) {
        this.options = {
            ...this.options,
            ...options,
        };
        this.box = blessed.box({
            parent: this.options.parent,
            top: this.options.top,
            width: this.options.width,
            left: this.options.left,
            height: 14,
        });

        blessed.box({
            parent: this.box,
            left: 0,
            top: 0,
            width: this.options.width,
            type: 'line',
            content: `—[ ${this.options.label} ]`.padEnd(
                this.options.width,
                '—'
            ),
        });

        this.list = blessed.list({
            parent: this.box,
            top: 2,
            left: 0,
            right: 0,
            label: this.options.label,
        });

        blessed.box({
            parent: this.box,
            left: 0,
            bottom: 0,
            height: 1,
            width: this.options.width,
            type: 'line',
            content: ''.padEnd(this.options.width, '—'),
        });
    }

    private formatItem(item: IRecord | null, index: number) {
        const place = ` ${index} ${
            this.options.showName && item
                ? `(${item.username.substring(0, 8)})`
                : ''
        }`;
        if (!item) return `${place}`.padEnd(this.options.width - 3, '_');
        const wpmString = item.wpm.toString();
        return `${place.padEnd(
            this.options.width - wpmString.length - 1,
            '_'
        )}${wpmString}`;
    }

    private formatItems(items: IRecord[]) {
        let formattedItems: string[] = [];
        for (let i = 0; i < 10; i++) {
            formattedItems.push(this.formatItem(items[i] || null, i + 1));
        }
        return formattedItems;
    }

    public setItems(items: IRecord[]) {
        this.items = items;
        // @ts-ignore
        this.list.setItems(this.formatItems(items));
        this.screen.render();
    }

    public considerItem(item: IRecord) {
        const newItems = [...this.items, item].sort((a, b) => {
            // @ts-ignore
            return b.wpm - a.wpm;
        });
        this.items = newItems;
        // @ts-ignore
        this.list.setItems(this.formatItems(newItems));
        this.screen.render();
    }
}
