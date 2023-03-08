type CacheDataType = number | {
    url: string;
    code: string;
    hash: string;
};

const cache: Record<string, {
    time: number;
    data: CacheDataType;
}> = {};

const cacheTime = 60 * 1000;

setInterval(() => {
    for (const [ code, data ] of Object.entries(cache)) {
        if (Date.now() >= data.time + cacheTime) {
            delete cache[code];
        }
    }
}, cacheTime);

export default {
    set(code: string, data: CacheDataType): void {
        if (code == "_count" && cache[code]) return;

        cache[code] = {
            time: Date.now(),
            data
        };
    },

    get(code: string): CacheDataType {
        return cache[code]?.data;
    },

    delete(code: string): void {
        delete cache[code];
    }
};