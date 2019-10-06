import "core-js/stable";
import "regenerator-runtime/runtime";
import "./polyfills.js";

import Gameboard from './gameboard/Gameboard';
import levels from './levels';
import './index.css';

function updateGameboardSize(gameboard) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const contentAspectRatio = 0.644;
    const windowAspectRatio = windowWidth / windowHeight;

    let nominalBoardHeight = NaN;
    let nominalBoardWidth = NaN;
    if (windowAspectRatio > contentAspectRatio) {
        // Height is limiting factor; sides will be letterboxed
        nominalBoardHeight = windowHeight;
        nominalBoardWidth = nominalBoardHeight * contentAspectRatio;
    } else {
        // Width is limiting factor; bottom will be letterboxed
        nominalBoardWidth = windowWidth;
        nominalBoardHeight = nominalBoardWidth / contentAspectRatio;
    }

    gameboard.setNominalBoardSize(nominalBoardWidth, nominalBoardHeight);
    const marginTop = (windowHeight - gameboard.rootEl.clientHeight) / 2;
    gameboard.rootSelection.style('margin-top', marginTop);
}

let currentGameboard = null;

window.addEventListener('resize', (resizeEvent) => {
    if (currentGameboard) {
        updateGameboardSize(currentGameboard);
    }
});

async function playLevel(level) {
    currentGameboard = new Gameboard(document.body, level);
    updateGameboardSize(currentGameboard);

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
