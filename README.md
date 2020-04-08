## Introduction ##
Build On Test for typescript, nodejs and vscode. The project contains a simple vscode launcher and some nodejs utility classes for creating build script in typescript. The core of the launcher boil down to just a one liner:
```
    eval(`const t = require('./${filename}'); t.${testname}();`);
```
and a vscode test task `bot-runner`.  See `.vscode/tasks.json` for details. The other `bot*` classes are utilities for use in build scripts. To invoke a build script, aka a test, simply select the name of the test function, which must be exported, and invoke the test task `bot-runner`.

## Build instruction ##
First of all, pull dependencies with:
```
    npm install --save-dev
```
Open the project in vscode. Make sure the `bot-tsc` task is the default build task and the `bot-runner` task is the default test task. Run the build task to build.

For a sample of a build script, see `builder.ts`.  Select the function name `dist` in `builder.ts` and invoke the test task `bot-runner`. The `dist` function would be executed and create the distribution zip file at `dist/bot-ts.zip`.

## License ##
Released under Apache License 2.0. See `LICENSE`.
