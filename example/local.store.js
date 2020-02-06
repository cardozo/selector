class LocalStore {
    constructor(id) {
        this.key = id !== undefined ? `highlight-${id}` : 'highlight';
    }

    storeToJson() {
        const store = localStorage.getItem(this.key);
        let sources;
        try {
            sources = JSON.parse(store) || [];
        }
        catch (e) {
            sources = [];
        }
        return sources;
    }

    jsonToStore(stores) {
        localStorage.setItem(this.key, JSON.stringify(stores));
    }

    save(data) {
        const stores = this.storeToJson();
        const map = {};
        stores.forEach((store, idx) => map[store.hs.id] = idx);

        if (!Array.isArray(data)) {
            data = [data];
        }

        data.forEach(store => {
            // update
            if (map[store.hs.id] !== undefined) {
                stores[map[store.hs.id]] = store;
            }
            // append
            else {
                stores.push(store);
            }
        })
        this.jsonToStore(stores);
    }

    forceSave(store) {
        const stores = this.storeToJson();
        stores.push(store);
        this.jsonToStore(stores);
    }

    get(id) {
        const list = this.storeToJson()
            .filter(store => store.hs.id === id)
            .map(store => ({
                hs: new HighlightSource(
                    store.hs.startMeta,
                    store.hs.endMeta,
                    store.hs.text,
                    store.hs.id
                ),
                info: store.info
            }));
        return list[0];
    }

    remove(id) {
        const stores = this.storeToJson();
        let index = null;
        for (let i = 0; i < stores.length; i++) {
            if (stores[i].hs.id === id) {
                index = i;
                break;
            }
        }
        stores.splice(index, 1);
        this.jsonToStore(stores);
    }

    getAll() {
        return this.storeToJson();
    }

    removeAll() {
        this.jsonToStore([]);
    }
}

export default LocalStore;