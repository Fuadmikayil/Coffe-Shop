// lib/cookieStorage.js

export const cookieStorage = {
    getItem(key) {
      const match = document.cookie.match(
        new RegExp('(?:^|; )' +
          key.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') +
          '=([^;]*)')
      )
      return match ? decodeURIComponent(match[1]) : null
    },
    setItem(key, value) {
      // burda max‐age istədiyin qədər günə təyin et
      document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 30}`
    },
    removeItem(key) {
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
  }