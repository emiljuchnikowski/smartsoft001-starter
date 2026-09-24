import { IEntity } from '@smartsoft001/domain-core';
import { Field, FieldType, Model } from '@smartsoft001/models';

/** The one entity of the example app: a note with a title and a body. */
@Model({ titleKey: 'title' })
export class Note implements IEntity<string> {
  // Assigned by the API on create.
  id!: string;

  // create/update: in the form (focused first), list: a column, details: on
  // the item page. `required` is repeated per mode because the API validates
  // create and update against the mode block, not the top-level flag.
  @Field({
    type: FieldType.text,
    required: true,
    focused: true,
    create: { required: true },
    update: { required: true },
    list: true,
    details: true,
  })
  title!: string;

  // create/update: in the form, details: on the item page - no list column.
  @Field({
    type: FieldType.longText,
    create: true,
    update: true,
    details: true,
  })
  content?: string;
}
