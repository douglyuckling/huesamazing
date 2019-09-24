import * as d3 from 'd3';

class Level {

    constructor(rawLevelData) {
        this.anchorColors = rawLevelData.anchorColors;
        const [nCols, nRows] = rawLevelData.resolution;
        this.nCols = nCols;
        this.nRows = nRows;
        this.pinnedTileIds = new Set(rawLevelData.pinnedTiles);
        this.interpolateFn = d3.interpolateRgb;
    }

    createSockets() {
        const colors = this.computeTileColors();
        const sockets = new Array(this.nRows * this.nCols);
        for (let j = 0; j < this.nRows; j++) {
            for (let i = 0; i < this.nCols; i++) {
                const id = `${i},${j}`;
                const socket = {
                    id: id,
                    col: i,
                    row: j,
                    pinned: this.pinnedTileIds.has(id),
                    position: {x: NaN, y: NaN},
                    dimensions: {width: NaN, height: NaN},
                    bounds: {xMin: NaN, xMax: NaN, yMin: NaN, yMax: NaN},
                };
                sockets[j * this.nCols + i] = socket;
                socket.tile = {
                    id: id,
                    color: d3.color(colors[j][i]),
                    pinned: socket.pinned,
                    x: NaN,
                    y: NaN,
                    width: NaN,
                    height: NaN,
                };
            }
        }
        return sockets;
    }

    computeTileColors() {
        const col0Colors = this.interpolateColors(this.anchorColors['TL'], this.anchorColors['BL'], this.nRows);
        const col1Colors = this.interpolateColors(this.anchorColors['TR'], this.anchorColors['BR'], this.nRows);

        const colors = new Array(this.nRows);
        for (let i = 0; i < colors.length; i++) {
            colors[i] = this.interpolateColors(col0Colors[i], col1Colors[i], this.nCols);
        }

        return colors;
    }

    interpolateColors(color0, color1, nDivs) {
        const hColorScale = d3.scaleLinear()
            .domain([0, nDivs - 1])
            .range([color0, color1])
            .interpolate(this.interpolateFn);

        const colors = new Array(nDivs);
        for (let i = 0; i < colors.length; i++) {
            colors[i] = hColorScale(i);
        }

        return colors;
    }

}

export default Level;
