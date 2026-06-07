// In-memory AsyncStorage mock — replaces the native bridge in Jest.
// A new Map is created each time the module is loaded, so jest.resetModules()
// gives every test group a clean slate with no leftover persisted votes.
const store = new Map();

const AsyncStorage = {
  getItem: jest.fn((key) => Promise.resolve(store.has(key) ? store.get(key) : null)),
  setItem: jest.fn((key, value) => {
    store.set(key, value);
    return Promise.resolve();
  }),
  removeItem: jest.fn((key) => {
    store.delete(key);
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach((k) => store.delete(k));
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve([...store.keys()])),
  clear: jest.fn(() => {
    store.clear();
    return Promise.resolve();
  }),
};

module.exports = { default: AsyncStorage, __esModule: true };
