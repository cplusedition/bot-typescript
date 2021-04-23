/*
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
    constructor(public attrs$: Parse5Attribute[]) {
    }
    add_(name: string, value: string): this {
        this.attrs$.push({ name: name, value: value });
        return this;
    }
}

export class Parse5Ut {
    static getFirstElementChild_(doc: Document2): Element2 | null {
        for (let c of doc.childNodes) {
            if (c.nodeType == Node.ELEMENT_NODE) return (c as Element2);
        }
        return null;
    }
    static getElementByIdFromDocument_(id: string, doc: Document2): Element2 | null {
        let root = this.getFirstElementChild_(doc);
        if (root == null) return null;
        return Parse5Ut.elementSelector_(root, (elm: Element2) => {
            return id == elm.attribs["id"] ? elm : null;
        })
    }
    static getElementById_(id: string, node: Node2): Element2 | null {
        return Parse5Ut.elementSelector_(node, (elm: Element2) => {
            return id == elm.attribs["id"] ? elm : null;
        })
    }
    static elementSelector_(node: Node2, predicate: (elm: Element2) => Element2 | null): Element2 | null {
        if (node.nodeType == Node.ELEMENT_NODE) {
            let elm = node as Element2;
            let ret = predicate(elm);
            if (ret != null) return ret;
            for (let child of elm.childNodes) {
                let ret = this.elementSelector_(child, predicate);
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
    static addAttr_(attrs: Parse5Attribute[], name: string, value: string): Parse5AttributeBuilder {
        return new Parse5AttributeBuilder(attrs).add_(name, value);
    }
    static getAttr_(attrs: Parse5Attribute[], name: string): Parse5Attribute | null {
        for (const attr of attrs) {
            if (attr.name == name) return attr;
        }
        return null;
    }
    static removeAttr_(attrs: Parse5Attribute[], name: string): boolean {
        for (let index = 0, len = attrs.length; index < len; ++index) {
            if (attrs[index].name == name) {
                attrs.splice(index, 1);
                return true;
            }
        }
        return false;
    }
    static removeAttrs_(attrs: Parse5Attribute[], ...names: string[]): boolean {
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
    static hasClass_(attrs: Parse5Attribute[], name: string): boolean {
        const attr = Parse5Ut.getAttr_(attrs, "class");
        return (attr != null && attr.value.indexOf(name) >= 0);
    }
    static hasId_(attrs: Parse5Attribute[], id: string): boolean {
        for (const attr of attrs) {
            if (attr.name == "id" && attr.value == id) return true;
        }
        return false;
    }
}

export class Parse5SAXAdapterBase extends parse5.SAXParser {

    constructor() {
        super({ locationInfo: true });
        this.on("doctype", this.doctype_);
        this.on("startTag", this.startTag_);
        this.on("endTag", this.endTag_);
        this.on("text", this.text_);
        this.on("comment", this.comment_);
    }

    doctype_(_name: string, _publicId: string, _systemId: string, _location?: Parse5Location): void {
    }

    startTag_(_name: string, _attrs: Parse5Attribute[], _selfClosing: boolean, _location?: Parse5StartTagLocation): void {
    }

    endTag_(_name: string, _location?: Parse5Location): void {
    }

    text_(_text: string, _location?: Parse5Location): void {
    }

    comment_(_text: string, _location?: Parse5Location): void {
    }
}

export class Parse5SAXAdapter extends Parse5SAXAdapterBase {

    private ignoring$ = false;
    private isStyle$ = false;

    constructor(protected output$: fs.WriteStream, protected log$: ILogger, protected input$: string | null) {
        super();
        this.on("doctype", this.doctype_);
        this.on("startTag", this.startTag_);
        this.on("endTag", this.endTag_);
        this.on("text", this.text_);
        this.on("comment", this.comment_);
    }

    startIgnoring_() {
        this.ignoring$ = true;
    }

    stopIgnoring_() {
        this.ignoring$ = false;
    }

    isIgnoring_(): boolean {
        return this.ignoring$;
    }
    doctype_(name: string, publicId: string, _systemId: string, _location?: Parse5Location): void {
        if (this.ignoring$) return;
        this.output$.write(`<!DOCTYPE ${name} "PUBLIC ${publicId}">`);
    }

    startTag_(name: string, attrs: Parse5Attribute[], selfClosing: boolean, _location?: Parse5StartTagLocation): void {
        const lc = name.toLowerCase();
        if (lc == "style") {
            this.isStyle$ = true;
        }
        if (this.ignoring$) return;
        this.output$.write(`<${name}`);
        for (const attr of attrs) {
            this.output$.write(` ${attr.name}`);
            if (attr.value.length >= 0) {
                this.output$.write(`="${HtmlWriter.escAttr_(attr.value)}"`);
            }
        }
        this.output$.write(selfClosing ? "/>" : ">");
    }

    endTag_(name: string, _location?: Parse5Location): void {
        if (this.ignoring$) return;
        this.output$.write(`</${name}>`);
        const lc = name.toLowerCase();
        if (lc == "style") {
            this.isStyle$ = false;
        }
    }

    text_(text: string, location?: Parse5Location): void {
        if (this.ignoring$) return;
        if (!location) throw new AssertionError();
        if (this.input$ != null) {
            text = this.input$.substring(location.startOffset, location.endOffset);
            this.output$.write(text);
        } else {
            // text is unescaped.
            this.output$.write(this.isStyle$ ? text : HtmlWriter.escText_(text));
        }
    }

    comment_(text: string, location?: Parse5Location): void {
        if (this.ignoring$) return;
        if (!location) throw new AssertionError();
        if (this.input$ != null) {
            text = this.input$.substring(location.startOffset, location.endOffset);
            this.output$.write(`<!-- ${text} -->`);
        } else {
            // text is unescaped.
            this.output$.write(`<!-- ${HtmlWriter.escText_(text)} -->`);
        }
    }

}

export class Encoding {
    static ascii$ = "ascii";
    static utf8$ = "utf8";
    static utf16le$ = "utf16le";
    static ucs2$ = "ucs2";
    static binary$ = "binary";
    static latin1$ = "latin1";
    static win1252$ = "win-1252";
    static iso88591$ = "ISO-8859-1";
    static base64$ = "base64";
    static hex$ = "hex";
}
