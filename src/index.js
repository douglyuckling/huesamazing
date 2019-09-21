import "core-js/stable";
import "regenerator-runtime/runtime";

import Gameboard from './Gameboard';
import Level from './Level';
import './index.css';

const level = new Level({
    type: 'rectangles',
    anchorColors: {
        'TL': '#6349e2', 'TR': '#ffe7e6',
        'BL': '#a10758', 'BR': '#e3c122'
    },
    resolution: [7, 9]
});

const gameboard = new Gameboard(document.body, level);

const nominalBoardHeight = 960;
const nominalBoardWidth = Math.floor(nominalBoardHeight * 0.618);

gameboard.resize(nominalBoardWidth, nominalBoardHeight);
