import Tile from './Tile';

class Socket {

    constructor({id, col, row, color, pinned}) {
        this.id = id;
        this.col = col;
        this.row = row;
        this.pinned = pinned;

        /** @private */
        this._mutableFields = {
            position: {x: NaN, y: NaN},
            dimensions: {width: NaN, height: NaN},
            bounds: {xMin: NaN, xMax: NaN, yMin: NaN, yMax: NaN},
            tile: new Tile({id, color, pinned}),
        };

        Object.freeze(this);
    }

    get position() {
        return Object.freeze(Object.assign({}, this._mutableFields.position));
    }

    get dimensions() {
        return Object.freeze(Object.assign({}, this._mutableFields.dimensions));
    }

    get bounds() {
        return Object.freeze(Object.assign({}, this._mutableFields.bounds));
    }

    get tile() {
        return this._mutableFields.tile;
    }

    setBoardTileDimensions({width, height}) {
        const x = (this.col + 0.5) * width;
        const y = (this.row + 0.5) * height;

        Object.assign(this._mutableFields.position, {x, y});
        Object.assign(this._mutableFields.dimensions, {width, height});
        Object.assign(this._mutableFields.bounds, {
            xMin: x - width / 2,
            xMax: x + width / 2,
            yMin: y - height / 2,
            yMax: y + height / 2,
        });
    }

    swapTilesWith(otherSocket) {
        const temp = this._mutableFields.tile;
        this._mutableFields.tile = otherSocket._mutableFields.tile;
        otherSocket._mutableFields.tile = temp;
    }

    containsPoint({x, y}) {
        const bounds = this.bounds;
        return (
            x >= bounds.xMin && x <= bounds.xMax &&
            y >= bounds.yMin && y <= bounds.yMax);
    }

}

export default Socket;
