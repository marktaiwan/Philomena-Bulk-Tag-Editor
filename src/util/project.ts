import type {BooruKeys, BooruData} from '../globals';
import type {Philomena, Twibooru} from '../../types/BooruApi';
import {$} from './common';
import {SCRIPT_ID, boorus} from '../globals';

function serializeTags(tags: string[] | Set<string>): string {
  const arr = tags instanceof Array ? tags : [...tags];
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

/**
 * @returns Booru key. `null` if none match.
 */
function currentBooru(): BooruKeys {
  const booruHostnames: Record<BooruKeys, RegExp> = {
    twibooru: (/(www\.)?twibooru\.org/i),
    ponybooru: (/(www\.)?ponybooru\.org/i),
    ponerpics: (/(www\.)?ponerpics\.(org|com)/i),
    derpibooru: (/(www\.)?(derpibooru|trixiebooru)\.org/i),
  };
  const hostname = window.location.hostname;
  for (const [booru, re] of Object.entries(booruHostnames) as Array<[BooruKeys, RegExp]>) {
    if (re.test(hostname)) return booru;
  }
  throw Error('Could not match current booru');
}

function getBooruParam<T extends keyof BooruData>(key: T): BooruData[T] {
  const booruId = currentBooru();
  return boorus[booruId][key];
}

function getToken(): string {
  const ele = $<HTMLMetaElement>('meta[name="csrf-token"]');
  if (!ele) throw Error('csrf token element not found');
  return ele.content;
}

async function throttle<ReturnType, T extends unknown[]>(fn: (...args: [...T]) => ReturnType, ...args: [...T]): Promise<ReturnType> {
  const key = currentBooru() + '_last_exec';
  const cooldown = getBooruParam('cooldown');
  const lastRan = GM_getValue(key, 0) as number;
  const elapsed = Date.now() - lastRan;
  const timeRemain = Math.max(0, cooldown - elapsed);

  const result = await new Promise(resolve => {
    window.setTimeout(() => {
      resolve(fn(...args));
    }, timeRemain);
  });

  GM_setValue(key, Date.now());
  return result as ReturnType;
}

function setMessage(text: string): void {
  const section = document.getElementById(`${SCRIPT_ID}--message`);
  if (section) section.innerText = text;
}

async function getTagsFromId(id: string): Promise<Set<string>> {
  const path = window.location.origin + getBooruParam('imageApiPath') + id;
  const json = await fetch(path).then(resp => resp.json()) as Philomena.Api.Image | Twibooru.Api.Image;
  const metadata = 'image' in json ? json.image : json.post;
  return new Set(metadata.tags);
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
  getBooruParam,
  getToken,
  throttle,
  setMessage,
  getTagsFromId,
  GM_setValue,
  GM_getValue
};
