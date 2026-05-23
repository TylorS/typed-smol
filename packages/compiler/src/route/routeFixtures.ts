export const invalidRouteModuleSource = `
let count = 0;
export const route = () => {
  const increment = () => count++;
  return html\`<button>\${increment}</button>\`;
};
`;

export const invalidRouteDiagnosticCode = "unsupported-closure-capture";
