import ts from "typescript";

export interface DeriveUiComponentResumabilityFactInput {
  readonly moduleId: string;
  readonly sourceFile?: ts.SourceFile;
  readonly sourceText?: string;
  readonly ts?: typeof ts;
}

export interface UiComponentResumabilityFact {
  readonly actions: readonly string[];
  readonly component: string;
  readonly componentExports: readonly string[];
  readonly moduleId: string;
  readonly stateFields: readonly string[];
  readonly startupState: boolean;
}

export function deriveUiComponentResumabilityFact(
  input: DeriveUiComponentResumabilityFactInput,
): UiComponentResumabilityFact {
  const sourceFile = uiSourceFile(input);
  const stateFields = exportedDataFields(sourceFile);

  return {
    actions: exportedActionNames(sourceFile),
    component: exportedStringConst(sourceFile, "component"),
    componentExports: exportedComponentNames(sourceFile),
    moduleId: input.moduleId,
    stateFields,
    startupState: stateFields.length > 0,
  };
}

function uiSourceFile(input: DeriveUiComponentResumabilityFactInput): ts.SourceFile {
  if (input.sourceFile) return input.sourceFile;
  const tsMod = input.ts ?? ts;
  return tsMod.createSourceFile(
    input.moduleId,
    input.sourceText ?? "",
    tsMod.ScriptTarget.Latest,
    true,
  );
}

function exportedStringConst(sourceFile: ts.SourceFile, name: string): string {
  for (const statement of sourceFile.statements) {
    const value = stringConstFromStatement(statement, name);
    if (value !== undefined) return value;
  }
  if (name === "component") return componentIdFromModuleId(sourceFile.fileName);
  throw new Error(`Missing exported string const ${name} in ${sourceFile.fileName}`);
}

function componentIdFromModuleId(moduleId: string): string {
  return moduleId.replace(/^@/, "");
}

function exportedDataFields(sourceFile: ts.SourceFile): readonly string[] {
  for (const statement of sourceFile.statements) {
    const fields = dataFieldsFromStatement(statement);
    if (fields.length > 0) return fields;
  }
  throw new Error(`Missing exported data schema in ${sourceFile.fileName}`);
}

function exportedActionNames(sourceFile: ts.SourceFile): readonly string[] {
  return uniqueExportedFunctionNames(sourceFile, isActionFunction);
}

function exportedComponentNames(sourceFile: ts.SourceFile): readonly string[] {
  return uniqueExportedFunctionNames(sourceFile, isComponentFunction);
}

function uniqueExportedFunctionNames(
  sourceFile: ts.SourceFile,
  predicate: (statement: ts.FunctionDeclaration) => boolean,
): readonly string[] {
  const names: string[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isFunctionDeclaration(statement) || !hasExportModifier(statement)) continue;
    const name = statement.name?.text;
    if (name && predicate(statement) && !names.includes(name)) names.push(name);
  }
  return names;
}

function stringConstFromStatement(statement: ts.Statement, name: string): string | undefined {
  if (!isExportedVariable(statement)) return undefined;
  for (const declaration of statement.declarationList.declarations) {
    const initializer = declaration.initializer;
    if (initializer && isIdentifierNamed(declaration.name, name) && ts.isStringLiteral(initializer)) {
      return initializer.text;
    }
  }
}

function dataFieldsFromStatement(statement: ts.Statement): readonly string[] {
  if (!isExportedVariable(statement)) return [];
  for (const declaration of statement.declarationList.declarations) {
    if (isIdentifierNamed(declaration.name, "data")) {
      return dataFieldsFromInitializer(declaration.initializer);
    }
  }
  return [];
}

function dataFieldsFromInitializer(initializer: ts.Expression | undefined): readonly string[] {
  if (!initializer || !ts.isCallExpression(initializer)) return [];
  const [fields] = initializer.arguments;
  if (!fields || !ts.isObjectLiteralExpression(fields)) return [];
  return fields.properties.flatMap((property) =>
    ts.isPropertyAssignment(property) ? propertyName(property.name) : [],
  );
}

function isActionFunction(statement: ts.FunctionDeclaration): boolean {
  const returnType = statement.type?.getText() ?? "";
  const firstParameter = statement.parameters[0]?.type?.getText() ?? "";
  return (
    returnType.startsWith("Effect.Effect<") &&
    !returnType.includes("RefSubject.RefSubject") &&
    (returnType.includes("State") || firstParameter.includes("RefSubject.RefSubject"))
  );
}

function isComponentFunction(statement: ts.FunctionDeclaration): boolean {
  return statement.type?.getText().startsWith("Component<") === true;
}

function propertyName(name: ts.PropertyName): readonly string[] {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return [name.text];
  }
  return [];
}

function isExportedVariable(statement: ts.Statement): statement is ts.VariableStatement {
  return ts.isVariableStatement(statement) && hasExportModifier(statement);
}

function hasExportModifier(node: ts.Node): boolean {
  return ts.canHaveModifiers(node) && ts.getModifiers(node)?.some(isExportModifier) === true;
}

function isExportModifier(modifier: ts.ModifierLike): boolean {
  return modifier.kind === ts.SyntaxKind.ExportKeyword;
}

function isIdentifierNamed(name: ts.BindingName, expected: string): boolean {
  return ts.isIdentifier(name) && name.text === expected;
}
