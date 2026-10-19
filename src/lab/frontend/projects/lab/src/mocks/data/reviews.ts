/*
  Reviews is the newer service, built by a different team: camelCase, ISO dates, and a
  titleId that is a string (the catalog's TITLE_ID is a number).
*/

export interface Review {
  id: string;
  titleId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  body: string;
  reviewer: { displayName: string };
  createdAt: string;
}

export const reviews: Review[] = [
  {
    id: 'rv_8f2a',
    titleId: '1001',
    rating: 5,
    body: 'Reread it every few years and notice something new each time.',
    reviewer: { displayName: 'spice_reader' },
    createdAt: '2026-08-02T15:20:00Z',
  },
  {
    id: 'rv_8f2b',
    titleId: '1001',
    rating: 3,
    body: 'The appendices are better than some whole novels. The middle drags.',
    reviewer: { displayName: 'mkwong' },
    createdAt: '2026-06-18T09:05:00Z',
  },
  {
    id: 'rv_8f2c',
    titleId: '1001',
    rating: 4,
    body: 'Waited six weeks on the hold list. Worth it.',
    reviewer: { displayName: 'library_regular' },
    createdAt: '2026-03-11T19:44:00Z',
  },
  {
    id: 'rv_91d0',
    titleId: '1002',
    rating: 5,
    body: 'Quietly devastating.',
    reviewer: { displayName: 'tess.h' },
    createdAt: '2025-12-01T12:00:00Z',
  },
  {
    id: 'rv_91d1',
    titleId: '1005',
    rating: 5,
    body: 'Our book club argued about the ending for two hours.',
    reviewer: { displayName: 'northside_bookclub' },
    createdAt: '2026-09-09T20:15:00Z',
  },
  {
    id: 'rv_91d2',
    titleId: '1007',
    rating: 4,
    body: 'Dated in places, prophetic in others.',
    reviewer: { displayName: 'night_shift_reader' },
    createdAt: '2026-01-23T08:30:00Z',
  },
  {
    id: 'rv_91d3',
    titleId: '1008',
    rating: 4,
    body: 'Not the monster movie. Much sadder.',
    reviewer: { displayName: 'mkwong' },
    createdAt: '2025-10-31T23:59:00Z',
  },
  {
    id: 'rv_91d4',
    titleId: '1011',
    rating: 5,
    body: 'Read it aloud to my kids. They made me do the voices.',
    reviewer: { displayName: 'dad_of_three' },
    createdAt: '2026-07-04T17:00:00Z',
  },
  {
    id: 'rv_91d5',
    titleId: '1011',
    rating: 2,
    body: 'Too many songs.',
    reviewer: { displayName: 'tess.h' },
    createdAt: '2026-02-14T10:10:00Z',
  },
];
