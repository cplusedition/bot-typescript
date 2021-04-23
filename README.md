## Introduction ##
Build On Test for Typescript, Node.js and VSCode. The project contains a simple VSCode launcher and some Node.js utility classes for creating build script in Typescript. The core of the launcher boil down to just a three liner:
```
    const t = require(`./${filename}`);
    const f: Function = t[testname];
    f.apply(t);
```
and a VSCode test task `bot-runner`.  See `.vscode/tasks.json` for details. The other `bot*` classes are utilities for use in build scripts. Task (aka a function) in a build script can be invoked as a test in VSCode, simply select the name of the function (which must be exported) and invoke the test task `bot-runner`.

## Build instruction ##
First of all, pull dependencies with:
```
    npm install --save-dev
```
Open the project in VSCode. Make sure the `bot-tsc` task is the default build task, the `bot-runner` task is the default test task and you have `tsc 4.1` or later. Run the build task (aka `bot-tsc bot-typescript` in the build task menu) to build.

For a sample of a build script, see `builder.ts`.  Select the function name `distSrc` in `builder.ts` and invoke the test task (aka `bot-runner bot-typescript` in the test task menu). The `distSrc` function would be executed and create the distribution zip file at `dist/bot-typescript-src.zip`. To debug the build script in VSCode, select the function name, set breakpoints and press `F5`.

>*NOTE: As of VSCode 1.43.2, the debugger sometimes does not stop at breakpoints in the build script. Adding a breakpoint at `f.apply(t)` in `botrunner.ts` seems to work around the problem and get the breakpoints in the build script working.*

## License ##
Released under Apache License 2.0. See [`LICENSE`](LICENSE).

  Copyright (c) Cplusedition Limited. All rights reserved.