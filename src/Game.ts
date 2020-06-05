import { Connection, AuthContext } from 'ssh2';
import Player from './Player';

export default class Game {
    private players: Player[] = [];

    constructor() {}

    public newClient(client: Connection): void {
        // TODO: Create a proper unique ID
        const clientId = Math.floor(Math.random() * 10000);
        client
            .on('authentication', (ctx: AuthContext) => {
                ctx.accept();
            })
            .on('ready', () => {
                console.log('New Client:', clientId);
                this.players.push(new Player(clientId, client));
            })
            .on('end', () => {
                const index = this.players.findIndex(
                    (player) => player.id === clientId
                );
                if (index !== -1) {
                    this.players.splice(index, 1);
                }
                console.log('Client disconnected:', clientId);
            })
            .on('error', (error) => {
                console.log(error);
            });
    }

    public removePlayer(): void {}

    public update(): void {}

    public render(): void {
        this.players.forEach((player) => player.render());
    }
}
