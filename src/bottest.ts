/*
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

import { Fun00, Fun01, ILogger } from "./botcore";

export class TestTimer {
    private start$ = Date.now();
    private step$ = this.start$;
    constructor() { }
    /// Time elapsed in ms.
    elapsed_(): number {
        return Date.now() - this.start$;
    }
    /// Timm elapsed since last step.
    step_(): number {
        let last = this.step$;
        this.step$ = Date.now();
        return this.step$ - last;
    }
    /// Formatted string for time elapsed in sec.
    sec_(width: number = 6): string {
        return this.format_(this.elapsed_(), width);
    }
    format_(elapsed: number, width: number = 6): string {
        let t = elapsed / 1000;
        if (t > 999.994) {
            return Math.round(t).toString();
        }
        return t.toFixed(2).padStart(width, " ");
    }
}

export interface ITestLogger extends ILogger {
    errorCount_(): number;
    dt_(msg: string, timer?: TestTimer): void;
    it_(msg: string, timer?: TestTimer): void;
    subtest_(msg: string, code: Fun00): void;
    enter_(msg: string, code: Fun01<Promise<void>>): Promise<void>;
    logs_(): Array<string>;
}

export class TestLogger extends TestTimer implements ITestLogger {
    private m_errors = 0;
    private m_logs = new Array<string>();
    constructor(private m_debugging: boolean = false, private m_keeplogs = true) {
        super();
    }
    reset_() {
        this.m_errors = 0;
    }
    private log_(msg: string): void {
        if (this.m_keeplogs) {
            this.m_logs.push(msg);
        }
        console.log(msg);
    }
    logs_() {
        return this.m_logs;
    }
    d_(msg: string): void {
        if (this.m_debugging) {
            this.log_(msg);
        }
    }
    i_(msg: string): void {
        this.log_(msg);
    }
    w_(msg: string, exception?: any): void {
        this.it_(msg, this);
        if (this.m_debugging && exception) {
            this.log_(`${exception}`);
        }
    }
    e_(msg?: string, exception?: any): void {
        ++this.m_errors;
        if (msg !== undefined) {
            this.it_(msg, this);
        }
        if (this.m_debugging && exception) {
            this.log_(`${exception}`);
        }
    }
    dt_(msg: string, timer?: TestTimer): void {
        if (this.m_debugging) {
            if (!timer) timer = this;
            this.log_(`### ${timer.format_(timer.step_())}/${timer.sec_()}s: ${msg}`);
        }
    }
    it_(msg: string, timer?: TestTimer): void {
        if (!timer) timer = this;
        this.log_(`${timer.sec_()}s: ${msg}`);
    }
    errorCount_(): number {
        return this.m_errors;
    }
    subtest_(msg: string, code: Fun00) {
        this.dt_(`#+++ ${msg}`);
        try {
            code();
        } finally {
            this.dt_(`#--- ${msg}`);
            if (this.m_errors > 0) throw Error("Test failed");
        }
    }
    async enter_(msg: String, code: Fun01<Promise<void>>): Promise<void> {
        this.dt_(`#+++ ${msg}`);
        return await code().finally(() => {
            this.dt_(`#--- ${msg}`);
            if (this.m_errors > 0) throw Error("Test failed");
        });
    }
}

export class TestBase extends TestLogger {
    constructor(debugging: boolean = true) {
        super(debugging);
    }
}
