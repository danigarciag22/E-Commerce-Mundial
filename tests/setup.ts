// Provide a working localStorage for Node 25 + jsdom environments.
// Node 25 exposes a global `localStorage` that has no setItem/getItem
// (it requires --localstorage-file), which shadows jsdom's storage.
// This replaces it with a simple in-memory implementation.

class InMemoryStorage implements Storage {
  private store: Record<string, string> = {}

  get length() {
    return Object.keys(this.store).length
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null
  }

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key)
      ? this.store[key]
      : null
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value)
  }

  removeItem(key: string): void {
    delete this.store[key]
  }

  clear(): void {
    this.store = {}
  }
}

const inMemoryLocalStorage = new InMemoryStorage()
const inMemorySessionStorage = new InMemoryStorage()

Object.defineProperty(globalThis, 'localStorage', {
  value: inMemoryLocalStorage,
  writable: true,
  configurable: true,
})

Object.defineProperty(globalThis, 'sessionStorage', {
  value: inMemorySessionStorage,
  writable: true,
  configurable: true,
})
