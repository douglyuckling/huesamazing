class Tile {

    constructor({id, color, pinned}) {
        this.id = id;
        this.color = color;
        this.pinned = pinned;

        /** @private */
        this._mutableFields = {
            x: NaN,
            y: NaN,
            width: NaN,
            height: NaN,
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

    get width() {
        return this._mutableFields.width;
    }

    set width(width) {
        this._mutableFields.width = width;
    }

    get height() {
        return this._mutableFields.height;
    }

    set height(height) {
        this._mutableFields.height = height;
    }

}

export default Tile;
