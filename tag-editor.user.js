// ==UserScript==
// @name        Bulk Tag Editor (FF Violentmonkey)
// @description Streamlined bulk tag editing
// @version     1.1.0
// @author      Marker
// @license     MIT
// @namespace   https://github.com/marktaiwan/
// @homepageURL https://github.com/marktaiwan/Philomena-Bulk-Tag-Editor
// @supportURL  https://github.com/marktaiwan/Philomena-Bulk-Tag-Editor/issues
// @match       *://*.derpibooru.org/*
// @match       *://*.trixiebooru.org/*
// @match       *://*.ponybooru.org/*
// @match       *://*.ponerpics.org/*
// @match       *://*.twibooru.org/*
// @inject-into content
// @noframes
// @grant       none
// ==/UserScript==
(function () {
  'use strict';

  const SCRIPT_ID = 'bulk_tag_editor';

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

  function serializeTags(arr) {
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
  /*
   *  Workaround for Firefox version of Violentmonkey:
   *  Because these permissions doesn't work properly when run as content script
   *  And script won't run at all when run in page context
   */
  function GM_setValue(id, value) {
    window.localStorage.setItem(SCRIPT_ID + '__' + id, JSON.stringify(value));
  }
  function GM_getValue(id, defaultValue) {
    const val = window.localStorage.getItem(SCRIPT_ID + '__' + id);
    return val !== null ? JSON.parse(val) : defaultValue;
  }

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
      const inputTemplate = $('#taginput-fancy-tag_input');
      const attributes = [
        'autocapitalize',
        'autocomplete',
        'data-ac',
        'data-ac-min-length',
        'data-ac-source',
        'placeholder',
        'type',
      ];
      input.classList.add('input', `${SCRIPT_ID}--taginput-input`);
      // copy attributes
      for (const attr of attributes) {
        const val = inputTemplate.getAttribute(attr);
        if (val) input.setAttribute(attr, val);
      }
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
        anchor.parentElement?.remove();
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

  function insertUI() {
    const tagsForm = $('#tags-form');
    if (!tagsForm || $(`#${SCRIPT_ID}_script_container`)) return; // tagging disabled or ui already exists
    const tagInput = $('[name="image[tag_input]"], [name="post[tag_input]"]');
    const isFancy = tagInput.classList.contains('hidden');
    // outermost container
    const field = create('div');
    field.id = `${SCRIPT_ID}_script_container`;
    field.classList.add('field');
    const inputField = create('div');
    inputField.classList.add('field');
    inputField.classList.add('flex');
    // tag list input
    const tagAdd = new TagEditor('Tags to add:', 'add-editor');
    const tagRemove = new TagEditor('Tags to remove:', 'remove-editor');
    inputField.appendChild(tagAdd.dom);
    inputField.appendChild(tagRemove.dom);
    field.appendChild(inputField);
    if (isFancy) {
      $$('.js-taginput-plain', inputField).forEach(ele => ele.classList.add('hidden'));
    } else {
      $$('.js-taginput-fancy', inputField).forEach(ele => ele.classList.add('hidden'));
    }
    // buttons
    const applyButton = createButton('Apply changes', `${SCRIPT_ID}_apply_button`);
    applyButton.dataset.clickPreventdefault = 'true';
    applyButton.classList.add('button--state-primary');
    applyButton.addEventListener('click', () => {
      applyTags(
        deserializeTags(tagAdd.plainEditor.value),
        deserializeTags(tagRemove.plainEditor.value)
      );
    });
    const saveButton = createButton('Save tags', `${SCRIPT_ID}_save_button`);
    saveButton.dataset.clickPreventdefault = 'true';
    saveButton.classList.add('button--state-success');
    saveButton.addEventListener('click', () => {
      tagAdd.saveTags();
      tagRemove.saveTags();
    });
    const loadButton = createButton('Load tags', `${SCRIPT_ID}_load_button`);
    loadButton.dataset.clickPreventdefault = 'true';
    loadButton.classList.add('button--state-warning');
    loadButton.addEventListener('click', () => {
      tagAdd.loadTags();
      tagRemove.loadTags();
    });
    $('.js-taginput-show').addEventListener('click', () => {
      [tagAdd, tagRemove].forEach(editor => {
        editor.tags = deserializeTags(editor.plainEditor.value);
        editor.clearFancyEditor();
        editor.tags.forEach(editor.insertTagElement, editor);
      });
    });
    field.appendChild(applyButton);
    field.appendChild(saveButton);
    field.appendChild(loadButton);
    $('.field', tagsForm).prepend(field);
  }
  function applyTags(tagsToAdd, tagsToRemove) {
    const tagInput = $('[name="image[tag_input]"], [name="post[tag_input]"]');
    const isFancy = tagInput.classList.contains('hidden');
    const tagPool = deserializeTags(tagInput.value);
    // change to plain editor
    if (isFancy) $('.js-taginput-hide').click();
    // append tags
    for (const tag of tagsToAdd) {
      if (tagPool.includes(tag)) continue;
      tagPool.push(tag);
    }
    // remove tags
    for (const tagToRemove of tagsToRemove) {
      const tagIndex = tagPool.findIndex(tag => tag == tagToRemove);
      if (tagIndex > -1) tagPool.splice(tagIndex, 1);
    }
    tagInput.value = tagPool.join(', ');
    // revert tag editor
    if (isFancy) $('.js-taginput-show').click();
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
})();
