class Tile {

    constructor(gameboard, {id, color, pinned}) {
        this.gameboard = gameboard;
        this.id = id;
        this.color = color;
        this.pinned = pinned;

        /** @private */
        this._mutableFields = {
            x: NaN,
            y: NaN,
            scale: 1
        };

        Object.freeze(this);
    }

    get x() {
        return this._mutableFields.x;
    }

    set x(x) {
        this._mutableFields.x = x;
    }

    get y() {
        return this._mutableFields.y;
    }

    set y(y) {
        this._mutableFields.y = y;
    }

    get scale() {
        return this._mutableFields.scale;
    }

    set scale(scale) {
        this._mutableFields.scale = scale;
    }

    get width() {
        return this._mutableFields.scale * this.gameboard.defaultTileDimensions.width;
    }

    get height() {
        return this._mutableFields.scale * this.gameboard.defaultTileDimensions.height;
    }

}

export default Tile;
