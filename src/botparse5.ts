/*!
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

/// Parse5 utility clases.

import fs = require("fs");
import parse5 = require("parse5");
import { AssertionError } from "assert";
import { HtmlWriter, ILogger } from "./botcore";

export type Document2 = parse5.AST.HtmlParser2.Document;
export type DocumentFragment2 = parse5.AST.HtmlParser2.DocumentFragment;
export type Element2 = parse5.AST.HtmlParser2.Element;
export type Node2 = parse5.AST.HtmlParser2.Node;
export type Text2 = parse5.AST.HtmlParser2.TextNode;

export type Parse5Attribute = parse5.AST.Default.Attribute;
export type Parse5Location = parse5.MarkupData.Location;
export type Parse5StartTagLocation = parse5.MarkupData.StartTagLocation;

export class Parse5AttributeBuilder {
    constructor(public _attrs: Parse5Attribute[]) {
    }
    add_(name: string, value: string): this {
        this._attrs.push({ name: name, value: value });
        return this;
    }
}

export class Parse5Ut {
    static getFirstElementChild(doc: Document2): Element2 | null {
        for (let c of doc.childNodes) {
            if (c.nodeType == Node.ELEMENT_NODE) return (c as Element2);
        }
        return null;
    }
    static getElementByIdFromDocument(id: string, doc: Document2): Element2 | null {
        let root = this.getFirstElementChild(doc);
        if (root == null) return null;
        return Parse5Ut.elementSelector(root, (elm: Element2) => {
            return id == elm.attribs["id"] ? elm : null;
        })
    }
    static getElementById(id: string, node: Node2): Element2 | null {
        return Parse5Ut.elementSelector(node, (elm: Element2) => {
            return id == elm.attribs["id"] ? elm : null;
        })
    }
    static elementSelector(node: Node2, predicate: (elm: Element2) => Element2 | null): Element2 | null {
        if (node.nodeType == Node.ELEMENT_NODE) {
            let elm = node as Element2;
            let ret = predicate(elm);
            if (ret != null) return ret;
            for (let child of elm.childNodes) {
                let ret = this.elementSelector(child, predicate);
                if (ret != null) return ret;
            }
        }
        return null;
    }
    static addStylesheet_(attrs: Parse5Attribute[], href: string): Parse5AttributeBuilder {
        return new Parse5AttributeBuilder(attrs)
            .add_("rel", "stylesheet")
            .add_("type", "text/css")
            .add_("href", href);
    }
    static addAttr(attrs: Parse5Attribute[], name: string, value: string): Parse5AttributeBuilder {
        return new Parse5AttributeBuilder(attrs).add_(name, value);
    }
    static getAttr(attrs: Parse5Attribute[], name: string): Parse5Attribute | null {
        for (const attr of attrs) {
            if (attr.name == name) return attr;
        }
        return null;
    }
    static removeAttr(attrs: Parse5Attribute[], name: string): boolean {
        for (let index = 0, len = attrs.length; index < len; ++index) {
            if (attrs[index].name == name) {
                attrs.splice(index, 1);
                return true;
            }
        }
        return false;
    }
    static removeAttrs(attrs: Parse5Attribute[], ...names: string[]): boolean {
        let toremove: number[] = [];
        for (let index = 0; index < attrs.length; ++index) {
            const aname = attrs[index].name;
            for (const name of names) {
                if (aname == name) {
                    toremove.unshift(index);
                }
            }
        }
        for (const index of toremove) {
            attrs.splice(index, 1);
        }
        return toremove.length > 0;
    }
    static hasClass(attrs: Parse5Attribute[], name: string): boolean {
        const attr = Parse5Ut.getAttr(attrs, "class");
        return (attr != null && attr.value.indexOf(name) >= 0);
    }
    static hasId(attrs: Parse5Attribute[], id: string): boolean {
        for (const attr of attrs) {
            if (attr.name == "id" && attr.value == id) return true;
        }
        return false;
    }
}

export class Parse5SAXAdapterBase extends parse5.SAXParser {

    constructor() {
        super({ locationInfo: true });
        this.on("doctype", this.doctype);
        this.on("startTag", this.startTag);
        this.on("endTag", this.endTag);
        this.on("text", this.text);
        this.on("comment", this.comment);
    }

    doctype(_name: string, _publicId: string, _systemId: string, _location?: Parse5Location): void {
    }

    startTag(_name: string, _attrs: Parse5Attribute[], _selfClosing: boolean, _location?: Parse5StartTagLocation): void {
    }

    endTag(_name: string, _location?: Parse5Location): void {
    }

    text(_text: string, _location?: Parse5Location): void {
    }

    comment(_text: string, _location?: Parse5Location): void {
    }
}

export class Parse5SAXAdapter extends Parse5SAXAdapterBase {

    private _ignoring = false;
    private _isStyle = false;

    constructor(protected _output: fs.WriteStream, protected _log: ILogger, protected _input: string | null) {
        super();
        this.on("doctype", this.doctype);
        this.on("startTag", this.startTag);
        this.on("endTag", this.endTag);
        this.on("text", this.text);
        this.on("comment", this.comment);
    }

    startIgnoring() {
        this._ignoring = true;
    }

    stopIgnoring() {
        this._ignoring = false;
    }

    isIgnoring(): boolean {
        return this._ignoring;
    }
    doctype(name: string, publicId: string, _systemId: string, _location?: Parse5Location): void {
        if (this._ignoring) return;
        this._output.write(`<!DOCTYPE ${name} "PUBLIC ${publicId}">`);
    }

    startTag(name: string, attrs: Parse5Attribute[], selfClosing: boolean, _location?: Parse5StartTagLocation): void {
        const lc = name.toLowerCase();
        if (lc == "style") {
            this._isStyle = true;
        }
        if (this._ignoring) return;
        this._output.write(`<${name}`);
        for (const attr of attrs) {
            this._output.write(` ${attr.name}`);
            if (attr.value.length >= 0) {
                this._output.write(`="${HtmlWriter.escAttr(attr.value)}"`);
            }
        }
        this._output.write(selfClosing ? "/>" : ">");
    }

    endTag(name: string, _location?: Parse5Location): void {
        if (this._ignoring) return;
        this._output.write(`</${name}>`);
        const lc = name.toLowerCase();
        if (lc == "style") {
            this._isStyle = false;
        }
    }

    text(text: string, location?: Parse5Location): void {
        if (this._ignoring) return;
        if (!location) throw new AssertionError();
        if (this._input != null) {
            text = this._input.substring(location.startOffset, location.endOffset);
            this._output.write(text);
        } else {
            // text is unescaped.
            this._output.write(this._isStyle ? text : HtmlWriter.escText(text));
        }
    }

    comment(text: string, location?: Parse5Location): void {
        if (this._ignoring) return;
        if (!location) throw new AssertionError();
        if (this._input != null) {
            text = this._input.substring(location.startOffset, location.endOffset);
            this._output.write(`<!-- ${text} -->`);
        } else {
            // text is unescaped.
            this._output.write(`<!-- ${HtmlWriter.escText(text)} -->`);
        }
    }

}

export class Encoding {
    static ascii = "ascii";
    static utf8 = "utf8";
    static utf16le = "utf16le";
    static ucs2 = "ucs2";
    static binary = "binary";
    static latin1 = "latin1";
    static win1252 = "win-1252";
    static iso88591 = "ISO-8859-1";
    static base64 = "base64";
    static hex = "hex";
}
