import * as d3 from 'd3';
import GameboardMouseInteraction from './GameboardMouseInteraction';
import './gameboard.css';

const activeTileScalingFactor = 1.2;

class Gameboard {

    constructor(containerEl, level) {
        this.rootSelection = d3.select(containerEl).append('svg').attr('class', 'gameboard');
        this.rootEl = this.rootSelection.node();
        this.level = level;
        this.sockets = this.level.createSockets();
        this.tiles = this.sockets.map(socket => socket.tile);
        this.numberOfMoves = 0;
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

        for (const socket of this.sockets) {
            Object.assign(socket.position, {
                x: (socket.col + 0.5) * tileWidth,
                y: (socket.row + 0.5) * tileHeight,
            });
            Object.assign(socket.dimensions, {
                width: tileWidth,
                height: tileHeight,
            });
            Object.assign(socket.bounds, {
                xMin: socket.position.x - socket.dimensions.width / 2,
                xMax: socket.position.x + socket.dimensions.width / 2,
                yMin: socket.position.y - socket.dimensions.height / 2,
                yMax: socket.position.y + socket.dimensions.height / 2,
            });

            Object.assign(socket.tile, socket.position, socket.dimensions);
        }

        this.defaultTileDimensions = Object.freeze({
            width: tileWidth,
            height: tileHeight,
        });
        this.selectedTileDimensions = Object.freeze({
            width: tileWidth * activeTileScalingFactor,
            height: tileHeight * activeTileScalingFactor,
        });
    }

    async start() {
        this.renderTilesHidden(this.level.showTargetStateBeforeRandomizing);
        if (this.level.showTargetStateBeforeRandomizing) {
            await this.animateOutUnpinnedTilesBeforeRandomizing();
        }
        this.randomizeTiles();
        await this.animateInUnpinnedTilesAfterRandomizing();
        this.mouseInteraction.activate();
    }

    attachEventListeners() {
        this.mouseInteraction.emitter.on('beginTileGesture', (...args) => this.onBeginTileGesture(...args));
        this.mouseInteraction.emitter.on('updateTileGesture', (...args) => this.onUpdateTileGesture(...args));
        this.mouseInteraction.emitter.on('completeTileDragBasedSwapGesture', (...args) => this.onCompleteTileDragBasedSwapGesture(...args));
        this.mouseInteraction.emitter.on('abortTileDragBasedSwapGesture', (...args) => this.onAbortTileDragBasedSwapGesture(...args));
        this.mouseInteraction.emitter.on('completeTileSelectionGesture', (...args) => this.onCompleteTileSelectionGesture(...args));
        this.mouseInteraction.emitter.on('completeTileSelectionBasedSwapGesture', (...args) => this.onCompleteTileSelectionBasedSwapGesture(...args));
        this.mouseInteraction.emitter.on('abortTileSelectionBasedSwapGesture', (...args) => this.onAbortTileSelectionBasedSwapGesture(...args));
    }

    getSocketAtPosition(x, y) {
        return this.sockets.find(socket => {
            return (
                x >= socket.bounds.xMin && x <= socket.bounds.xMax &&
                y >= socket.bounds.yMin && y <= socket.bounds.yMax);
        });
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
        this.swapTiles(socketA, socketB);
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

    onCompleteTileSelectionBasedSwapGesture(socketA, socketB) {
        this.swapTiles(socketA, socketB);
        Object.assign(socketA.tile, socketA.position, this.defaultTileDimensions);
        Object.assign(socketB.tile, socketB.position, this.defaultTileDimensions);

        this.getTilesSelection([socketA.tile, socketB.tile])
            .transition().duration(500)
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .call(updatingTileSelection => {
                this.applyTileDimensions(updatingTileSelection);
            });

        this.incrementNumberOfMoves();
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

    swapTiles(socketA, socketB) {
        const tempTile = socketA.tile;
        socketA.tile = socketB.tile;
        socketB.tile = tempTile;
    }

    randomizeTiles() {
        const unpinnedSockets = this.sockets.filter(socket => !socket.pinned);

        for (let i = 0; i < unpinnedSockets.length - 1; i++) {
            const socketA = unpinnedSockets[i];
            const otherSocketIndex = Math.floor(d3.randomUniform(i + 1, unpinnedSockets.length)());
            const socketB = unpinnedSockets[otherSocketIndex];
            this.swapTiles(socketA, socketB);
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

        await tile
            .transition().duration(0).delay(1000) //pause
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

}

export default Gameboard;
