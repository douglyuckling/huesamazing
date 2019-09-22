import * as d3 from 'd3';
import GameboardMouseInteraction from './GameboardMouseInteraction';
import './gameboard.css';

const selectedTileScalingFactor = 1.2;

class Gameboard {

    constructor(containerEl, level) {
        this.rootSelection = d3.select(containerEl).append('svg').attr('class', 'gameboard');
        this.rootEl = this.rootSelection.node();
        this.level = level;
        this.tiles = this.level.createTiles();
        this.mouseInteraction = new GameboardMouseInteraction(this);
        this.attachEventListeners();
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

        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
    }

    start() {
        this.animateTilesIn()
            .then(() => {
                this.mouseInteraction.activate();
            });
    }

    attachEventListeners() {
        this.mouseInteraction.emitter.on('beginTileGesture', (...args) => this.onBeginTileGesture(...args));
        this.mouseInteraction.emitter.on('updateTileGesture', (...args) => this.onUpdateTileGesture(...args));
        this.mouseInteraction.emitter.on('endTileGesture', (...args) => this.onEndTileGesture(...args));
    }

    onBeginTileGesture(gesture) {
        Object.assign(gesture.tile, {
            width: this.tileWidth * selectedTileScalingFactor,
            height: this.tileHeight * selectedTileScalingFactor,
        });

        d3.select(gesture.tileEl).datum(gesture.tile)
            .raise()
            .transition()
            .call(updatingTileSelection => {
                this.applyTileDimensions(updatingTileSelection);
            });
    }

    onUpdateTileGesture(gesture) {
        const tileSelection = d3.select(gesture.tileEl).datum(gesture.tile);

        tileSelection
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
    }

    onEndTileGesture(gesture) {
        Object.assign(gesture.tile, {
            width: this.tileWidth,
            height: this.tileHeight,
            x: gesture.originalPosition.x,
            y: gesture.originalPosition.y,
        });

        d3.select(gesture.tileEl).datum(gesture.tile)
            .transition()
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .call(updatingTileSelection => {
                this.applyTileDimensions(updatingTileSelection);
            });
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

                enteringTile.append('rect')
                    .style('fill', d => d.color);

                enteringTile.filter(d => d.pinned)
                    .call(enteringPinnedTile => {
                        this.applyTileDimensions(enteringPinnedTile);

                        enteringPinnedTile.append('circle').attr('class', 'pin')
                            .attr('r', 4);
                    });
            })
            .merge(tile)
            .filter(d => !d.pinned)
            .call(updatingTile => {
                updatingTile.select('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', 0)
                    .attr('height', 0);
            })
            .transition().duration(500).delay(d => d.row * 100 + d.col * 50).ease(d3.easeQuad)
            .call(transitioningTile => {
                this.applyTileDimensions(transitioningTile);
                transitioningTile.select('rect');
            })
            .end();
    }

    async animateTilesOut() {
        return this.getTilesSelection()
            .call(updatingTile => {
                this.applyTileDimensions(updatingTile);

                updatingTile.select('.pin')
                    .style('fill-opacity', 1);
            })
            .transition().duration(350).ease(d3.easeCubicOut)
            .call(transitioningTile => {
                transitioningTile.select('.pin')
                    .style('fill-opacity', 0);
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

    applyTileDimensions(tileSelection) {
        tileSelection.select('rect')
            .attr('x', d => -0.5 * d.width)
            .attr('y', d => -0.5 * d.height)
            .attr('width', d => d.width)
            .attr('height', d => d.height);
    }

}

export default Gameboard;
