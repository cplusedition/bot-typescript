/*
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

import * as child_process from "child_process";
import { Filepath } from "../botnode";
import { Logger } from "../botcore";

let log = new Logger(true);

export async function sanityCheck() {
    new Filepath("src/test/builder.ts").aStat_().then((stat) => {
        log.d_(`${stat?.isFile() ?? false}`);
    });
    log.d_((await (new Filepath("src/test/builder.ts").existsOrFail_())).path_())
}

export function distSrc() {
    let distdir = new Filepath("dist").mkdirsOrFail_();
    let zipfile = distdir.file_("bot-typescript-src.zip").rmOrFail_();
    let args = ["-ry", zipfile.path_()];
    args.push("package.json", "tsconfig.json", "README.md", "COPYRIGHT", "LICENSE", "credits.txt");
    args.push(".vscode/launch.json", ".vscode/tasks.json");
    args.push(
        "src/test/builder.ts",
        "src/botbrowser.ts",
        "src/botbuilder.ts",
        "src/botcore.ts",
        "src/botdombuilder.ts",
        "src/botnode.ts",
        "src/botparse5.ts",
        "src/botrunner.ts",
        "src/bottasks.ts",
        "src/bottest.ts");
    child_process.execFileSync("zip", args);
    log.d_(`# See ${zipfile.path_()}`);
}

export function clean() {
    new Filepath("dist").mkdirsOrFail_().rmdirSubtreesOrFail_();
    new Filepath("build").mkdirsOrFail_().rmdirSubtreesOrFail_();
    new Filepath("tsconfig.tsbuildinfo").rmOrFail_()
    log.d_("# Clean done.");
}

