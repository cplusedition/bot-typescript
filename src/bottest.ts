/*!
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

import { Fun00, ILogger } from "./botcore";

export class TestTimer {
    private _start = Date.now();
    constructor() { }
    elapsed(): number {
        return Date.now() - this._start;
    }
    sec(): string {
        let t = this.elapsed() / 1000;
        if (t > 999.994) {
            return Math.round(t).toString();
        }
        return t.toFixed(2).padStart(6, " ");
    }
}

export interface ITestLogger extends ILogger {
    dt(msg: string, timer?: TestTimer): void;
    it(msg: string, timer?: TestTimer): void;
    subtest(msg: string, code: Fun00): void;
}

export class TestLogger extends TestTimer implements ITestLogger {
    constructor(private _debugging: boolean = false) {
        super();
    }
    d(msg: string): void {
        if (this._debugging) {
            console.log(msg);
        }
    }
    i(msg: string): void {
        console.log(msg);
    }
    w(msg: string, exception?: any): void {
        this.it(msg, this);
        if (this._debugging && exception) {
            console.log(`${exception}`);
        }
    }
    e(msg: string, exception?: any): void {
        this.it(msg, this);
        if (this._debugging && exception) {
            console.log(`${exception}`);
        }
    }
    dt(msg: string, timer?: TestTimer): void {
        if (this._debugging) {
            if (!timer) timer = this;
            console.log(`${timer.sec()}s: ${msg}`);
        }
    }
    it(msg: string, timer?: TestTimer): void {
        if (!timer) timer = this;
        console.log(`${timer.sec()}s: ${msg}`);
    }
    subtest(msg: string, code: Fun00) {
        this.d(msg);
        code();
    }
}

export class TestBase extends TestLogger {
    constructor(debugging: boolean = true) {
        super(debugging);
    }
}
