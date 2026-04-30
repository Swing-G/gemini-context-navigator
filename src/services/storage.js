class GeminiNavigatorStorage {
  constructor(defaultSettings) {
    this.defaultSettings = defaultSettings;
  }

  loadSettings() {
    return new Promise((resolve) => {
      if (
        typeof chrome !== 'undefined' &&
        chrome.storage &&
        chrome.storage.sync
      ) {
        chrome.storage.sync.get(this.defaultSettings, (items) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            resolve({ ...this.defaultSettings });
            return;
          }

          resolve(items);
        });
        return;
      }

      resolve({ ...this.defaultSettings });
    });
  }
}
