export function prepareFilterString(filterString) {
  filterString = filterString.replace(" ", "\\ ");
  filterString = filterString.replace("-", "\\-");
  return filterString.toLowerCase();
}

export function foo() {
  // just a test
}