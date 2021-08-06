import {SCRIPT_ID} from '../const';

function serializeTags(arr: string[]): string {
  return arr.join(', ');
}

function deserializeTags(str: string): string[] {
  if (str === '') {
    return [];
  } else {
    const arr = str.split(',').map(tag => tag.trim());
    const tags: string[] = [];
    for (const tag of arr) {
      if (tags.includes(tag)) continue;
      tags.push(tag);
    }
    return tags;
  }
}

/*
 *  Workaround for Firefox version of Violentmonkey:
 *  Because these permissions doesn't work properly when run as content script
 *  And script won't run at all when run in page context
 */
function GM_setValue<T = unknown>(id: string, value: T): void {
  window.localStorage.setItem(SCRIPT_ID + '__' + id, JSON.stringify(value));
}
function GM_getValue<T = unknown>(id: string, defaultValue: T): T {
  const val = window.localStorage.getItem(SCRIPT_ID + '__' + id);
  return (val !== null) ? JSON.parse(val) : defaultValue;
}

export {
  serializeTags,
  deserializeTags,
  GM_setValue,
  GM_getValue
};
