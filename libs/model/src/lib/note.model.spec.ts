import {
  FieldType,
  getModelFieldKeys,
  getModelFieldOptions,
  getModelOptions,
  isModel,
} from '@smartsoft001/models';

import { Note } from './note.model';

describe('model: Note', () => {
  it('should decorate both note field keys', () => {
    const keys = getModelFieldKeys(Note);

    expect(keys).toEqual(expect.arrayContaining(['title', 'content']));
  });

  it('should declare the title as a required text column of the list', () => {
    const options = getModelFieldOptions(new Note(), 'title');

    expect(options).toEqual(
      expect.objectContaining({
        type: FieldType.text,
        required: true,
        list: true,
      }),
    );
  });

  it('should declare the content as a long text kept out of the list', () => {
    const options = getModelFieldOptions(new Note(), 'content');

    expect(options.type).toBe(FieldType.longText);
    expect(options.list).toBeUndefined();
  });

  it('should use the title as the model title key', () => {
    const options = getModelOptions(Note);

    expect(options.titleKey).toBe('title');
  });

  it('should be recognised as a model instance', () => {
    const note = new Note();

    expect(isModel(note)).toBe(true);
  });
});
