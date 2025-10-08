type BooruKeys = [
  'derpibooru',
  'ponybooru',
  'ponerpics',
  'twibooru',
][number];

type BooruData = {
  cooldown: number,
  acSource: string,
  editApiPath: string,
  imageApiPath: string,
  authTokenParam: string,
  oldTagParam: string,
  newTagParam: string,
  imagelistSelector: string,
};

const SCRIPT_ID = 'bulk_tag_editor';
const booruDefault: BooruData = {
  cooldown: 5000,
  acSource: '/autocomplete/tags?term=',
  editApiPath: '/images/',
  imageApiPath: '/api/v1/json/images/',
  authTokenParam: '_csrf_token',
  oldTagParam: 'image[old_tag_input]',
  newTagParam: 'image[tag_input]',
  imagelistSelector: '#imagelist-container > section.block__header > div.flex__right',
};
const boorus: Record<BooruKeys, Readonly<BooruData>> = {
  derpibooru: booruDefault,
  ponybooru: booruDefault,
  ponerpics: booruDefault,
  twibooru: {
    ...booruDefault,
    acSource: '/tags/autocomplete.json?term=',
    editApiPath: '/posts/',
    imageApiPath: '/api/v3/posts/',
    authTokenParam: 'authenticity_token',
    oldTagParam: 'post[old_tag_list]',
    newTagParam: 'post[tag_input]',
    imagelistSelector: '#imagelist_container > section.block__header > div.flex__right',
  },
};

export type {
  BooruKeys,
  BooruData,
};
export {
  SCRIPT_ID,
  boorus,
};
