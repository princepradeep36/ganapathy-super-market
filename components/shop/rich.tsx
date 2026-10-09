import { Fragment, type ReactNode } from 'react';

/** Fills {placeholders} in an already-translated string with elements, e.g. bold amounts. */
export function rich(text: string, parts: Record<string, ReactNode>): ReactNode {
  return text.split(/(\{\w+\})/g).map((piece, i) => {
    const key = piece.match(/^\{(\w+)\}$/)?.[1];
    return <Fragment key={i}>{key && key in parts ? parts[key] : piece}</Fragment>;
  });
}
