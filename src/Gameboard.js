import * as d3 from 'd3';
import './gameboard.css';

class Gameboard {

    constructor() {
        this.rootEl = document.createElementNS(d3.namespaces.svg, 'svg');
        this.rootSelection = d3.select(this.rootEl);

        this.rootSelection.attr('class', 'gameboard')
            .attr('width', 960)
            .attr('height', 960);
    }

    appendTo(el) {
        el.appendChild(this.rootEl);
    }

}

export default Gameboard;
