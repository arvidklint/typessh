import blessed from 'blessed';

type ScreenInfo = {
    rows: number;
    cols: number;
    term: string;
};

export default class Screen {
    public readonly screen: blessed.Widgets.Screen;

    constructor(stream: any, public info: ScreenInfo) {
        this.screen = blessed.screen({
            autoPadding: true,
            smartCSR: true,
            program: blessed.program({
                input: stream,
                output: stream,
            }),
            terminal: this.info.term,
        });
        this.screen.title = 'TypeSSH';
        this.screen.program.disableMouse();
        this.screen.key(['escape'], () => {
            stream.exit(0);
            stream.end();
        });
    }

    public append(elements: any[]) {
        elements.forEach((element) => this.screen.append(element));
    }

    public render(): void {
        this.screen.render();
        this.screen.program.emit('resize');
    }
}
