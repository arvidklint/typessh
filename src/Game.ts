import { Connection, AuthContext } from 'ssh2';
import Client from './Client';
import { handleLogin } from './controllers/user';
import { IUser } from './db/models/User';
import Record from './db/models/Record';
import log from './log';

export default class Game {
    private clients: Client[] = [];
    private intervalId: NodeJS.Timeout;
    private highscoreThrottlingCheck: boolean = true;

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

                user = await handleLogin(ctx);
                if (user) {
                    return ctx.accept();
                }
                return ctx.reject();
            })
            .on('ready', () => {
                log.info('Client logged in: ', user && user.username);
                if (!client) return;
                this.clients.push(
                    new Client(
                        user,
                        client,
                        this.updateGlobalHighscore.bind(this)
                    )
                );
            })
            .on('end', () => {
                if (!user) return;
                const index = this.clients.findIndex(
                    (client) => client.user.username === user.username
                );
                if (index !== -1) {
                    this.clients.splice(index, 1);
                }
                log.info('Client disconnected: ', user.username);
            })
            .on('error', (error) => {
                log.error(error);
            });
    }

    private updateGlobalHighscore() {
        if (this.highscoreThrottlingCheck) {
            Record.find()
                .sort({ wpm: -1 })
                .limit(10)
                .then((items) => {
                    this.clients.forEach((client) =>
                        client.setGlobalHighscore(items)
                    );
                })
                .catch(log.error);
            this.highscoreThrottlingCheck = false;
            setTimeout(() => {
                this.highscoreThrottlingCheck = true;
            }, 5000);
        }
    }

    private update() {
        const dataArray = this.clients.map((client) => client.sharedData());
        this.clients.forEach((client) => client.update(dataArray));
    }

    private render() {
        this.clients.forEach((client) => client.render());
    }
}
