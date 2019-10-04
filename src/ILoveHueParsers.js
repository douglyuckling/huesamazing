import Level from './Level';

const pinPatternFunctions = {

    'first': (width, height, pin) => {
        let row = 0;
        for (let col = 0; col < width; col++) {
            pin(col, row);
        }
        for (row = 1; row < height - 1; row++) {
            pin(0, row);
            pin(width - 1, row);
        }
        for (let col = 0; col < width; col++) {
            pin(col, row);
        }
    },

    'left-right-open': (width, height, pin) => {
        let row = 0;
        for (let col = 0; col < width; col++) {
            pin(col, row);
        }
        for (row = 1; row < height - 1; row++) {
            for (let col = 1; col < width - 1; col++) {
                pin(col, row);
            }
        }
        for (let col = 0; col < width; col++) {
            pin(col, row);
        }
    },

    'edges-and-central-column': (width, height, pin) => {
        const centralCol = Math.floor(width / 2);
        let row = 0;
        for (let col = 0; col < width; col++) {
            pin(col, row);
        }
        for (row = 1; row < height - 1; row++) {
            pin(0, row);
            pin(centralCol, row);
            pin(width - 1, row);
        }
        for (let col = 0; col < width; col++) {
            pin(col, row);
        }
    },

    'horiz': (width, height, pin) => {
        for (let row = 0; row < height; row++) {
            if (row % 2 === 0) {
                for (let col = 0; col < width; col++) {
                    pin(col, row);
                }
            }
        }
    },

    'not-edges': (width, height, pin) => {
        let row = 0;
        pin(0, row);
        pin(width - 1, row);
        for (row = 1; row < height - 1; row++) {
            for (let col = 1; col < width - 1; col++) {
                pin(col, row);
            }
        }
        pin(0, row);
        pin(width - 1, row);
    },

    'carpet-3-4': (width, height, pin) => {
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if (col % 3 === 0 || row % 4 === 0) {
                    pin(col, row);
                }
            }
        }
    },

    'diagonal-4': (width, height, pin) => {
        pin(0, 0);
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if (col >= 4 - row && col < (width - 4 - (row - (height - 1)))) {
                    pin(col, row);
                }
            }
        }
        pin(width - 1, height - 1);
    },

    'edges': (width, height, pin) => {
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if (col === 0 || row === 0 || col === width - 1 || row === height - 1) {
                    pin(col, row);
                }
            }
        }
    },

    'grid-2-2': (width, height, pin) => {
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if (col % 2 === 0 && row % 2 === 0) {
                    pin(col, row);
                }
            }
        }
    },

    'center-edges-full': (width, height, pin) => {
        const centralCol = Math.floor(width / 2);
        const centralRow = Math.floor(height / 2);
        for (let row = 0; row < height; row++) {
            const isActiveRow = row === 0 || row === centralRow || row === height - 1;
            for (let col = 0; col < width; col++) {
                const isActiveCol = col === 0 || col === centralCol || col === width - 1;
                if (isActiveRow && isActiveCol) {
                    pin(col, row);
                }
            }
        }
    },

    'top-bottom': (width, height, pin) => {
        for (let col = 0; col < width; col++) {
            pin(col, 0);
        }
        for (let col = 0; col < width; col++) {
            pin(col, height - 1);
        }
    },

    'center-edges': (width, height, pin) => {
        const centralCol = Math.floor(width / 2);
        const centralRow = Math.floor(height / 2);
        for (let row = 0; row < height; row++) {
            const isActiveRow = row === 0 || row === centralRow || row === height - 1;
            for (let col = 0; col < width; col++) {
                const isActiveCol = col === 0 || col === centralCol || col === width - 1;
                if (isActiveRow && isActiveCol && !(row === centralRow && col === centralCol)) {
                    pin(col, row);
                }
            }
        }
    },

    'checkers': (width, height, pin) => {
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if ((col + row) % 2 === 0) {
                    pin(col, row);
                }
            }
        }
    },

    'left-right': (width, height, pin) => {
        for (let row = 0; row < height; row++) {
            pin(0, row);
            pin(width - 1, row);
        }
    },

    'center': (width, height, pin) => {
        pin(0, 0);
        pin(width - 1, 0);
        pin(Math.floor(width / 2), Math.floor(height / 2));
        pin(0, height - 1);
        pin(width - 1, height - 1);
    },

    'corners': (width, height, pin) => {
        pin(0, 0);
        pin(width - 1, 0);
        pin(0, height - 1);
        pin(width - 1, height - 1);
    },

    'carpet-4-5': (width, height, pin) => {
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if (col % 4 === 0 || row % 5 === 0) {
                    pin(col, row);
                }
            }
        }
    },

    'carpet-3-3': (width, height, pin) => {
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if (col % 3 === 0 || row % 3 === 0) {
                    pin(col, row);
                }
            }
        }
    },

    'carpet-5-6': (width, height, pin) => {
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if (col % 5 === 0 || row % 6 === 0) {
                    pin(col, row);
                }
            }
        }
    },

    'missing-BR': (width, height, pin) => {
        pin(0, 0);
        pin(width - 1, 0);
        pin(0, height - 1);
    },

    'missing-TL': (width, height, pin) => {
        pin(width - 1, 0);
        pin(0, height - 1);
        pin(width - 1, height - 1);
    },

    'cross': (width, height, pin) => {
        const centralCol = Math.floor(width / 2);
        const centralRow = Math.floor(height / 2);
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if (col === centralCol || row === centralRow) {
                    pin(col, row);
                }
            }
        }
    },

    'nsewc': (width, height, pin) => {
        const centralCol = Math.floor(width / 2);
        const centralRow = Math.floor(height / 2);

        pin(centralCol, 0);
        pin(0, centralRow);
        pin(centralCol, centralRow);
        pin(width - 1, centralRow);
        pin(centralCol, height - 1);
    },

    'nsew': (width, height, pin) => {
        const centralCol = Math.floor(width / 2);
        const centralRow = Math.floor(height / 2);

        pin(centralCol, 0);
        pin(0, centralRow);
        pin(width - 1, centralRow);
        pin(centralCol, height - 1);
    },

    '2-1': (width, height, pin) => {
        pin(0, 0);
        pin(1, 0);
        pin(0, height - 1);
    },

    'nsew-double': (width, height, pin) => {
        const centralCol = Math.floor(width / 2);
        const centralRow = Math.floor(height / 2);

        pin(centralCol - 1, 0);
        pin(centralCol, 0);
        pin(0, centralRow - 1);
        pin(0, centralRow);
        pin(width - 1, centralRow - 1);
        pin(width - 1, centralRow);
        pin(centralCol - 1, height - 1);
        pin(centralCol, height - 1);
    },

    '2-1-opp': (width, height, pin) => {
        pin(width - 2, 0);
        pin(width - 1, 0);
        pin(0, height - 1);
    },

    'inner-corners': (width, height, pin) => {
        pin(width - 2, 1);
        pin(1, height - 2);
        pin(width - 2, height - 2);
    },

    'ew-double': (width, height, pin) => {
        const centralRow = Math.floor(height / 2);

        pin(0, centralRow - 1);
        pin(0, centralRow);
        pin(width - 1, centralRow - 1);
        pin(width - 1, centralRow);
    },

    'tl-tri': (width, height, pin) => {
        pin(0, 0);
        pin(1, 0);
        pin(0, 1);
    },

    'inner-nsew': (width, height, pin) => {
        const centralCol = Math.floor(width / 2);
        const centralRow = Math.floor(height / 2);

        pin(centralCol, 1);
        pin(1, centralRow);
        pin(width - 2, centralRow);
        pin(centralCol, height - 2);
    },

    'small-cross': (width, height, pin) => {
        const centralCol = Math.floor(width / 2);
        const centralRow = Math.floor(height / 2);

        pin(centralCol, centralRow - 1);
        pin(centralCol - 1, centralRow);
        pin(centralCol + 1, centralRow);
        pin(centralCol, centralRow + 1);
    },

    'tri': (width, height, pin) => {
        const centralRow = Math.floor(height / 2);

        pin(width - 1, 0);
        pin(0, centralRow);
        pin(width - 1, height - 1);
    },

    'tr-2': (width, height, pin) => {
        pin(width - 2, 0);
        pin(width - 1, 0);
    },

    'bl': (width, height, pin) => {
        pin(0, height - 1);
    },

    'ew-double-inner': (width, height, pin) => {
        const centralRow = Math.floor(height / 2);

        pin(1, centralRow - 1);
        pin(1, centralRow);
        pin(width - 2, centralRow - 1);
        pin(width - 2, centralRow);
    },

    'inner-2-1': (width, height, pin) => {
        pin(1, 1);
        pin(1, height - 2);
        pin(2, height - 2);
    },

    'tr': (width, height, pin) => {
        pin(width - 1, 0);
    },

    'br-tri': (width, height, pin) => {
        pin(width - 1, height - 2);
        pin(width - 2, height - 1);
        pin(width - 1, height - 1);
    },

    'tl-br': (width, height, pin) => {
        pin(0, 0);
        pin(width - 1, height - 1);
    },

    'crazy-center': (width, height, pin) => {
        const centralCol = Math.floor(width / 2);
        const centralRow = Math.floor(height / 2);
        pin(centralCol - 1, centralRow - 1);
    },

    'inner-tl': (width, height, pin) => {
        pin(1, 1);
    },

};

export function getPinLocations(patternName, width, height) {
    if (!(patternName in pinPatternFunctions)) {
        throw Error(`Unrecognized pin pattern: ${patternName}`);
    }

    const pinLocations = new Set();
    const pinFunction = (col, row) => {
        pinLocations.add(`${col},${row}`);
    };
    pinPatternFunctions[patternName](width, height, pinFunction);
    return Array.from(pinLocations);
}

export function createLevelFromILoveHueLevelDescriptor(d) {
    return new Level({
        anchorColors: {
            'TL': d.hex1, 'TR': d.hex2,
            'BL': d.hex3, 'BR': d.hex4,
        },
        resolution: [d.width, d.height],
        pinnedTiles: getPinLocations(d.pins, d.width, d.height),
        showTargetStateBeforeRandomizing: !d.extra.shufflePreview,
    });
}
