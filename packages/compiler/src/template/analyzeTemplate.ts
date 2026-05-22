import { parse } from "@typed/template/Parser";
import type * as Template from "@typed/template/Template";
import {
  createTemplatePlan,
  type TemplatePlan,
  type TemplatePlanAttribute,
  type TemplatePlanNode,
  type TemplatePlanPart,
  type TemplatePlanSparsePart,
  type TemplatePlanTextContent,
} from "./TemplatePlan.js";

export function analyzeTemplate(template: TemplateStringsArray): TemplatePlan {
  const parsed = parse(template);
  return createTemplatePlan({
    templateHash: parsed.hash,
    nodes: parsed.nodes.map(convertNode),
    parts: parsed.parts.map(([part, path]) => convertPart(part, path)),
  });
}

function convertNode(node: Template.Node): TemplatePlanNode {
  switch (node._tag) {
    case "element":
      return convertElement(node);
    case "self-closing-element":
      return convertSelfClosingElement(node);
    case "text-only-element":
      return convertTextOnlyElement(node);
    case "text":
      return { kind: "text", value: node.value };
    case "node":
      return { kind: "part", valueIndex: node.index };
    case "comment":
      return { kind: "comment", value: node.value };
    case "comment-part":
      return { kind: "commentPart", valueIndex: node.index };
    case "sparse-comment":
      return { kind: "sparseComment", nodes: node.nodes.map(convertSparsePart) };
    case "doctype":
      return convertDocType(node);
    default:
      return unsupportedNode(node);
  }
}

function convertElement(node: Template.ElementNode): TemplatePlanNode {
  return {
    kind: "element",
    tagName: node.tagName,
    attributes: node.attributes.map(convertAttribute),
    children: node.children.map(convertNode),
  };
}

function convertSelfClosingElement(node: Template.SelfClosingElementNode): TemplatePlanNode {
  return {
    kind: "selfClosingElement",
    tagName: node.tagName,
    attributes: node.attributes.map(convertAttribute),
  };
}

function convertTextOnlyElement(node: Template.TextOnlyElement): TemplatePlanNode {
  return {
    kind: "textOnlyElement",
    tagName: node.tagName,
    attributes: node.attributes.map(convertAttribute),
    textContent: textOnlyContent(node.textContent),
  };
}

function convertDocType(node: Template.DocType): TemplatePlanNode {
  return {
    kind: "doctype",
    name: node.name,
    publicId: node.publicId,
    systemId: node.systemId,
  };
}

function convertAttribute(attribute: Template.Attribute): TemplatePlanAttribute {
  switch (attribute._tag) {
    case "attribute":
      return { kind: "attribute", name: attribute.name, value: attribute.value };
    case "boolean":
      return { kind: "attribute", name: attribute.name, value: "" };
    case "attr":
      return { kind: "dynamicAttribute", name: attribute.name, valueIndex: attribute.index };
    case "sparse-attr":
      return convertSparseAttribute(attribute);
    case "boolean-part":
      return { kind: "boolean", name: attribute.name, valueIndex: attribute.index };
    case "className-part":
      return { kind: "className", name: "class", valueIndex: attribute.index };
    case "sparse-class-name":
      return {
        kind: "sparseClassName",
        name: "class",
        nodes: attribute.nodes.map(convertSparsePart),
      };
    case "data":
      return { kind: "data", name: "data", valueIndex: attribute.index };
    case "event":
      return { kind: "event", name: attribute.name, valueIndex: attribute.index };
    case "property":
      return { kind: "property", name: attribute.name, valueIndex: attribute.index };
    case "properties":
      return { kind: "properties", valueIndex: attribute.index };
    case "ref":
      return { kind: "ref", valueIndex: attribute.index };
  }
}

function convertSparseAttribute(attribute: Template.SparseAttrNode): TemplatePlanAttribute {
  const kind = attribute.name === "class" ? "sparseClassName" : "sparseAttribute";
  return { kind, name: attribute.name, nodes: attribute.nodes.map(convertSparsePart) };
}

function convertPart(
  part: Template.PartNode | Template.SparsePartNode,
  path: readonly number[],
): TemplatePlanPart {
  switch (part._tag) {
    case "node":
      return { kind: "node", valueIndex: part.index, path };
    case "text-part":
      return { kind: "text", valueIndex: part.index, path };
    case "comment-part":
      return { kind: "comment", valueIndex: part.index, path };
    case "properties":
      return { kind: "properties", valueIndex: part.index, path };
    case "ref":
      return { kind: "ref", valueIndex: part.index, path };
    case "attr":
      return { kind: "attr", valueIndex: part.index, path, name: part.name };
    case "boolean-part":
      return { kind: "boolean", valueIndex: part.index, path, name: part.name };
    case "className-part":
      return { kind: "className", valueIndex: part.index, path, name: "class" };
    case "data":
      return { kind: "data", valueIndex: part.index, path, name: "data" };
    case "event":
      return { kind: "event", valueIndex: part.index, path, name: part.name };
    case "property":
      return { kind: "property", valueIndex: part.index, path, name: part.name };
    case "sparse-text":
      return { kind: "sparseText", path, nodes: part.nodes.map(convertSparsePart) };
    case "sparse-attr":
      return {
        kind: "sparseAttr",
        path,
        name: part.name,
        nodes: part.nodes.map(convertSparsePart),
      };
    case "sparse-class-name":
      return {
        kind: "sparseClassName",
        path,
        name: "class",
        nodes: part.nodes.map(convertSparsePart),
      };
    case "sparse-comment":
      return { kind: "sparseComment", path, nodes: part.nodes.map(convertSparsePart) };
  }
}

function convertSparsePart(
  node:
    | Template.TextNode
    | Template.TextPartNode
    | Template.AttrPartNode
    | Template.ClassNamePartNode
    | Template.CommentPartNode,
): TemplatePlanSparsePart {
  if (node._tag === "text") return { kind: "text", value: node.value };
  return { kind: "part", valueIndex: node.index };
}

function textOnlyContent(text: Template.Text | null): TemplatePlanTextContent | null {
  if (text === null) return null;
  if (text._tag === "text") return { kind: "text", value: text.value };
  if (text._tag === "text-part") return { kind: "part", valueIndex: text.index };
  return { kind: "sparseText", nodes: text.nodes.map(convertSparsePart) };
}

function unsupportedNode(node: never): never {
  throw new Error(`Unsupported template node: ${JSON.stringify(node)}`);
}
