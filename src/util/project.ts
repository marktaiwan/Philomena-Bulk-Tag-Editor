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

export {
  serializeTags,
  deserializeTags,
};
