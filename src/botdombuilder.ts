/*
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

import { Fun10, Fun21, Stack, StringMap, StringMapX, stringX } from "./botcore";

export class DomBuilder {
    private static attr1_(elm: Element, key: string, value: stringX): Element {
        if (value == null) {
            elm.removeAttribute(key);
        } else {
            elm.setAttribute(key, value);
        }
        return elm;
    }
    private static attrs1_(elm: Element, attrs: StringMap<stringX> | null = null): Element {
        if (attrs != null) {
            for (const [k, v] of Object.entries(attrs)) {
                this.attr1_(elm, k, v);
            }
        }
        return elm;
    }

    /// Create a text node. 
    static createText_(content: string): Text {
        return new Text(content);
    }

    static offline1_(doc: Document, tag: string, ...classes: string[]) {
        return new DomBuilder(doc.createElement(tag)).attr_("class", classes.join(" "));
    }

    /// Create a DOM root that is not attached to a parent. 
    static offline_(doc: Document, tag: string, attrs: StringMap<stringX> | null = null): DomBuilder {
        return new DomBuilder(doc.createElement(tag), attrs);
    }

    #stack = new Stack<Element>();
    #cursor: Element;

    /// Use the given element as root of the tree. 
    constructor(cursor: Element, attrs: StringMap<stringX> | null = null) {
        this.#cursor = DomBuilder.attrs1_(cursor, attrs);
    }

    /// This is basically a noop. However, it is useful for grouping statements in
    /// the same level and visualize nesting levels in typescript code. Typically,
    /// a group contains a matching push() and pop().
    /// Example: b.child_("ul").group_(
    ///     b.push_().child_("li")...,
    ///     b.peek_().child_("li")...,
    ///     b.pop_().child_("li")...,
    /// )
    group_(..._dontcare: any[]): this {
        return this;
    }

    /// Add attributes to the cursor element.
    attr_(key: string, value: string): this {
        DomBuilder.attr1_(this.#cursor, key, value);
        return this;
    }

    attrs_(keyvalues: StringMap<stringX>): this {
        DomBuilder.attrs1_(this.#cursor, keyvalues);
        return this;
    }

    addClass_(c: string): this {
        this.#cursor.classList.add(c);
        return this;
    }

    addClasses_(c: Array<string>): this {
        for (const cc of c) { this.#cursor.classList.add(cc); }
        return this;
    }

    addStyles_(styles: StringMap<stringX>): this {
        const style = (this.#cursor as HTMLElement).style;
        for (const [key, value] of Object.entries(styles)) {
            style.setProperty(key, value);
        }
        return this;
    }

    append_(child: string | Element, attrs: StringMap<stringX> | null = null): this {
        this.#cursor.appendChild(typeof (child) === "string"
            ? this.createElement_(child, attrs)
            : DomBuilder.attrs1_(child, attrs));
        return this;
    }

    appendNodes_(...child: Node[]): this {
        for (const n of child) {
            this, this.#cursor.appendChild(n);
        }
        return this;
    }

    append1_(child: string | Element, ...classes: string[]): this {
        return this.append_(child).attr_("class", classes.join(" "));
    }

    /// Insert node/nodes before the next node as children to the cursor element.
    /// Overloads:
    ///     (Node node, String tag, [attrs])
    ///     (Node node, Element  newchild, [attrs])
    ///     (Node node, Array<Node> newchildren)
    ///     (Node node, Node newchild)
    insertBefore_(next: Node | null, child: string | Element | Array<Node> | Node, attrs: StringMapX<stringX> = null): this {
        if (child instanceof Array) {
            for (const n of child) {
                this.#cursor.insertBefore(n, next);
            }
        } else {
            this.#cursor.insertBefore(
                typeof (child) === "string"
                    ? this.createElement_(child, attrs)
                    : (child.nodeType == Node.ELEMENT_NODE)
                        ? DomBuilder.attrs1_(child as Element, attrs)
                        : child,
                next);
        }
        return this;
    }

    prepend_(child: string | Element, attrs: StringMap<string> | null = null): this {
        return this.insertBefore_(this.#cursor.firstChild, child, attrs);
    }

    prependNodes_(...child: Node[]): this {
        const next = this.#cursor.firstChild;
        for (const n of child) {
            this.insertBefore_(next, n);
        }
        return this;
    }

    prepend1_(child: string | Element, ...classes: string[]): this {
        return this.prepend_(child).attr_('class', classes.join(" "));
    }

    /// Append a child and use it as cursor.
    /// Overloads:
    /// (String, [StringMap<String> attrs])
    /// (Element)
    child_(child: string | Element, attrs: StringMap<stringX> | null = null): this {
        this.#cursor = this.#cursor.appendChild((typeof (child) === "string")
            ? this.createElement_(child, attrs)
            : DomBuilder.attrs1_(child, attrs));
        return this;
    }

    /// Append a child and use it as cursor.
    child1_(child: string | Element, ...classes: string[]): this {
        return this.child_(child).attr_("class", classes.join(" "));
    }

    /// Create and insert node as child of the cursor before the given next node.
    /// Overloads:
    /// (Node next, String tag, [StringMap<String> attrs])
    /// (Node next, Element child)
    childBefore_(next: Node | null, child: string | Element, attrs: StringMap<stringX> | null = null): this {
        this.#cursor = this.#cursor.insertBefore((typeof (child) === "string"
            ? this.createElement_(child, attrs)
            : DomBuilder.attrs1_(child, attrs)),
            next);
        return this;
    }

    childBefore1_(next: Node, tag: string, ...classes: string[]): this {
        return this.childBefore_(next, tag).attr_('class', classes.join(" "));
    }

    childBeforeFirst_(child: string | Element, attrs: StringMap<string> | null = null): this {
        return this.childBefore_(this.#cursor.firstChild, child, attrs);
    }

    childBeforeFirst1_(tag: string | Element, ...classes: string[]): this {
        return this.childBefore_(this.#cursor.firstChild, tag).attr_('class', classes.join(" "));
    }

    /// Insert a sibling before the cursor and use it as new cursor.
    /// Overloads:
    /// (String tag, [StringMap<String> attrs])
    /// (Element elm)
    siblingBefore_(child: string | Element, attrs: StringMap<stringX> | null = null): this {
        this.#cursor = this.#cursor.parentNode!.insertBefore((typeof (child) === "string"
            ? this.createElement_(child, attrs)
            : DomBuilder.attrs1_(child, attrs)),
            this.#cursor);
        return this;
    }

    /// Insert a sibling after the cursor and use it as new cursor.
    /// Overloads:
    /// (String tag, [StringMap<String> attrs])
    /// (Element elm)
    siblingAfter_(child: string | Element, attrs: StringMap<stringX> | null = null): this {
        this.#cursor = this.#cursor.parentNode!.insertBefore((typeof (child) === "string"
            ? this.createElement_(child, attrs)
            : DomBuilder.attrs1_(child, attrs)),
            this.#cursor.nextSibling);
        return this;
    }

    /// Append text as child to cursor. 
    text_(text: string): this {
        this.#cursor.appendChild(DomBuilder.createText_(text));
        return this;
    }

    /// Append text as child to cursor. 
    textBefore_(next: Node | null, text: string): this {
        this.#cursor.insertBefore(DomBuilder.createText_(text), next);
        return this;
    }

    /// Create a text node and insert as a sibling after the cursor. 
    textSiblingAfter_(text: string): Text {
        const textnode = DomBuilder.createText_(text);
        this.#cursor.parentNode!.insertBefore(textnode, this.#cursor.nextSibling);
        return textnode;
    }

    /// Remove the given child from the current cursor element. 
    removeChild_(child: Node): this {
        child.parentNode?.removeChild(child);
        return this;
    }

    removeChildren_(children: Array<Node>): this {
        for (const c of children) {
            c.parentNode?.removeChild(c);
        }
        return this;
    }

    /// Replace the given child with the given bynode from the current cursor element. 
    replaceChild_(child: Node, bynode: Node): this {
        this.#cursor.insertBefore(bynode, child);
        child.parentNode?.removeChild(child);
        return this;
    }

    /// Remove children start up to but not including end of the given element
    /// and append as children of cursor.
    moveChildren_(start: Node | null, end: Node | null): this {
        let c: Node | null = start;
        while (c != null && c != end) {
            const n: Node | null = c.nextSibling;
            c.parentNode?.removeChild(c);
            this.#cursor.append(c);
            c = n;
        }
        return this;
    }

    /// Append children of the given element and insert as children of
    /// cursor before the given next node.
    moveChildrenBefore_(next: Node, start: Node | null, end: Node | null): this {
        let c: Node | null = start;
        while (c != null && c != end) {
            const n: Node | null = c.nextSibling;
            c.parentNode?.removeChild(c);
            this.#cursor.insertBefore(c, next);
            c = n;
        }
        return this;
    }

    /// Wrap the cursor with the given tag and use the wrapper as cursor.
    wrap_(tag: string | Element, attrs: StringMap<stringX>): this {
        const target = this.cursor_();
        this.up_().childBefore_(target, tag, attrs).push_().up_().removeChild_(target).pop_().appendNodes_(target);
        return this;
    }

    /// Move children of given child to as sibling before child and remove child. 
    unwrap_(child: Node): this {
        this.moveChildrenBefore_(child, child.firstChild, null);
        child.parentNode?.removeChild(child)
        return this;
    }

    /// Remove all children of the cursor.
    empty_(): this {
        for (let c = this.#cursor.firstChild; c != null;) {
            const n = c.nextSibling;
            c.remove();
            c = n;
        }
        return this;
    }

    /// Push cursor onto stack.
    push_(): this {
        this.#stack.push_(this.#cursor);
        return this;
    }

    /// Pop the element from the cursor stack and use it as the cursor element.
    pop_(n: number = 1): this {
        while (--n >= 0) {
            const e = this.#stack.pop_();
            if (e === undefined) throw new Error();
            this.#cursor = e;
        }
        return this;
    }

    /// Restore but do not remove the cursor element from top of the cursor stack.
    peek_(): this {
        this.#cursor = this.#stack.peek_()!;
        return this;
    }

    /// Swap cursor with top of stack. 
    swap_(): this {
        const cursor = this.#stack.pop_()!;
        this.#stack.push_(this.#cursor);
        this.#cursor = cursor;
        return this;
    }

    /// Use parent element of the cursor element.
    /// If it is null, throw an Error.
    up_(): this {
        const parent = this.#cursor.parentElement;
        if (parent == null) { throw new Error(); }
        this.#cursor = parent;
        return this;
    }

    /// Use the next sibling element of the cursor element.
    /// If it is null, throw an Error.
    right_(): this {
        const sibling = this.#cursor.nextElementSibling;
        if (sibling == null) { throw new Error(); }
        this.#cursor = sibling;
        return this;
    }

    /// Use the previous sibling element of the cursor element.
    /// If it is null, throw an Error.
    left_(): this {
        const sibling = this.#cursor.previousElementSibling;
        if (sibling == null) { throw new Error(); }
        this.#cursor = sibling;
        return this;
    }

    /// Use the first child element of the cursor element.
    /// If it is null, throw an Error.
    first_(): this {
        const child = this.#cursor.firstElementChild;
        if (child == null) { throw new Error(); }
        this.#cursor = child;
        return this;
    }

    setCursor_(elm: Element): this {
        this.#cursor = elm;
        return this;
    }

    cursor_(): Element {
        return this.#cursor;
    }

    classList_(): DOMTokenList {
        return this.#cursor.classList;
    }

    /// @return The document of the cursor. 
    doc_(): Document {
        return this.#cursor.ownerDocument;
    }

    /// Create a selection in the document.defaultView.
    /// Overloads:
    ///     () Select the cursor element.
    ///     (Node child) Select the given child node of the cursor.
    ///     (Node start, Node end) Select child start inclusive to child end exclusive of the cursor.
    /// If end is null, select from start to last child of the cursor.
    select_(start: Node | null = null, end: Node | null = null): this {
        const selection = this.doc_().defaultView?.getSelection();
        if (selection != null) {
            selection.removeAllRanges();
            selection.addRange(this.rangeOf_(start, end));
        }
        return this;
    }

    selectTextRange_(text: Node, start: number, end: number): this {
        const selection = this.doc_().defaultView?.getSelection();
        if (selection != null) {
            const range = this.createRange_();
            range.setStart(text, start);
            range.setEnd(text, end);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        return this;
    }

    /// ScrollTo the given x, y document coordinate in the document.defaultView
    scrollTo_(x: number, y: number): this {
        this.doc_().defaultView?.scrollTo(x, y);
        return this;
    }

    /// Execute the given function as fn(cursor()) and return this builder.
    exec_(fn: Fun10<Element>): this {
        fn(this.#cursor);
        return this;
    }

    /// Execute the given function on each child of the cursor, break if fn() return false.
    children_(fn: Fun21<Node, Element, boolean>): this {
        for (let c = this.#cursor.firstChild; c != null; c = c.nextSibling) {
            if (!fn(c, this.#cursor)) break;
        }
        return this;
    }

    /// Execute fn(child, cursor) for the given children of the cursor, break if fn() return false.
    each_(start: Node | null, end: Node | null, fn: Fun21<Node, Element, boolean>): this {
        for (let c = start; c != null && c != end;) {
            const n = c.nextSibling;
            if (!fn(c, this.#cursor)) break;
            c = n;
        }
        return this;
    }

    /// Create an element with given tag and attributes.
    createElement_(tag: string, attrs: StringMap<stringX> | null = null): Element {
        return DomBuilder.attrs1_(this.#cursor.ownerDocument.createElement(tag), attrs);
    }

    /// @return Index of the given child node of the cursor.
    indexOf_(child: Node): number {
        let i: number = 0;
        for (let c = this.#cursor.firstChild; c != null; c = c.nextSibling, ++i) {
            if (c === child) { return i; }
        }
        return -1;
    }

    /// @param start A child of cursor. If null select the cursor.
    /// @param end A child of cursor, If null use lastChild.
    /// @return A range that start before start and end after end.
    rangeOf_(start: Node | null, end: Node | null = null): Range {
        const ret: Range = this.createRange_();
        if (start == null) {
            ret.selectNode(this.#cursor);
        } else {
            ret.setStartBefore(start);
            ret.setEndAfter(end ?? this.#cursor.lastChild ?? start);
        }
        return ret;
    }

    /// @return An empty range.
    createRange_(): Range {
        return this.#cursor.ownerDocument.createRange();
    }

    /// Return the current cursor, but pop n element after it.
    cursorPop_(n: number = 1): Element {
        const ret = this.cursor_();
        this.pop_(n);
        return ret;
    }
}
