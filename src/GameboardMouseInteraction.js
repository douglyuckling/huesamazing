import * as d3 from 'd3';
import Emitter from 'tiny-emitter';

class GameboardMouseInteraction {

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

    attachEventListeners(delegateEl) {
        delegateEl.addEventListener('mousedown', event => this.onMouseDown(delegateEl, event));
    }

    onMouseDown(delegateEl, event) {
        if (!this.active) { return; }
        if (event.button !== 0) { return; }

        if (this.currentGesture) { return; } // If there's an existing gesture, don't start a new one.

        let currentTarget = event.target;
        while (currentTarget && currentTarget !== delegateEl) {
            if (currentTarget.matches('.tile')) {
                this.onMouseDownInTileEl(currentTarget, event);
            }
            currentTarget = currentTarget.parentElement;
        }
    }

    onMouseDownInTileEl(tileEl, mouseDownEvent) {
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
            grabOffset: getEventCoordinatesRelativeToSvgElement(mouseDownEvent, tileEl),
            draggedOverOtherTiles: false,
            end: () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);

                if (this.currentGesture === gesture) {
                    this.currentGesture = null;
                }
            },
        };

        const onMouseMove = (mouseMoveEvent) => {
            const mouse = getEventCoordinatesRelativeToSvgElement(mouseMoveEvent, tileEl.parentElement);
            tile.x = mouse.x - gesture.grabOffset.x;
            tile.y = mouse.y - gesture.grabOffset.y;

            if (tile.x < gesture.originalSocket.bounds.xMin || tile.x > gesture.originalSocket.bounds.xMax ||
                tile.y < gesture.originalSocket.bounds.yMin || tile.y > gesture.originalSocket.bounds.yMax) {
                gesture.draggedOverOtherTiles = true;
            }

            this.emitter.emit('updateTileGesture', gesture);
        };
        window.addEventListener('mousemove', onMouseMove);

        const onMouseUp = (mouseUpEvent) => {
            gesture.end();
            this.onCompleteGesture(gesture);
        };
        window.addEventListener('mouseup', onMouseUp);

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
        this.emitter.emit('completeTileDragGesture', gesture);
    }

    onCompleteTileSelectionGesture(gesture) {
        if (this.selectedTileGesture) {
            const socketA = this.selectedTileGesture.originalSocket;
            const socketB = gesture.originalSocket;
            this.selectedTileGesture = null;

            this.emitter.emit('completeTileSelectionBasedSwapGesture', socketA, socketB);
        } else {
            const socket = gesture.originalSocket;

            this.selectedTileGesture = gesture;

            this.emitter.emit('completeTileSelectionGesture', socket);
        }
    }

}

function getEventCoordinatesRelativeToSvgElement(event, el) {
    const ownerSVGElement = el instanceof SVGSVGElement ? el : el.ownerSVGElement;
    const point = ownerSVGElement.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transformedPoint = point.matrixTransform(el.getScreenCTM().inverse());
    return {
        x: transformedPoint.x,
        y: transformedPoint.y,
    };
}

export default GameboardMouseInteraction;
