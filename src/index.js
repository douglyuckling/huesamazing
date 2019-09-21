import "core-js/stable";
import "regenerator-runtime/runtime";

import Gameboard from './Gameboard';
import './index.css';

const gameboard = new Gameboard();

gameboard.appendTo(document.body);
