const NS = 'persona_chat:';

export const storage = {
  /**
   * @param {string} key
   */
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(NS + key));
    } catch {
      return null;
    }
  },

  /**
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    localStorage.setItem(NS + key, JSON.stringify(value));
  },

  /**
   * @param {string} key
   */
  remove(key) {
    localStorage.removeItem(NS + key);
  },

  keys() {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(NS))
      .map((k) => k.slice(NS.length));
  },
};
