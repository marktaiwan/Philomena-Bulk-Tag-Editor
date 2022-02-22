// ==UserScript==
// @name        Bulk Tag Editor (FF Violentmonkey)
// @description Streamlined bulk tag editing
// @version     1.1.3
// @author      Marker
// @license     MIT
// @namespace   https://github.com/marktaiwan/
// @homepageURL https://github.com/marktaiwan/Philomena-Bulk-Tag-Editor
// @supportURL  https://github.com/marktaiwan/Philomena-Bulk-Tag-Editor/issues
// @match       *://*.derpibooru.org/*
// @match       *://*.trixiebooru.org/*
// @match       *://*.ponybooru.org/*
// @match       *://*.ponerpics.org/*
// @match       *://*.ponerpics.com/*
// @match       *://*.twibooru.org/*
// @inject-into content
// @noframes
// @grant       none
// ==/UserScript==
(function () {
  'use strict';

  const SCRIPT_ID$1 = 'bulk_tag_editor';
  const booruDefault = {
    cooldown: 5000,
    acSource: '/autocomplete/tags?term=',
    editApiPath: '/images/',
    imageApiPath: '/api/v1/json/images/',
    authTokenParam: '_csrf_token',
    oldTagParam: 'image[old_tag_input]',
    newTagParam: 'image[tag_input]',
    imagelistSelector: '#imagelist-container section.page__header',
  };
  const boorus = {
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
      imagelistSelector: '#imagelist_container section.block__header',
    },
  };

  /* Shorthands  */
  function $(selector, root = document) {
    return root.querySelector(selector);
  }
  function $$(selector, root = document) {
    return root.querySelectorAll(selector);
  }
  function create(ele) {
    return document.createElement(ele);
  }
  function onLeftClick(callback, root = document) {
    root.addEventListener('click', e => {
      if (e instanceof PointerEvent && e.button === 0) callback(e);
    });
  }

  function serializeTags(tags) {
    const arr = tags instanceof Array ? tags : [...tags];
    return arr.join(', ');
  }
  function deserializeTags(str) {
    if (str === '') {
      return [];
    } else {
      const arr = str.split(',').map(tag => tag.trim());
      const tags = [];
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
  function currentBooru() {
    const booruHostnames = {
      twibooru: /(www\.)?twibooru\.org/i,
      ponybooru: /(www\.)?ponybooru\.org/i,
      ponerpics: /(www\.)?ponerpics\.(org|com)/i,
      derpibooru: /(www\.)?(derpibooru|trixiebooru)\.org/i,
    };
    const hostname = window.location.hostname;
    for (const [booru, re] of Object.entries(booruHostnames)) {
      if (re.test(hostname)) return booru;
    }
    throw Error('Could not match current booru');
  }
  function getBooruParam(key) {
    const booruId = currentBooru();
    return boorus[booruId][key];
  }
  function getToken() {
    const ele = $('meta[name="csrf-token"]');
    if (!ele) throw Error('csrf token element not found');
    return ele.content;
  }
  async function throttle(fn, ...args) {
    const key = currentBooru() + '_last_exec';
    const cooldown = getBooruParam('cooldown');
    const lastRan = GM_getValue(key, 0);
    const elapsed = Date.now() - lastRan;
    const timeRemain = Math.max(0, cooldown - elapsed);
    const result = await new Promise(resolve => {
      window.setTimeout(() => {
        resolve(fn(...args));
      }, timeRemain);
    });
    GM_setValue(key, Date.now());
    return result;
  }
  function setMessage(text) {
    const section = document.getElementById(`${SCRIPT_ID$1}--message`);
    if (section) section.innerText = text;
  }
  async function getTagsFromId(id) {
    const path = window.location.origin + getBooruParam('imageApiPath') + id;
    const json = await fetch(path).then(resp => resp.json());
    const metadata = 'image' in json ? json.image : json.post;
    return new Set(metadata.tags);
  }
  /*
   *  Workaround for Firefox version of Violentmonkey:
   *  Because these permissions doesn't work properly when run as content script
   *  And script won't run at all when run in page context
   */
  function GM_setValue(id, value) {
    window.localStorage.setItem(SCRIPT_ID$1 + '__' + id, JSON.stringify(value));
  }
  function GM_getValue(id, defaultValue) {
    const val = window.localStorage.getItem(SCRIPT_ID$1 + '__' + id);
    return val !== null ? JSON.parse(val) : defaultValue;
  }

  const SCRIPT_ID = 'bulk_tag_editor';

  class TagEditor {
    constructor(label, id) {
      this.id = SCRIPT_ID + '--' + id;
      this.label = label;
      this.tags = [];
      // initialize
      const wrapper = create('div');
      wrapper.id = this.id;
      wrapper.classList.add(`${SCRIPT_ID}_flex_child`);
      wrapper.style.flex = '1';
      wrapper.style.margin = '0px 5px';
      const span = create('span');
      span.innerText = this.label;
      const textarea = create('textarea');
      textarea.classList.add(
        'input',
        'input--wide',
        'tagsinput',
        'js-taginput',
        'js-taginput-plain',
        `${SCRIPT_ID}_textarea`
      );
      textarea.style.marginTop = '4px';
      textarea.style.resize = 'vertical';
      const fancyEditor = create('div');
      fancyEditor.classList.add(
        'input',
        'input--wide',
        'tagsinput',
        'js-taginput',
        'js-taginput-fancy'
      );
      fancyEditor.style.marginTop = '4px';
      fancyEditor.style.resize = 'vertical';
      const input = create('input');
      input.classList.add('input', `${SCRIPT_ID}--taginput-input`);
      [
        ['autocapitalize', 'none'],
        ['autocomplete', 'off'],
        ['data-ac', 'true'],
        ['data-ac-min-length', '3'],
        ['data-ac-source', getBooruParam('acSource')],
        ['placeholder', 'add a tag'],
        ['type', 'text'],
      ].forEach(([attr, val]) => input.setAttribute(attr, val));
      fancyEditor.append(input);
      const br = create('br');
      wrapper.appendChild(span);
      wrapper.appendChild(br);
      wrapper.appendChild(textarea);
      wrapper.appendChild(fancyEditor);
      this.dom = wrapper;
      this.plainEditor = textarea;
      this.fancyEditor = fancyEditor;
      this.inputField = input;
      this.loadTags();
      // bind event listeners
      this.dom.addEventListener('click', e => {
        if (!(e.target instanceof HTMLElement)) return;
        if (e.target.matches('.tag a[data-tag-name]')) {
          e.preventDefault();
          this.removeTag(e.target.dataset.tagName);
        }
      });
      this.inputField.addEventListener('autocomplete', e => {
        if (!(e instanceof CustomEvent)) return;
        this.addTag(e.detail.value);
        this.inputField.focus();
        this.inputField.value = '';
      });
      this.inputField.addEventListener('keydown', e => {
        const key = e.key;
        // backspace on a blank input field
        if (key === 'Backspace' && this.inputField.value === '') {
          e.preventDefault();
          const tagElement = $('.tag:last-of-type', this.fancyEditor);
          if (!tagElement) return;
          const tagName = $('[data-tag-name]', tagElement).dataset.tagName;
          this.removeTag(tagName);
        }
        // enter or comma
        if (key === 'Enter' || key === ',') {
          e.preventDefault();
          deserializeTags(this.inputField.value).forEach(this.addTag, this);
          this.inputField.value = '';
        }
      });
    }
    clearFancyEditor() {
      $$('.tag', this.fancyEditor).forEach(ele => ele.remove());
    }
    addTag(tagName) {
      // sanitize
      tagName = tagName.trim();
      // change for duplicate
      if (this.tags.includes(tagName)) return;
      this.tags.push(tagName);
      this.plainEditor.value = this.tags.join(', ');
      this.insertTagElement(tagName);
    }
    insertTagElement(tagName) {
      const tagElement = create('span');
      tagElement.classList.add('tag');
      tagElement.innerText = tagName + ' ';
      const anchor = create('a');
      anchor.href = '#';
      anchor.dataset.tagName = tagName;
      anchor.dataset.clickFocus = `#${this.id} .${SCRIPT_ID}--taginput-input`;
      anchor.innerText = 'x';
      tagElement.appendChild(anchor);
      this.inputField.before(tagElement);
    }
    removeTag(tagName) {
      const tagIndex = this.tags.findIndex(tag => tag == tagName);
      if (tagIndex > -1) {
        this.tags.splice(tagIndex, 1);
        const anchor = $(`.tag a[data-tag-name="${tagName}"]`, this.fancyEditor);
        anchor.parentElement.remove();
      }
      this.plainEditor.value = serializeTags(this.tags);
    }
    saveTags() {
      this.tags = deserializeTags(this.plainEditor.value);
      GM_setValue(this.id, this.tags);
      this.plainEditor.value = serializeTags(this.tags);
    }
    loadTags() {
      this.clearFancyEditor();
      this.tags = GM_getValue(this.id, []);
      this.tags.forEach(this.insertTagElement, this);
      this.plainEditor.value = serializeTags(this.tags);
    }
  }

  function createTagEditor() {
    const field = create('div');
    field.id = `${SCRIPT_ID$1}_script_container`;
    field.classList.add('field');
    const inputField = create('div');
    inputField.id = `${SCRIPT_ID$1}_input_field`;
    inputField.classList.add('field');
    inputField.classList.add('flex');
    field.appendChild(inputField);
    // buttons
    const applyButton = createButton('Apply changes', `${SCRIPT_ID$1}_apply_button`);
    applyButton.dataset.clickPreventdefault = 'true';
    applyButton.classList.add('button--state-primary');
    const saveButton = createButton('Save tags', `${SCRIPT_ID$1}_save_button`);
    saveButton.dataset.clickPreventdefault = 'true';
    saveButton.classList.add('button--state-success');
    const loadButton = createButton('Load tags', `${SCRIPT_ID$1}_load_button`);
    loadButton.dataset.clickPreventdefault = 'true';
    loadButton.classList.add('button--state-warning');
    field.append(applyButton, saveButton, loadButton);
    return field;
  }
  function insertUI() {
    const tagsForm = $('#tags-form');
    const tagInput = $(`[name="${getBooruParam('newTagParam')}"]`);
    if (!tagInput || !tagsForm || $(`#${SCRIPT_ID$1}_script_container`)) return; // tagging disabled or ui already exists
    const field = createTagEditor();
    const inputField = $(`#${SCRIPT_ID$1}_input_field`, field);
    const applyButton = $(`#${SCRIPT_ID$1}_apply_button`, field);
    const saveButton = $(`#${SCRIPT_ID$1}_save_button`, field);
    const loadButton = $(`#${SCRIPT_ID$1}_load_button`, field);
    // tag list input
    const tagAdd = new TagEditor('Tags to add:', 'add-editor');
    const tagRemove = new TagEditor('Tags to remove:', 'remove-editor');
    inputField.appendChild(tagAdd.dom);
    inputField.appendChild(tagRemove.dom);
    const isFancy = tagInput.classList.contains('hidden');
    if (isFancy) {
      $$('.js-taginput-plain', inputField).forEach(ele => ele.classList.add('hidden'));
    } else {
      $$('.js-taginput-fancy', inputField).forEach(ele => ele.classList.add('hidden'));
    }
    onLeftClick(() => {
      applyTags(
        deserializeTags(tagAdd.plainEditor.value),
        deserializeTags(tagRemove.plainEditor.value)
      );
    }, applyButton);
    onLeftClick(() => {
      tagAdd.saveTags();
      tagRemove.saveTags();
    }, saveButton);
    onLeftClick(() => {
      tagAdd.loadTags();
      tagRemove.loadTags();
    }, loadButton);
    $('.js-taginput-show')?.addEventListener('click', () => {
      [tagAdd, tagRemove].forEach(editor => {
        editor.tags = deserializeTags(editor.plainEditor.value);
        editor.clearFancyEditor();
        editor.tags.forEach(editor.insertTagElement, editor);
      });
    });
    $('.field', tagsForm)?.prepend(field);
  }
  function insertBulkUI() {
    const imageListHeader = $(getBooruParam('imagelistSelector'));
    if (!imageListHeader) return;
    const toggleButton = createAnchorButton('Tag Edit', `js--${SCRIPT_ID$1}--toggle`, 'fa-tags');
    onLeftClick(toggleUI, toggleButton);
    const editor = createTagEditor();
    const inputField = $(`#${SCRIPT_ID$1}_input_field`, editor);
    const applyButton = $(`#${SCRIPT_ID$1}_apply_button`, editor);
    const saveButton = $(`#${SCRIPT_ID$1}_save_button`, editor);
    const loadButton = $(`#${SCRIPT_ID$1}_load_button`, editor);
    const messageBox = create('section');
    messageBox.id = `${SCRIPT_ID$1}--message`;
    messageBox.style.margin = '5px';
    messageBox.style.minHeight = '1.2em';
    editor.append(messageBox);
    // tag list input
    const tagAdd = new TagEditor('Tags to add:', 'add-editor');
    const tagRemove = new TagEditor('Tags to remove:', 'remove-editor');
    inputField.appendChild(tagAdd.dom);
    inputField.appendChild(tagRemove.dom);
    $$('.js-taginput-plain', inputField).forEach(ele => ele.classList.add('hidden'));
    onLeftClick(async () => {
      applyButton.disabled = true;
      await bulkApplyTags(
        deserializeTags(tagAdd.plainEditor.value),
        deserializeTags(tagRemove.plainEditor.value)
      );
      applyButton.disabled = false;
    }, applyButton);
    onLeftClick(() => {
      tagAdd.saveTags();
      tagRemove.saveTags();
    }, saveButton);
    onLeftClick(() => {
      tagAdd.loadTags();
      tagRemove.loadTags();
    }, loadButton);
    editor.style.marginTop = '10px';
    editor.classList.add('layout--narrow', 'hidden');
    imageListHeader.append(toggleButton);
    imageListHeader.after(editor);
  }
  function toggleUI() {
    const editor = $(`#${SCRIPT_ID$1}_script_container`);
    const active = editorOn();
    editor.classList.toggle('hidden', active);
    if (!active) {
      document.addEventListener('click', boxClickHandler);
      getBoxHeaders().forEach(header => header.classList.add('media-box__header--unselected'));
    } else {
      document.removeEventListener('click', boxClickHandler);
      getBoxHeaders().forEach(header =>
        header.classList.remove('media-box__header--selected', 'media-box__header--unselected')
      );
    }
  }
  function editorOn() {
    const editor = $(`#${SCRIPT_ID$1}_script_container`);
    return !editor.classList.contains('hidden');
  }
  /**
   * Handles toggling the selected state of thumbnails when script is active
   */
  function boxClickHandler(e) {
    const mediaBox = e.target.closest('.media-box');
    if (mediaBox) {
      e.preventDefault();
      $('.media-box__header', mediaBox)?.classList.toggle('media-box__header--selected');
    }
  }
  function getBoxHeaders() {
    return $$('#imagelist-container .media-box__header, #imagelist_container .media-box__header');
  }
  function setAllHeader(selected) {
    getBoxHeaders().forEach(header => {
      header.classList.toggle('media-box__header--selected', selected);
    });
  }
  function createAnchorButton(text, className, icon) {
    const anchor = create('a');
    anchor.href = '#';
    anchor.dataset.clickPreventdefault = 'true';
    anchor.innerText = text;
    anchor.classList.add(className);
    if (icon) {
      const i = create('i');
      i.classList.add('fa', icon);
      anchor.prepend(i, ' ');
    }
    return anchor;
  }
  async function bulkApplyTags(tagsToAdd, tagsToRemove) {
    const imageList = [...getBoxHeaders()]
      .filter(header => header.classList.contains('media-box__header--selected'))
      .map(header => {
        const mediaBox = header.parentElement;
        const id = mediaBox.dataset.imageId ?? mediaBox.dataset.postId;
        return id;
      });
    let done = 0;
    let errors = 0;
    const total = imageList.length;
    setMessage('Initiating...');
    for (const id of imageList) {
      try {
        const tags = await getTagsFromId(id);
        const oldTags = tags;
        const newTags = new Set(tags);
        // apply tag
        tagsToAdd.forEach(tag => newTags.add(tag));
        tagsToRemove.forEach(tag => newTags.delete(tag));
        await throttle(submitEdit, id, oldTags, newTags);
      } catch (err) {
        errors += 1;
      } finally {
        setMessage(`Progress: ${++done}/${total}`);
      }
    }
    const msg = ['Completed'];
    if (errors > 0) msg.push(`with ${errors} errors`);
    setMessage(msg.join(' '));
    setAllHeader(false);
  }
  async function submitEdit(id, oldTags, newTags) {
    const path = window.location.origin + getBooruParam('editApiPath') + id + '/tags';
    const formEntries = [
      ['_method', 'put'],
      [getBooruParam('authTokenParam'), getToken()],
      [getBooruParam('oldTagParam'), serializeTags(oldTags)],
      [getBooruParam('newTagParam'), serializeTags(newTags)],
    ];
    const form = new FormData();
    formEntries.forEach(([key, val]) => form.set(key, val));
    const resp = await fetch(path, {
      method: 'POST',
      body: form,
    });
    if (resp.status !== 200) {
      throw new Error('status code: ' + resp.status);
    }
  }
  function applyTags(tagsToAdd, tagsToRemove) {
    const tagInput = $(`[name="${getBooruParam('newTagParam')}"]`);
    if (!tagInput) throw Error('Page element not found: tagInput');
    const isFancy = tagInput.classList.contains('hidden');
    const tagPool = new Set(deserializeTags(tagInput.value));
    // change to plain editor
    if (isFancy) $('.js-taginput-hide')?.click();
    // add and remove tags
    tagsToAdd.forEach(tag => tagPool.add(tag));
    tagsToRemove.forEach(tag => tagPool.delete(tag));
    tagInput.value = [...tagPool].join(', ');
    // revert tag editor
    if (isFancy) $('.js-taginput-show')?.click();
  }
  function createButton(text, id) {
    const button = create('button');
    button.classList.add('button', 'button--separate-left');
    button.type = 'button';
    button.id = id;
    button.innerText = text;
    return button;
  }
  if ($('#image_target') || $('#thumbnails-not-yet-generated')) {
    insertUI();
    const content = $('#content');
    if (!content) throw Error('Element not found: #content');
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement && node.matches('.js-tagsauce')) {
            insertUI();
          }
        }
      }
    });
    observer.observe(content, {childList: true});
  }
  insertBulkUI();
})();
