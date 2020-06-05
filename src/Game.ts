import { Connection, AuthContext } from 'ssh2';
import Client from './Client';

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
        // TODO: Create a proper unique ID
        const clientId = Math.floor(Math.random() * 10000);
        client
            .on('authentication', (ctx: AuthContext) => {
                ctx.accept();
            })
            .on('ready', () => {
                console.log('New Client:', clientId);
                this.clients.push(new Client(clientId, client));
            })
            .on('end', () => {
                const index = this.clients.findIndex(
                    (client) => client.id === clientId
                );
                if (index !== -1) {
                    this.clients.splice(index, 1);
                }
                console.log('Client disconnected:', clientId);
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
