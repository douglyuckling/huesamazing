import "core-js/stable";
import "regenerator-runtime/runtime";
import "./polyfills.js";

import Gameboard from './gameboard/Gameboard';
import levels from './levels';
import './index.css';

const contentAspectRatio = 0.618;
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

async function playLevel(level) {
    const gameboard = new Gameboard(document.body, level);
    gameboard.setNominalBoardSize(nominalBoardWidth, nominalBoardHeight);
    const results = await gameboard.play();
    if (results.complete) {
        console.log(`You won in ${results.numberOfMoves} ${results.numberOfMoves === 1 ? 'move' : 'moves'}!`);
    }
}

async function loopThroughAllLevels() {
    let i = 0;
    while (i < levels.length) {
        await playLevel(levels[i]);
        i = (i + 1) % levels.length;
    }
}

Promise.resolve().then(loopThroughAllLevels);
