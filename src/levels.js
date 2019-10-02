import Level from './Level';

const levels = [

    new Level({
        anchorColors: {
            'TL': '#31bcf5', 'TR': '#1f5ecb',
            'BL': '#dbe843', 'BR': '#ec8282',
        },
        resolution: [5, 7],
        pinnedTiles: [
            '0,0', '1,0', '2,0', '3,0', '4,0',
            '0,1',        '2,1',        '4,1',
            '0,2',        '2,2',        '4,2',
            '0,3',        '2,3',        '4,3',
            '0,4',        '2,4',        '4,4',
            '0,5',        '2,5',        '4,5',
            '0,6', '1,6', '2,6', '3,6', '4,6',
        ],
        showTargetStateBeforeRandomizing: true,
    }),

    new Level({
        anchorColors: {
            'TL': '#6349e2', 'TR': '#ffe7e6',
            'BL': '#a10758', 'BR': '#e3c122',
        },
        resolution: [5, 7],
        pinnedTiles: ['1,1', '3,1', '1,5', '3,5'],
        showTargetStateBeforeRandomizing: true,
    }),

];

Object.freeze(levels);

export default levels;

