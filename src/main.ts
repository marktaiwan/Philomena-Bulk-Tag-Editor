import {SCRIPT_ID} from './const';
import {$, $$, create, deserializeTags} from './util';
import TagEditor from './TagEditor';

function insertUI() {
  const tagsForm = $('#tags-form');

  if (!tagsForm || $(`#${SCRIPT_ID}_script_container`)) return;  // tagging disabled or ui already exists

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

function applyTags(tagsToAdd: string[], tagsToRemove: string[]): void {
  const tagInput = $<HTMLInputElement>('[name="image[tag_input]"], [name="post[tag_input]"]');
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
