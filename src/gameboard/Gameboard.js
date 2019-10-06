import {easeCubicOut, easeQuad} from 'd3-ease';
import {randomUniform} from 'd3-random';
import {select} from 'd3-selection';
import 'd3-transition';
import GameboardInteraction from './GameboardInteraction';
import Socket from './Socket';
import './gameboard.css';

const activeTileScalingFactor = 1.2;

class Gameboard {

    constructor(containerEl, level) {
        this.rootSelection = select(containerEl).append('svg').attr('class', 'gameboard');
        this.rootEl = this.rootSelection.node();
        this.level = level;
        this.sockets = this.level.getTileData().map(d => new Socket(this, d));
        this.tiles = this.sockets.map(socket => socket.tile);
        this.numberOfMoves = NaN;
        this.interaction = new GameboardInteraction(this);
        this.attachEventListeners();

        this.resolvePlayPromise = null;
        this.resolveGesturePromise = null;
        this.currentAnimationPromise = Promise.resolve();
        this.boardResizePromise = null;

        this.onResizeContainer();
    }

    computeNominalGameboardDimensions(containerDimensions) {
        const boardAspectRatio = 0.644;
        const containerAspectRatio = containerDimensions.width / containerDimensions.height;

        let nominalBoardHeight = NaN;
        let nominalBoardWidth = NaN;
        if (containerAspectRatio > boardAspectRatio) {
            // Height is limiting factor; sides will be letterboxed
            nominalBoardHeight = containerDimensions.height;
            nominalBoardWidth = nominalBoardHeight * boardAspectRatio;
        } else {
            // Width is limiting factor; bottom will be letterboxed
            nominalBoardWidth = containerDimensions.width;
            nominalBoardHeight = nominalBoardWidth / boardAspectRatio;
        }

        return {width: nominalBoardWidth, height: nominalBoardHeight};
    }

    async onResizeContainer() {
        if (!this.boardResizePromise) {
            this.boardResizePromise = this.enqueueAnimation(() => {
                this.boardResizePromise = null;

                const containerEl = this.rootEl.parentElement;
                const containerDimensions = containerEl.getBoundingClientRect();
                const nominalDimensions = this.computeNominalGameboardDimensions(containerDimensions);
                const nCols = this.level.nCols;
                const nRows = this.level.nRows;

                const tileWidth = Math.floor(nominalDimensions.width / nCols);
                const tileHeight = Math.floor(nominalDimensions.height / nRows);
                const boardWidth = tileWidth * nCols;
                const boardHeight = tileHeight * nRows;
                const marginTop = (containerDimensions.height - boardHeight) / 2;

                this.rootSelection
                    .attr('width', boardWidth)
                    .attr('height', boardHeight)
                    .style('margin-top', marginTop);

                this.defaultTileDimensions = Object.freeze({
                    width: tileWidth,
                    height: tileHeight,
                });

                for (const socket of this.sockets) {
                    Object.assign(socket.tile, socket.position);
                }

                this.getTilesSelection()
                    .call(updatingTile => {
                        updatingTile
                            .attr('transform', d => `translate(${d.x}, ${d.y})`);
                        this.applyTileDimensions(updatingTile);
                    });
            });
        }

        return this.boardResizePromise;
    }

    async play() {
        if (this.resolvePlayPromise) {
            throw Error("Illegal state: play() has already been invoked on this Gameboard");
        }

        await this.currentAnimationPromise;

        this.numberOfMoves = 0;
        await this.enqueueAnimation(async () => {
            this.renderTilesHidden(this.level.showTargetStateBeforeRandomizing);
            if (this.level.showTargetStateBeforeRandomizing) {
                await this.animateOutUnpinnedTilesBeforeRandomizing();
            }

            this.randomizeTiles();

            await this.animateInUnpinnedTilesAfterRandomizing();
        });

        this.interaction.activate();

        const results = await new Promise((resolve) => {
            this.resolvePlayPromise = resolve;
        });

        this.rootSelection.remove();

        return results;
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
        this.enqueueAnimation(() => {
            Object.assign(gesture.tile, {scale: activeTileScalingFactor});

            this.getTilesSelection([gesture.tile])
                .raise()
                .transition()
                .call(updatingTileSelection => {
                    this.applyTileDimensions(updatingTileSelection);
                });

            return new Promise(resolve => {
                this.resolveGesturePromise = resolve;
            });
        });
    }

