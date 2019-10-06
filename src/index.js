import "core-js/stable";
import "regenerator-runtime/runtime";
import "./polyfills.js";

import Gameboard from './gameboard/Gameboard';
import levels from './levels';
import './index.css';

const gameboardContainerEl = document.createElement('div');
gameboardContainerEl.classList.add('gameboard-container');
document.body.append(gameboardContainerEl);

let currentGameboard = null;

window.addEventListener('resize', (resizeEvent) => {
    if (currentGameboard) {
        currentGameboard.onResizeContainer();
    }
});

async function playLevel(level) {
    currentGameboard = new Gameboard(gameboardContainerEl, level);

    const results = await currentGameboard.play();
    if (results.complete) {
        console.log(`You won in ${results.numberOfMoves} ${results.numberOfMoves === 1 ? 'move' : 'moves'}!`);
    }
}

let levelIndex = 10;

async function loopThroughAllLevels() {
    while (levelIndex < levels.length) {
        const level = levels[levelIndex];
        levelIndex = (levelIndex + 1) % levels.length;
        await playLevel(level);
    }
}

Promise.resolve().then(loopThroughAllLevels);

window.goToLevel = function(newLevelIndex) {
    levelIndex = newLevelIndex;
    if (currentGameboard) {
        currentGameboard.abort();
    }
};
