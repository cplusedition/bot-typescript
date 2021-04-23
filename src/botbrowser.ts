/*
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

/// Utilities that works in browser.

export type NodeOrString = Node | string;
export type NodeX = Node | null;
export type NodeXX = Node | null | undefined;
export type ElementX = Element | null;
export type ElementXX = Element | null | undefined;
export type HTMLElementX = HTMLElement | null;
export type HTMLElementXX = HTMLElement | null | undefined;
export type RangeX = Range | null;
export type RangeXX = Range | null | undefined;

export class DomUt {

    static stopEvent_(event: Event) {
        event.stopPropagation();
        event.preventDefault();
    }

    static asHTMLDocument(doc: any): HTMLDocument | null {
        return doc !== null
            && doc !== undefined
            && (doc instanceof HTMLDocument || Object.prototype.toString.call(doc) == "[object HTMLDocument]")
            ? doc as HTMLDocument
            : null;
    }

    private static ELMPAT = new RegExp("^\\[object HTML\\w*Element\\]\$");

    static asHTMLElement(elm: any): HTMLElementX {
        return elm !== null
            && elm !== undefined
            && (elm instanceof HTMLElement || this.ELMPAT.test(Object.prototype.toString.call(elm)))
            ? elm as HTMLElement
            : null;
    }

    static matchingTarget_(event: Event, selector: string): Element | null {
        if (selector == null) return null;
        let target = this.asHTMLElement(event.target);
        let currentTarget = this.asHTMLElement(event.currentTarget);
        if (target != null && currentTarget != null) {
            const top = currentTarget.parentElement;
            do {
                if (target != null && target.matches(selector)) return target;
                target = target.parentElement;
            } while (target != null && target != top);
        }
        return null;
    }
}

export interface IndexedItems<V> {
    readonly length: number;
    item(index: number): V | null;
}

export class NullableItemsIterable<V> implements IterableIterator<V | null> {
    private index$ = 0;
    private length$: number;
    constructor(private items$: IndexedItems<V>) {
        this.length$ = items$.length;
    }
    [Symbol.iterator](): IterableIterator<V | null> {
        return this;
    }
    next(): IteratorResult<V | null> {
        if (this.index$ < this.length$) {
            return {
                value: this.items$.item(this.index$++),
                done: false,
            };
        } else {
            return {
                value: undefined,
                done: true,
            }
        }
    }
}

export class ItemsIterable<V> implements IterableIterator<V> {
    private index$ = 0;
    private length$: number;
    constructor(private items$: IndexedItems<V | null>) {
        this.length$ = items$.length;
    }
    [Symbol.iterator](): IterableIterator<V> {
        return this;
    }
    next(): IteratorResult<V> {
        while (this.index$ < this.length$) {
            let item = this.items$.item(this.index$);
            ++this.index$;
            if (item == null) continue;
            return {
                value: item,
                done: false,
            };
        }
        return {
            value: undefined,
            done: true,
        }
    }
}
