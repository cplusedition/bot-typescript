/*!
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

import * as child_process from "child_process";
import { Filepath } from "./botnode";
import { Logger } from "./botcore";

let log = new Logger(true);

export function distSrc() {
    let distdir = new Filepath("dist").mkdirsSync();
    let zipfile = distdir.file("bot-typescript-src.zip");
    zipfile.rmSync();
    let args = ["-ry", zipfile.path()];
    args.push("package.json", "tsconfig.json", "README.md", "COPYRIGHT", "LICENSE");
    args.push(".vscode/launch.json", ".vscode/tasks.json");
    args.push(
        "src/botcore.ts",
        "src/botrunner.ts",
        "src/botnode.ts",
        "src/botparse5.ts",
        "src/botbrowser.ts",
        "src/bottest.ts",
        "src/builder.ts");
    child_process.execFileSync("zip", args);
    log.d(`# See ${zipfile.path()}`);
}

export function clean() {
    new Filepath("dist").mkdirsSync().rmdirSubtreesSync();
    new Filepath("out").mkdirsSync().rmdirSubtreesSync();
    log.d("# Clean done.");
}

