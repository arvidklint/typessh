import blessed from 'blessed';
import Screen from './Screen';
import { IRecord } from './db/models/Record';

const WIDTH = 20;

export default class Highscore {
    public box: blessed.Widgets.BoxElement;
    private list: blessed.Widgets.ListElement;
    private items: IRecord[] = [];

    constructor(
        private screen: Screen,
        label: string,
        private right: boolean = false
    ) {
        this.box = blessed.box({
            screen: this.screen.screen,
            top: 20,
            width: WIDTH,
            left: this.right ? WIDTH : 0,
            height: 12,
        });

        this.list = blessed.list({
            parent: this.box,
            bottom: 0,
            left: 0,
            right: 0,
            border: 'line',
            label,
        });
    }

    private formatItem(item: IRecord | null, index: number) {
        const place = ` ${index}`;
        if (!item) return `${place}`.padEnd(WIDTH - 3, '_');
        const wpmString = item.wpm.toString();
        return `${place.padEnd(WIDTH - wpmString.length - 3, '_')}${wpmString}`;
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
        this.list.setItems(this.formatItems(items));
        this.screen.render();
    }

    public considerItem(item: IRecord) {
        const newItems = [...this.items, item].sort((a, b) => {
            return b.wpm - a.wpm;
        });
        this.items = newItems;
        this.list.setItems(this.formatItems(newItems));
        this.screen.render();
    }
}
