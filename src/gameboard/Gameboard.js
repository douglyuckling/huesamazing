import * as d3 from 'd3';
import GameboardInteraction from './GameboardInteraction';
import Socket from './Socket';
import './gameboard.css';

const activeTileScalingFactor = 1.2;

class Gameboard {

    constructor(containerEl, level) {
        this.rootSelection = d3.select(containerEl).append('svg').attr('class', 'gameboard');
        this.rootEl = this.rootSelection.node();
        this.level = level;
        this.sockets = this.level.getTileData().map(d => new Socket(d));
        this.tiles = this.sockets.map(socket => socket.tile);
        this.numberOfMoves = NaN;
        this.interaction = new GameboardInteraction(this);
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

        this.defaultTileDimensions = Object.freeze({
            width: tileWidth,
            height: tileHeight,
        });
        this.selectedTileDimensions = Object.freeze({
            width: tileWidth * activeTileScalingFactor,
            height: tileHeight * activeTileScalingFactor,
        });

        for (const socket of this.sockets) {
            socket.setBoardTileDimensions(this.defaultTileDimensions);

            Object.assign(socket.tile, socket.position, socket.dimensions);
        }
    }

    async start() {
        this.numberOfMoves = 0;
        this.renderTilesHidden(this.level.showTargetStateBeforeRandomizing);
        if (this.level.showTargetStateBeforeRandomizing) {
            await this.animateOutUnpinnedTilesBeforeRandomizing();
        }
        this.randomizeTiles();
        await this.animateInUnpinnedTilesAfterRandomizing();
        this.interaction.activate();
    }

    attachEventListeners() {
        this.interaction.emitter.on('beginTileGesture', (...args) => this.onBeginTileGesture(...args));
        this.interaction.emitter.on('updateTileGesture', (...args) => this.onUpdateTileGesture(...args));
        this.interaction.emitter.on('completeTileDragBasedSwapGesture', (...args) => this.onCompleteTileDragBasedSwapGesture(...args));
        this.interaction.emitter.on('abortTileDragBasedSwapGesture', (...args) => this.onAbortTileDragBasedSwapGesture(...args));
        this.interaction.emitter.on('completeTileSelectionGesture', (...args) => this.onCompleteTileSelectionGesture(...args));
        this.interaction.emitter.on('abortTileSelectionGesture', (...args) => this.onAbortTileSelectionGesture(...args));
        this.interaction.emitter.on('completeTileSelectionBasedSwapGesture', (...args) => this.onCompleteTileSelectionBasedSwapGesture(...args));
        this.interaction.emitter.on('abortTileSelectionBasedSwapGesture', (...args) => this.onAbortTileSelectionBasedSwapGesture(...args));
    }

    getSocketAtPosition(position) {
        return this.sockets.find(socket => socket.containsPoint(position));
    }

    getSocketHoldingTile(tile) {
        return this.sockets.find(socket => socket.tile === tile);
    }

    onBeginTileGesture(gesture) {
        Object.assign(gesture.tile, this.selectedTileDimensions);

        this.getTilesSelection([gesture.tile])
            .raise()
            .transition()
            .call(updatingTileSelection => {
                this.applyTileDimensions(updatingTileSelection);
            });
    }

    onUpdateTileGesture(gesture) {
        this.getTilesSelection([gesture.tile])
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
    }

    onCompleteTileDragBasedSwapGesture(socketA, socketB) {
        socketA.swapTilesWith(socketB);
        Object.assign(socketA.tile, socketA.position, this.defaultTileDimensions);
        Object.assign(socketB.tile, socketB.position, this.defaultTileDimensions);

        this.getTilesSelection([socketA.tile, socketB.tile])
            .raise()
            .transition().duration(500)
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .call(updatingTileSelection => {
                this.applyTileDimensions(updatingTileSelection);
            });
        this.incrementNumberOfMoves();
        this.checkForWin();
    }

    onAbortTileDragBasedSwapGesture(originalSocket, draggedOverOtherTiles) {
        Object.assign(originalSocket.tile, originalSocket.position, this.defaultTileDimensions);

        this.getTilesSelection([originalSocket.tile])
            .transition()
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .call(updatingTileSelection => {
                this.applyTileDimensions(updatingTileSelection);
            });

        if (draggedOverOtherTiles) {
            this.incrementNumberOfMoves();
        }
    }

    onCompleteTileSelectionGesture(socket) {
        Object.assign(socket.tile, socket.position);

        this.getTilesSelection([socket.tile])
            .transition().duration(100)
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
    }

    onAbortTileSelectionGesture(socket) {
        Object.assign(socket.tile, socket.position, this.defaultTileDimensions);

        this.getTilesSelection([socket.tile])
            .transition().duration(100)
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
    }

