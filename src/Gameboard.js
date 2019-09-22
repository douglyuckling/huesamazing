import * as d3 from 'd3';
import './gameboard.css';

class Gameboard {

    constructor(containerEl, level) {
        this.rootSelection = d3.select(containerEl).append('svg').attr('class', 'gameboard');
        this.level = level;
        this.tiles = this.level.createTiles();
    }

    setNominalBoardSize(nominalBoardWidth, nominalBoardHeight) {
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
            tile.x = (tile.col + 0.5) * tileWidth;
            tile.y = (tile.row + 0.5) * tileHeight;
            tile.width = tileWidth;
            tile.height = tileHeight;
        }
    }

    getTilesSelection() {
        return this.rootSelection.selectAll('g.tile').data(this.tiles, d => d.id);
    }

    async animateTilesIn() {
        const tile = this.getTilesSelection();

        tile.exit().remove();

        return tile.enter().append('g').attr('class', 'tile')
            .call(enteringTile => {
                enteringTile
                    .attr('transform', d => `translate(${d.x}, ${d.y})`);
                enteringTile.append('rect');
            })
            .merge(tile)
            .call(updatingTile => {
                updatingTile.select('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', 0)
                    .attr('height', 0)
                    .style('fill', d => d.color);
            })
            .transition().duration(500).delay(d => d.row * 100 + d.col * 50).ease(d3.easeQuad)
            .call(transitioningTile => {
                transitioningTile.select('rect')
                    .attr('x', d => -0.5 * d.width)
                    .attr('y', d => -0.5 * d.height)
                    .attr('width', d => d.width)
                    .attr('height', d => d.height);
            })
            .end();
    }

    async animateTilesOut() {
        return this.getTilesSelection()
            .call(updatingTile => {
                updatingTile.select('rect')
                    .attr('x', d => -0.5 * d.width)
                    .attr('y', d => -0.5 * d.height)
                    .attr('width', d => d.width)
                    .attr('height', d => d.height);
            })
            .transition().duration(500).delay(d => d.row * 100 + d.col * 50).ease(d3.easeQuad)
            .call(transitioningTile => {
                transitioningTile.select('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', 0)
                    .attr('height', 0);
            })
            .remove()
            .end();
    }

}

export default Gameboard;
