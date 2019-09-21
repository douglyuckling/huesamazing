import * as d3 from 'd3';
import './gameboard.css';

class Gameboard {

    constructor(containerEl, level) {
        this.rootSelection = d3.select(containerEl).append('svg').attr('class', 'gameboard');
        this.level = level;
        this.tiles = this.level.createTiles();
    }

    resize(nominalBoardWidth, nominalBoardHeight) {
        const nCols = this.level.nCols;
        const nRows = this.level.nRows;

        const tileWidth = Math.floor(nominalBoardWidth / nCols);
        const tileHeight = Math.floor(nominalBoardHeight / nRows);
        const boardWidth = tileWidth * nCols;
        const boardHeight = tileHeight * nRows;

        this.rootSelection
            .attr('width', boardWidth)
            .attr('height', boardHeight);

        for (const tile of this.tiles) {
            tile.x = tile.col * tileWidth;
            tile.y = tile.row * tileHeight;
            tile.width = tileWidth;
            tile.height = tileHeight;
        }

        this.render();
    }

    render() {
        const rect = this.rootSelection.selectAll('rect').data(this.tiles, d => d.id);
        rect.exit().remove();
        rect.enter().append('rect')
            .merge(rect)
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('width', d => d.width)
            .attr('height', d => d.height)
            .style('fill', d => d.color);
    }

}

export default Gameboard;
