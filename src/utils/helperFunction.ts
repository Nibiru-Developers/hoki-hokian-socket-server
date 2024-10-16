export function* generateAutoIncrementNumber() {
  let i = 1;
  while (true) {
    yield i++;
  }
}
