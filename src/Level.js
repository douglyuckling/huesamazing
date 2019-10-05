import {interpolateRgb} from 'd3-interpolate';
import {scaleLinear} from 'd3-scale';

class Level {

    constructor(rawLevelData) {
        this.anchorColors = rawLevelData.anchorColors;
        const [nCols, nRows] = rawLevelData.resolution;
        this.nCols = nCols;
        this.nRows = nRows;
        this.pinnedTileIds = new Set(rawLevelData.pinnedTiles);
        this.showTargetStateBeforeRandomizing = rawLevelData.showTargetStateBeforeRandomizing;
        this.interpolateFn = interpolateRgb;
    }

    getTileData() {
        const colors = this.computeTileColors();
        const tiles = new Array(this.nRows * this.nCols);
        for (let j = 0; j < this.nRows; j++) {
            for (let i = 0; i < this.nCols; i++) {
                const id = `${i},${j}`;
                tiles[j * this.nCols + i] = {
                    id: id,
                    col: i,
                    row: j,
                    color: colors[j][i],
                    pinned: this.pinnedTileIds.has(id),
                };
            }
        }
        return tiles;
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
        const hColorScale = scaleLinear()
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
