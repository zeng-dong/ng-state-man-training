import { Copy } from '../titles/after/api';

/** The one sentence both versions say. */
export function onTheShelf(copies: Copy[]) {
  const here = copies.filter((c) => c.status.kind === 'available').map((c) => c.branchCode);
  return here.length > 0
    ? `On the shelf at ${here.join(', ')}.`
    : 'No copies on the shelf right now.';
}
