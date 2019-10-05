import "core-js/stable";
import "regenerator-runtime/runtime";
import "./polyfills.js";

import Gameboard from './gameboard/Gameboard';
import levels from './levels';
import './index.css';

const contentAspectRatio = 0.644;
const windowAspectRatio = window.innerWidth / window.innerHeight;

let nominalBoardHeight = NaN;
let nominalBoardWidth = NaN;
if (windowAspectRatio > contentAspectRatio) {
    // Height is limiting factor; sides will be letterboxed
    nominalBoardHeight = window.innerHeight;
    nominalBoardWidth = nominalBoardHeight * contentAspectRatio;
} else {
    // Width is limiting factor; bottom will be letterboxed
    nominalBoardWidth = window.innerWidth;
    nominalBoardHeight = nominalBoardWidth / contentAspectRatio;
}

let currentGameboard = null;

async function playLevel(level) {
    currentGameboard = new Gameboard(document.body, level);
    currentGameboard.setNominalBoardSize(nominalBoardWidth, nominalBoardHeight);
    const marginTop = (window.innerHeight - currentGameboard.rootEl.clientHeight) / 2;
    currentGameboard.rootSelection.style('margin-top', marginTop);

    const results = await currentGameboard.play();
    if (results.complete) {
        console.log(`You won in ${results.numberOfMoves} ${results.numberOfMoves === 1 ? 'move' : 'moves'}!`);
    }
}

let levelIndex = 0;

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
