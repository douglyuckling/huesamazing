import ilovehueDatabase from './ilovehue-database.json';
import {createLevelFromILoveHueLevelDescriptor} from './ILoveHueParsers';

const levels = [];

for (const levelSet of ilovehueDatabase.sets) {
    for (const levelDescriptor of levelSet.levels) {
        try {
            if (levelDescriptor.gridType === 'rect') {
                const level = createLevelFromILoveHueLevelDescriptor(levelDescriptor);
                levels.push(level);
            }
        } catch (e) {
            console.error(
                `Failed to load level ${levelDescriptor.index} of set ${levelSet.category}:${levelSet.id}`,
                `(index ${levels.length})`,
            );
            throw e;
        }
    }
}

Object.freeze(levels);

export default levels;

