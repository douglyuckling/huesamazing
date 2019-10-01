import * as d3 from 'd3';
import Emitter from 'tiny-emitter';

class GameboardInteraction {

    constructor(gameboard) {
        this.gameboard = gameboard;
        this.active = false;
        this.emitter = new Emitter();
        this.currentGesture = null;
        this.selectedTileGesture = null;
        this.attachEventListeners(this.gameboard.rootEl);
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    attachEventListeners(delegateEl) {
        delegateEl.addEventListener('touchstart', event => this.onTouchStart(delegateEl, event));
        delegateEl.addEventListener('mousedown', event => this.onMouseDown(delegateEl, event));
    }

    onTouchStart(delegateEl, touchStartEvent) {
        touchStartEvent.preventDefault();

        if (touchStartEvent.changedTouches.length > 0) {
            const touch = touchStartEvent.changedTouches[0];
            this.onBeginGesture(delegateEl, touch.target, {
                x: touch.clientX,
                y: touch.clientY,
            }, touch.identifier, touchStartEvent);
        }
    }

    onMouseDown(delegateEl, mouseDownEvent) {
        if (mouseDownEvent.button === 0) {
            this.onBeginGesture(delegateEl, mouseDownEvent.target, {
                x: mouseDownEvent.clientX,
                y: mouseDownEvent.clientY,
            }, 0, mouseDownEvent);
        }
    }

    onBeginGesture(delegateEl, target, clientCoordinates, pointerId, beginGestureEvent) {
        if (!this.active) { return; }

        if (this.currentGesture) { return; } // If there's an existing gesture, don't start a new one.

        let currentTarget = target;
        while (currentTarget && currentTarget !== delegateEl) {
            if (currentTarget.matches('.tile')) {
                this.onBeginGestureInTileEl(currentTarget, clientCoordinates, pointerId, beginGestureEvent);
            }
            currentTarget = currentTarget.parentElement;
        }
    }

    onBeginGestureInTileEl(tileEl, gestureBeginClientCoordinates, pointerId, beginGestureEvent) {
        const tile = d3.select(tileEl).datum();

        if (!tile) {
            console.warn("No data found for tile element", tileEl);
            return;
        }

        if (tile.pinned) { return; }

        const originalSocket = this.gameboard.getSocketHoldingTile(tile);

        const gesture = {
            tile: tile,
            originalSocket: originalSocket,
            grabOffset: getClientCoordinatesRelativeToSvgElement(gestureBeginClientCoordinates, tileEl),
            draggedOverOtherTiles: false,
            end: () => {
                window.removeEventListener('touchmove', onTouchMove);
                window.removeEventListener('touchend', onTouchEnd);
                window.removeEventListener('touchcancel', onTouchCancel);
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);

                if (this.currentGesture === gesture) {
                    this.currentGesture = null;
                }
            },
        };

        const onContinueGesture = (gestureMoveClientCoordinates) => {
            const gestureMoveCoordinates = getClientCoordinatesRelativeToSvgElement(gestureMoveClientCoordinates, tileEl.parentElement);
            tile.x = gestureMoveCoordinates.x - gesture.grabOffset.x;
            tile.y = gestureMoveCoordinates.y - gesture.grabOffset.y;

            if (tile.x < gesture.originalSocket.bounds.xMin || tile.x > gesture.originalSocket.bounds.xMax ||
                tile.y < gesture.originalSocket.bounds.yMin || tile.y > gesture.originalSocket.bounds.yMax) {
                gesture.draggedOverOtherTiles = true;

                if (this.selectedTileGesture) {
                    const selectedSocket = this.selectedTileGesture.originalSocket;
                    this.selectedTileGesture = null;
                    this.emitter.emit('abortTileSelectionBasedSwapGesture', selectedSocket);
                }
            }

            this.emitter.emit('updateTileGesture', gesture);
        };

        const onTouchMove = (touchMoveEvent) => {
            touchMoveEvent.preventDefault();

            for (const touch of touchMoveEvent.changedTouches) {
                if (touch.identifier === pointerId) {
                    onContinueGesture({x: touch.clientX, y: touch.clientY});
                }
            }
        };

        const onTouchEnd = (touchEndEvent) => {
            touchEndEvent.preventDefault();

            for (const touch of touchEndEvent.changedTouches) {
                if (touch.identifier === pointerId) {
                    gesture.end();
                    this.onCompleteGesture(gesture);
                }
            }
        };

        const onTouchCancel = (touchCancelEvent) => {
            touchCancelEvent.preventDefault();

            for (const touch of touchCancelEvent.changedTouches) {
                if (touch.identifier === pointerId) {
                    gesture.end();
                    this.onCancelGesture(gesture);
                }
            }
        };

        const onMouseMove = (mouseMoveEvent) => {
            onContinueGesture({x: mouseMoveEvent.clientX, y: mouseMoveEvent.clientY});
        };

        const onMouseUp = (mouseUpEvent) => {

            if (mouseUpEvent.button === pointerId) {
                gesture.end();
                this.onCompleteGesture(gesture);
            }
        };

        window.addEventListener('touchmove', onTouchMove, {passive: false});
        window.addEventListener('touchend', onTouchEnd, {passive: false});
        window.addEventListener('touchcancel', onTouchCancel, {passive: false});
        window.addEventListener('mousemove', onMouseMove, {passive: false});
        window.addEventListener('mouseup', onMouseUp, {passive: false});

        this.currentGesture = gesture;

        this.emitter.emit('beginTileGesture', gesture);
    }

