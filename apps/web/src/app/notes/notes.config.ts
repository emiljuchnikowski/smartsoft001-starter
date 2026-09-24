import { ListMode, PaginationMode } from '@smartsoft001/angular';
import { CrudFullConfig } from '@smartsoft001/crud-shell-angular';

import { Note } from '@app/model';

/**
 * Everything the generated list and item pages need to know about notes.
 * The columns, the form fields and the details view come from the `@Field`
 * decorators on `Note`; this object says which capabilities the screens have.
 */
export const notesConfig: CrudFullConfig<Note> = {
  // Relative, so the dev-server proxy (and any reverse proxy) can route it.
  apiUrl: '/api/notes',
  entity: 'notes',
  type: Note,
  title: 'Notes',
  add: true,
  edit: true,
  details: true,
  remove: true,
  search: true,
  pagination: { limit: 25 },
  sort: { default: 'title', defaultDesc: false },
  list: {
    mode: ListMode.desktop,
    paginationMode: PaginationMode.singlePage,
  },
};