    onCompleteTileSelectionBasedSwapGesture(socketA, socketB) {
        socketA.swapTilesWith(socketB);
        Object.assign(socketA.tile, socketA.position, this.defaultTileDimensions);
        Object.assign(socketB.tile, socketB.position, this.defaultTileDimensions);

        this.getTilesSelection([socketA.tile, socketB.tile])
            .transition().duration(500)
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .call(updatingTileSelection => {
                this.applyTileDimensions(updatingTileSelection);
            });

        this.incrementNumberOfMoves();
        this.checkForWin();
    }

    onAbortTileSelectionBasedSwapGesture(originalSocket) {
        Object.assign(originalSocket.tile, originalSocket.position, this.defaultTileDimensions);

        this.getTilesSelection([originalSocket.tile])
            .transition()
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .call(updatingTileSelection => {
                this.applyTileDimensions(updatingTileSelection);
            });
    }

    randomizeTiles() {
        const unpinnedSockets = this.sockets.filter(socket => !socket.pinned);

        for (let i = 0; i < unpinnedSockets.length - 1; i++) {
            const socketA = unpinnedSockets[i];
            const otherSocketIndex = Math.floor(d3.randomUniform(i + 1, unpinnedSockets.length)());
            const socketB = unpinnedSockets[otherSocketIndex];
            socketA.swapTilesWith(socketB);
            Object.assign(socketA.tile, socketA.position);
            Object.assign(socketB.tile, socketB.position);
        }
    }

    getTilesSelection(tiles = this.tiles) {
        return this.rootSelection.selectAll('g.tile').data(tiles, d => d.id);
    }

    renderTilesHidden(showUnpinned) {
        const tile = this.getTilesSelection();

        tile.exit().remove();

        tile.enter().append('g').attr('class', 'tile')
            .call(enteringTile => {
                enteringTile.append('rect')
                    .style('fill', d => d.color);

                enteringTile.filter(d => d.pinned)
                    .call(enteringPinnedTile => {
                        enteringPinnedTile.append('circle').attr('class', 'pin')
                            .attr('r', 4)
                            .style('fill-opacity', 1);
                    });
            })
            .merge(tile)
            .call(updatingTile => {
                updatingTile
                    .attr('transform', d => `translate(${d.x}, ${d.y})`);

                updatingTile.filter(d => d.pinned)
                    .call(updatingPinnedTile => {
                        this.applyTileDimensions(updatingPinnedTile);
                    });

                updatingTile.filter(d => !d.pinned)
                    .call(updatingUnpinnedTile => {
                        if (showUnpinned) {
                            this.applyTileDimensions(updatingUnpinnedTile);
                        } else {
                            updatingUnpinnedTile.select('rect')
                                .attr('x', 0)
                                .attr('y', 0)
                                .attr('width', 0)
                                .attr('height', 0);
                        }
                    });

            });
    }

    async animateOutUnpinnedTilesBeforeRandomizing() {
        const tile = this.getTilesSelection().filter(d => !d.pinned);

        await sleep(1000);

        await tile
            .transition().duration(500).delay(d => d.y + d.x * 0.625).ease(d3.easeQuad)
            .call(transitioningTile => {
                transitioningTile.select('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', 0)
                    .attr('height', 0);
            })
            .end();
    }

    async animateInUnpinnedTilesAfterRandomizing() {
        const tile = this.getTilesSelection().filter(d => !d.pinned);

        await tile
            .call(updatingTile => {
                updatingTile
                    .attr('transform', d => `translate(${d.x}, ${d.y})`);
            })
            .transition().duration(500).delay(d => d.y + d.x * 0.625).ease(d3.easeQuad)
            .call(transitioningTile => {
                this.applyTileDimensions(transitioningTile);
                transitioningTile.select('rect');
            })
            .end();
    }

    async animateTilesOutAfterWin() {
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
            .transition().duration(500).delay(d => d.y + d.x * 0.625).ease(d3.easeQuad)
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

    incrementNumberOfMoves() {
        this.numberOfMoves += 1;
    }

    checkForWin() {
        const win = this.sockets.every(socket => socket.tile.id === socket.id);
        if (win) {
            this.onWin();
        }
    }

    async onWin() {
        this.interaction.deactivate();

        console.log(`You won in ${this.numberOfMoves} ${this.numberOfMoves === 1 ? 'move' : 'moves'}!`);
        await sleep(1000);
        await this.animateTilesOutAfterWin();
        await this.start();
    }

}

async function sleep(durationInMillis) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), durationInMillis);
    });
}

export default Gameboard;
