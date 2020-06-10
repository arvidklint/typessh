import { Connection, AuthContext } from 'ssh2';
import Client from './Client';
import { login } from './controllers/user';

export default class Game {
    private clients: Client[] = [];
    private intervalId: NodeJS.Timeout;

    constructor() {
        this.intervalId = setInterval(() => {
            this.update();
            this.render();
        }, 500);
    }

    public newClient(client: Connection): void {
        let username: string;
        client
            .on('authentication', async (ctx: AuthContext) => {
                if (ctx.method !== 'keyboard-interactive')
                    return ctx.reject(['keyboard-interactive']);

                if (await login(ctx)) {
                    return ctx.accept();
                }
                return ctx.reject();
            })
            .on('ready', () => {
                console.log('New Client:', username);
                // this.clients.push(new Client(username, client));
            })
            .on('end', () => {
                const index = this.clients.findIndex(
                    (client) => client.id === username
                );
                if (index !== -1) {
                    this.clients.splice(index, 1);
                }
                console.log('Client disconnected:', username);
            })
            .on('error', (error) => {
                console.log(error);
            });
    }

    private update() {
        const dataArray = this.clients.map((client) => client.sharedData());
        this.clients.forEach((client) => client.update(dataArray));
    }

    private render() {
        this.clients.forEach((client) => client.render());
    }
}
