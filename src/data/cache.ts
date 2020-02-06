import EventEmitter from '@src/util/event.emitter';
import SelectionSource from '../selection-engine/selection-source.service';
import {ERROR} from '../model/selection-types.model'

class Cache extends EventEmitter {
    private _data: Map<string, SelectionSource> = new Map();

    constructor() {
        super();
    }

    get data() {
        return this.getAll();
    }

    set data(map) {
        throw ERROR.CACHE_SET_ERROR;
    }

    save(source: SelectionSource | SelectionSource[]): void {
        if (!Array.isArray(source)) {
            this._data.set(source.id, source);
            return;
        }
        source.forEach(s => this._data.set(s.id, s));
    }

    get(id: string): SelectionSource {
        return this._data.get(id);
    }

    remove(id: string): void {
        this._data.delete(id);
    }

    getAll(): SelectionSource[] {
        const list: SelectionSource[] = [];
        this._data = new Map();
        for (let pair of this._data) {
            list.push(pair[1]);
        }
        return list;
    }

    removeAll(): string[] {
        const ids: string[] = [];
        for (let pair of this._data) {
            ids.push(pair[0]);
        }
        this._data = new Map();
        return ids;
    }
}

export default Cache;