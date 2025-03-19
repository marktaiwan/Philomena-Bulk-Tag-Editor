import {SCRIPT_ID} from './globals';
import {$, $$, create, serializeTags, deserializeTags, getBooruParam} from './util';


class TagEditor {
  id: string;
  label: string;
  dom: HTMLDivElement;
  plainEditor: HTMLTextAreaElement;
  fancyEditor: HTMLDivElement;
  inputField: HTMLInputElement;
  tags: string[];

  constructor(label: string, id: string) {
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
      'js-taginput-fancy',
    );
    fancyEditor.style.marginTop = '4px';
    fancyEditor.style.resize = 'vertical';

    const input = create('input');
    input.classList.add(
      'input',
      `${SCRIPT_ID}--taginput-input`
    );
    [
      ['autocapitalize', 'none'],
      ['autocomplete', 'off'],
      ['data-autocomplete', 'single-tag'],
      ['data-autocomplete-max-suggestions', '5'],
      ['placeholder', 'add a tag'],
      ['type', 'text'],
    ].forEach(([attr, val]) => input.setAttribute(attr, val));

    fancyEditor.append(input);

    const br = create('br');
    wrapper.append(
      span,
      br,
      textarea,
      fancyEditor,
    );

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
        this.removeTag(e.target.dataset.tagName!);
      }
    });
    this.inputField.addEventListener('autocomplete', e => {
      if (!(e instanceof CustomEvent)) return;
      this.addTag(e.detail.value ?? e.detail);
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
        const tagName = $('[data-tag-name]', tagElement)!.dataset.tagName!;
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

  clearFancyEditor(): void {
    $$('.tag', this.fancyEditor).forEach(ele => ele.remove());
  }

  addTag(tagName: string): void {
    // sanitize
    tagName = tagName.trim();

    // change for duplicate
    if (this.tags.includes(tagName)) return;

    this.tags.push(tagName);
    this.plainEditor.value = this.tags.join(', ');
    this.insertTagElement(tagName);
  }

  insertTagElement(tagName: string): void {
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

  removeTag(tagName: string): void {
    const tagIndex = this.tags.findIndex(tag => tag == tagName);
    if (tagIndex > -1) {
      this.tags.splice(tagIndex, 1);
      const anchor = $(`.tag a[data-tag-name="${tagName}"]`, this.fancyEditor);
      anchor!.parentElement!.remove();
    }
    this.plainEditor.value = serializeTags(this.tags);
  }

  saveTags(): void {
    this.tags = deserializeTags(this.plainEditor.value);
    GM_setValue(this.id, this.tags);
    this.plainEditor.value = serializeTags(this.tags);
  }

  loadTags(): void {
    this.clearFancyEditor();
    this.tags = GM_getValue(this.id, []);
    this.tags.forEach(this.insertTagElement, this);
    this.plainEditor.value = serializeTags(this.tags);
  }

}

export default TagEditor;
