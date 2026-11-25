// jsdom gaps used by the UI: <dialog>, scrollIntoView, matchMedia.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

if (typeof window !== 'undefined') {
  const proto = window.HTMLDialogElement?.prototype;
  if (proto && !proto.showModal) {
    proto.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    proto.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
  window.HTMLElement.prototype.scrollIntoView ??= function () {};
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