    onCompleteGesture(gesture) {
        if (gesture.draggedOverOtherTiles) {
            this.onCompleteTileDragGesture(gesture);
        } else {
            this.onCompleteTileSelectionGesture(gesture);
        }
    }

    onCompleteTileDragGesture(gesture) {
        const targetSocket = this.gameboard.getSocketAtPosition({x: gesture.tile.x, y: gesture.tile.y});
        if (targetSocket && targetSocket !== gesture.originalSocket && !targetSocket.pinned) {
            this.emitter.emit('completeTileDragBasedSwapGesture', gesture.originalSocket, targetSocket);
        } else {
            this.emitter.emit('abortTileDragBasedSwapGesture', gesture.originalSocket, gesture.draggedOverOtherTiles);
        }
    }

    onCompleteTileSelectionGesture(gesture) {
        if (this.selectedTileGesture) {
            const socketA = this.selectedTileGesture.originalSocket;
            const socketB = gesture.originalSocket;
            this.selectedTileGesture = null;

            if (socketA !== socketB) {
                this.emitter.emit('completeTileSelectionBasedSwapGesture', socketA, socketB);
            } else {
                this.emitter.emit('abortTileSelectionBasedSwapGesture', socketA);
            }

        } else {
            const socket = gesture.originalSocket;

            this.selectedTileGesture = gesture;

            this.emitter.emit('completeTileSelectionGesture', socket);
        }
    }

    onCancelGesture(gesture) {
        if (gesture.draggedOverOtherTiles) {
            this.onCancelTileDragGesture(gesture);
        } else {
            this.onCancelTileSelectionGesture(gesture);
        }
    }

    onCancelTileDragGesture(gesture) {
        this.emitter.emit('abortTileDragBasedSwapGesture', gesture.originalSocket, gesture.draggedOverOtherTiles);
    }

    onCancelTileSelectionGesture(gesture) {
        this.emitter.emit('abortTileSelectionGesture', gesture.originalSocket);
    }

}

function getClientCoordinatesRelativeToSvgElement({x, y}, el) {
    const ownerSVGElement = el instanceof SVGSVGElement ? el : el.ownerSVGElement;
    const point = ownerSVGElement.createSVGPoint();
    point.x = x;
    point.y = y;
    const transformedPoint = point.matrixTransform(el.getScreenCTM().inverse());
    return {
        x: transformedPoint.x,
        y: transformedPoint.y,
    };
}

export default GameboardInteraction;
