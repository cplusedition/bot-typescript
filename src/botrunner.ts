/*
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

export interface Task {
    run_(): void;
}

export class BotRunner {

    static usage(): void {
        console.log(`Usage: ${process.execPath} <filename> <testname> [<methodname>]`);
    }

    static run_(): void {
        let filename = process.argv[2];
        let testname = process.argv[3];
        if (!filename || !testname) {
            BotRunner.usage();
            return;
        }
        const path = filename.startsWith("/") ? filename : "./" + filename;
        const t = require(path);
        const f: any | null | undefined = t[testname];
        if (f instanceof Function) {
            const m = (process.argv.length >= 5) ? process.argv[4] : "run_";
            if (f["prototype"] && f["prototype"][`${m}`]) {
                new f()[`${m}`]();
            } else {
                f.apply(t);
            }
        } else {
            throw new Error(`${testname} () not found in ${filename}: ${f}`)
        }
    }
}

BotRunner.run_();
