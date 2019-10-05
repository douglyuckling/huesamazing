import Tile from './Tile';

class Socket {

    constructor(gameboard, {id, col, row, color, pinned}) {
        this.gameboard = gameboard;
        this.id = id;
        this.col = col;
        this.row = row;
        this.pinned = pinned;

        /** @private */
        this._mutableFields = {
            tile: new Tile({id, color, pinned}),
        };

        Object.freeze(this);
    }

    get position() {
        return {
            x: (this.col + 0.5) * this.gameboard.defaultTileDimensions.width,
            y: (this.row + 0.5) * this.gameboard.defaultTileDimensions.height
        };
    }

    get dimensions() {
        return {
            width: this.gameboard.defaultTileDimensions.width,
            height: this.gameboard.defaultTileDimensions.height
        };
    }

    get bounds() {
        const {x, y} = this.position;
        const {width, height} = this.dimensions;
        return {
            xMin: x - width / 2,
            xMax: x + width / 2,
            yMin: y - height / 2,
            yMax: y + height / 2,
        };
    }

    get tile() {
        return this._mutableFields.tile;
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
