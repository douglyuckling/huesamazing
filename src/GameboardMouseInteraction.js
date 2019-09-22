import * as d3 from 'd3';
import Emitter from 'tiny-emitter';

class GameboardMouseInteraction {

    constructor(gameboard) {
        this.gameboard = gameboard;
        this.active = false;
        this.emitter = new Emitter();
        this.currentGesture = null;
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

        const gesture = {
            tile: tile,
            tileEl: tileEl,
            originalPosition: {x: tile.x, y: tile.y},
            grabOffset: getEventCoordinatesRelativeToSvgElement(mouseDownEvent, tileEl),
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

            this.emitter.emit('updateTileGesture', gesture);
        };
        window.addEventListener('mousemove', onMouseMove);

        const onMouseUp = (mouseUpEvent) => {
            gesture.end();

            this.emitter.emit('endTileGesture', gesture);
        };
        window.addEventListener('mouseup', onMouseUp);

        this.currentGesture = gesture;

        this.emitter.emit('beginTileGesture', gesture);
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
