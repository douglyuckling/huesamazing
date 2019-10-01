import "core-js/stable";
import "regenerator-runtime/runtime";
import "./polyfills.js";

import Gameboard from './gameboard/Gameboard';
import Level from './Level';
import './index.css';

const level = new Level({
    type: 'rectangles',
    anchorColors: {
        'TL': '#6349e2', 'TR': '#ffe7e6',
        'BL': '#a10758', 'BR': '#e3c122'
    },
    resolution: [5, 7],
    pinnedTiles: ['1,1', '3,1', '1,5', '3,5'],
    showTargetStateBeforeRandomizing: true
});

const gameboard = new Gameboard(document.body, level);

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

gameboard.setNominalBoardSize(nominalBoardWidth, nominalBoardHeight);

gameboard.start();
