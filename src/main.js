import { Game } from './Game.js';

Ammo().then(() => {
    const game = new Game();
    game.init();
});