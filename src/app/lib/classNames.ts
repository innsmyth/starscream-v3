/*
 Utility: classNames
 A small helper that joins CSS class name fragments into a single string.
 It filters out falsy values and returns a space-separated class list.
*/
export const classNames = (
  ...classes: (string | false | null | undefined)[]
) => {
  return classes.filter(Boolean).join(" ");
};