    onUpdateTileGesture(gesture) {
        this.getTilesSelection([gesture.tile])
            .attr('transform', d => `translate(${d.x}, ${d.y})`);
    }

    async onCompleteTileDragBasedSwapGesture(socketA, socketB) {
        socketA.swapTilesWith(socketB);
        Object.assign(socketA.tile, socketA.position, {scale: 1});
        Object.assign(socketB.tile, socketB.position, {scale: 1});

        await this.getTilesSelection([socketA.tile, socketB.tile])
            .raise()
            .transition().duration(500)
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .call(updatingTileSelection => {
                this.applyTileDimensions(updatingTileSelection);
            })
            .end();

        this.incrementNumberOfMoves();
        this.checkForWin();

        this.resolveGesturePromise();
    }

    async onAbortTileDragBasedSwapGesture(originalSocket, draggedOverOtherTiles) {
        Object.assign(originalSocket.tile, originalSocket.position, {scale: 1});

        await this.getTilesSelection([originalSocket.tile])
            .transition()
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .call(updatingTileSelection => {
                this.applyTileDimensions(updatingTileSelection);
            })
            .end();

        if (draggedOverOtherTiles) {
            this.incrementNumberOfMoves();
        }

        this.resolveGesturePromise();
    }

    async onCompleteTileSelectionGesture(socket) {
        Object.assign(socket.tile, socket.position);

        await this.getTilesSelection([socket.tile])
            .transition().duration(100)
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .end();

        this.resolveGesturePromise();
    }

    async onAbortTileSelectionGesture(socket) {
        Object.assign(socket.tile, socket.position, {scale: 1});

        await this.getTilesSelection([socket.tile])
            .transition().duration(100)
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .end();

        this.resolveGesturePromise();
    }

    async onCompleteTileSelectionBasedSwapGesture(socketA, socketB) {
        socketA.swapTilesWith(socketB);
        Object.assign(socketA.tile, socketA.position, {scale: 1});
        Object.assign(socketB.tile, socketB.position, {scale: 1});

        await this.getTilesSelection([socketA.tile, socketB.tile])
            .transition().duration(500)
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .call(updatingTileSelection => {
                this.applyTileDimensions(updatingTileSelection);
            })
            .end();

        this.incrementNumberOfMoves();
        this.checkForWin();

        this.resolveGesturePromise();
    }

    async onAbortTileSelectionBasedSwapGesture(originalSocket) {
        Object.assign(originalSocket.tile, originalSocket.position, {scale: 1});

        await this.getTilesSelection([originalSocket.tile])
            .transition()
            .attr('transform', d => `translate(${d.x}, ${d.y})`)
            .call(updatingTileSelection => {
                this.applyTileDimensions(updatingTileSelection);
            })
            .end();

        this.resolveGesturePromise();
    }

    randomizeTiles() {
        const unpinnedSockets = this.sockets.filter(socket => !socket.pinned);

        for (let i = 0; i < unpinnedSockets.length - 1; i++) {
            const socketA = unpinnedSockets[i];
            const otherSocketIndex = Math.floor(randomUniform(i + 1, unpinnedSockets.length)());
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
            .transition().duration(500).delay(d => d.y + d.x * 0.625).ease(easeQuad)
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
            .transition().duration(500).delay(d => d.y + d.x * 0.625).ease(easeQuad)
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
            .transition().duration(350).ease(easeCubicOut)
            .call(transitioningTile => {
                transitioningTile.select('.pin')
                    .style('fill-opacity', 0);
            })
            .transition().duration(500).delay(d => d.y + d.x * 0.625).ease(easeQuad)
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

        await this.enqueueAnimation(async () => {
            await sleep(1000);
            await this.animateTilesOutAfterWin();
        });
        this.resolvePlayPromise({complete: true, numberOfMoves: this.numberOfMoves});
    }

    async abort() {
        this.interaction.deactivate();

        await this.currentAnimationPromise;
        this.resolvePlayPromise({complete: false, numberOfMoves: this.numberOfMoves});
    }

    enqueueAnimation(callback) {
        this.currentAnimationPromise = this.currentAnimationPromise.then(callback);
        return this.currentAnimationPromise;
    }

}

async function sleep(durationInMillis) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), durationInMillis);
    });
}

export default Gameboard;
