"use client";

/**
 * ROLE OF THIS FILE
 * Says, in the DOM, when React has finished hydrating the page it sits on.
 *
 * The admin's Content → Home page editor previews the storefront in same-origin
 * <iframe>s and writes each keystroke straight into their documents. A write
 * that lands BEFORE hydration is a text mismatch, and React 19 resolves a
 * mismatch by re-rendering from its own props — silently undoing the edit.
 * Until this existed the editor guessed at "hydrated" with two animation frames
 * after `load`, which lost the race often enough to make its own test flaky.
 *
 * Effects run after the commit that hydrates the tree, and a later sibling's
 * effect runs after every earlier sibling's, so rendering this LAST on a page
 * marks the moment the whole page is safe to write into. Renders nothing.
 */

import { useEffect } from "react";

/** The attribute the editor's `whenPatchable` waits for, on `<html>`. */
export const HYDRATED_ATTRIBUTE = "data-hydrated";

export function HydrationMark() {
  useEffect(() => {
    document.documentElement.setAttribute(HYDRATED_ATTRIBUTE, "true");
  }, []);
  return null;
}
