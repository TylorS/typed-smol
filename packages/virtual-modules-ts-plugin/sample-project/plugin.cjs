module.exports = {
  name: "sample-virtual",
  shouldResolve: (id) => id === "virtual:foo",
  build: () =>
    "export interface Foo { n: number; s: string }\nexport const DEFAULT: Foo = { n: 0, s: '' };",
};
