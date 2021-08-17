import {SCRIPT_ID} from './globals';
import {$, $$, create, deserializeTags, getBooruParam, getTagsFromId, getToken, onLeftClick, serializeTags, setMessage, throttle} from './util';
import TagEditor from './TagEditor';

function createTagEditor(): HTMLDivElement {
  const field = create('div');
  field.id = `${SCRIPT_ID}_script_container`;
  field.classList.add('field');

  const inputField = create('div');
  inputField.id = `${SCRIPT_ID}_input_field`;
  inputField.classList.add('field');
  inputField.classList.add('flex');

  field.appendChild(inputField);

  // buttons
  const applyButton = createButton('Apply changes', `${SCRIPT_ID}_apply_button`);
  applyButton.dataset.clickPreventdefault = 'true';
  applyButton.classList.add('button--state-primary');

  const saveButton = createButton('Save tags', `${SCRIPT_ID}_save_button`);
  saveButton.dataset.clickPreventdefault = 'true';
  saveButton.classList.add('button--state-success');

  const loadButton = createButton('Load tags', `${SCRIPT_ID}_load_button`);
  loadButton.dataset.clickPreventdefault = 'true';
  loadButton.classList.add('button--state-warning');

  field.append(
    applyButton,
    saveButton,
    loadButton,
  );

  return field;
}

function insertUI(): void {
  const tagsForm = $('#tags-form');
  const tagInput = $(`[name="${getBooruParam('newTagParam')}"]`);
  if (!tagInput || !tagsForm || $(`#${SCRIPT_ID}_script_container`)) return;  // tagging disabled or ui already exists

  const field = createTagEditor();
  const inputField = $(`#${SCRIPT_ID}_input_field`, field)!;
  const applyButton = $(`#${SCRIPT_ID}_apply_button`, field)!;
  const saveButton = $(`#${SCRIPT_ID}_save_button`, field)!;
  const loadButton = $(`#${SCRIPT_ID}_load_button`, field)!;

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

function insertBulkUI(): void {
  const imageListHeader = $(getBooruParam('imagelistSelector'));
  if (!imageListHeader) return;

  const toggleButton = createAnchorButton('Tag Edit', `js--${SCRIPT_ID}--toggle`, 'fa-tags');
  onLeftClick(toggleUI, toggleButton);

  const editor = createTagEditor();
  const inputField = $<HTMLInputElement>(`#${SCRIPT_ID}_input_field`, editor)!;
  const applyButton = $<HTMLButtonElement>(`#${SCRIPT_ID}_apply_button`, editor)!;
  const saveButton = $<HTMLButtonElement>(`#${SCRIPT_ID}_save_button`, editor)!;
  const loadButton = $<HTMLButtonElement>(`#${SCRIPT_ID}_load_button`, editor)!;

  const messageBox = create('section');
  messageBox.id = `${SCRIPT_ID}--message`;
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

function toggleUI(): void {
  const editor = $(`#${SCRIPT_ID}_script_container`)!;
  const active = editorOn();
  editor.classList.toggle('hidden', active);
  if (!active) {
    document.addEventListener('click', boxClickHandler);
    getBoxHeaders().forEach(header => header.classList.add('media-box__header--unselected'));
  } else {
    document.removeEventListener('click', boxClickHandler);
    getBoxHeaders().forEach(header => header.classList.remove(
      'media-box__header--selected',
      'media-box__header--unselected',
    ));
  }
}

function editorOn(): boolean {
  const editor = $(`#${SCRIPT_ID}_script_container`)!;
  return !editor.classList.contains('hidden');
}

/**
 * Handles toggling the selected state of thumbnails when script is active
 */
function boxClickHandler(e: MouseEvent): void {
  const mediaBox = (e.target as HTMLElement).closest('.media-box') as HTMLDivElement;
  if (mediaBox) {
    e.preventDefault();
    $('.media-box__header', mediaBox)?.classList.toggle('media-box__header--selected');
  }
}

function getBoxHeaders(): NodeListOf<HTMLDivElement> {
  return $$('#imagelist-container .media-box__header, #imagelist_container .media-box__header');
}

function setAllHeader(selected: boolean): void {
  getBoxHeaders().forEach(header => {
    header.classList.toggle('media-box__header--selected', selected);
  });
}

function createAnchorButton(text: string, className: string, icon?: string) {
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

async function bulkApplyTags(tagsToAdd: string[], tagsToRemove: string[]): Promise<void> {
  const imageList = [...getBoxHeaders()]
    .filter(header => header.classList.contains('media-box__header--selected'))
    .map(header => {
      const mediaBox = header.parentElement!;
      const id = (mediaBox.dataset.imageId ?? mediaBox.dataset.postId)!;
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

async function submitEdit(id: string, oldTags: Set<string>, newTags: Set<string>): Promise<void> {
  const path = getBooruParam('editApiPath') + id + '/tags';
  const formEntries = [
    ['_method', 'put'],
    [getBooruParam('authTokenParam'), getToken()],
    [getBooruParam('oldTagParam'), serializeTags(oldTags)],
    [getBooruParam('newTagParam'), serializeTags(newTags)],
  ];
  const form = new FormData();
  formEntries.forEach(([key, val]) => form.set(key, val));
  const resp = await fetch(
    path,
    {
      method: 'POST',
      body: form,
    }
  );
  if (resp.status !== 200) {
    throw new Error('status code: ' + resp.status);
  }
}

function applyTags(tagsToAdd: string[], tagsToRemove: string[]): void {
  const tagInput = $<HTMLInputElement>(`[name="${getBooruParam('newTagParam')}"]`);
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

function createButton(text: string, id: string): HTMLButtonElement {
  const button = create('button');
  button.classList.add(
    'button',
    'button--separate-left'
  );
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
