import { Connection, AuthContext } from 'ssh2';
import Client from './Client';
import { handleLogin } from './controllers/user';
import { IUser } from './db/models/User';

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
        let user: IUser;
        client
            .on('authentication', async (ctx: AuthContext) => {
                if (ctx.method !== 'keyboard-interactive')
                    return ctx.reject(['keyboard-interactive']);

                user = await handleLogin(ctx)
                if (user) {
                    return ctx.accept();
                }
                return ctx.reject();
            })
            .on('ready', () => {
                console.log('New Client:', user.username);
                this.clients.push(new Client(user, client));
            })
            .on('end', () => {
                const index = this.clients.findIndex(
                    (client) => client.user.username === user.username
                );
                if (index !== -1) {
                    this.clients.splice(index, 1);
                }
                console.log('Client disconnected:', user.username);
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
