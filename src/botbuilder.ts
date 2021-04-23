/*
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

import { ILogger, replaceAll_ } from "./botcore";
import { Filepath } from "./botnode";

export class GAV {
    group$: string;
    artifact$: string;
    version$: string;
    constructor(group: string, artifact: string, version: string) {
        this.group$ = group;
        this.artifact$ = artifact;
        this.version$ = version;
    }
    static fromGAV_(gav: string): GAV {
        let a = gav.split(":", 3);
        return new GAV(a[0], a[1], a[2]);
    }
    /// @param path In form group/artifact/version.
    static fromPath_(path: string): GAV {
        let gav = new Filepath(path);
        let ga = new Filepath(gav.dir_());
        return new GAV(replaceAll_(ga.dir_(), "/", "."), ga.nameWithSuffix_(), gav.nameWithSuffix_());
    }
    coord_(): string {
        return `${this.group$}:${this.artifact$}:${this.version$}`;
    }
    toString(): string {
        return this.coord_();
    }
}

export interface IBuilderConf {
    readonly project$: IProject;
    readonly builder$: IProject;
    readonly debugging$: boolean;
}

export interface IProject {
    readonly gav$: GAV;
    readonly dir$: Filepath;
    readonly srcDir$: Filepath;
    readonly buildDir$: Filepath;
    readonly distDir$: Filepath;
}

export interface IBuilder {
    readonly log$: ILogger;
    readonly conf$: IBuilderConf;
}

export class BuilderConf implements IBuilderConf {
    project$: IProject;
    builder$: IProject;
    debugging$: boolean;
    constructor(project: IProject, debugging: boolean = false, builder: IProject = project) {
        this.project$ = project;
        this.debugging$ = debugging;
        this.builder$ = builder;
    }
}

export class Project implements IProject {
    gav$: GAV;
    dir$: Filepath;
    srcDir$: Filepath;
    buildDir$: Filepath;
    distDir$: Filepath;

    constructor(gav: GAV, dir: Filepath) {
        this.gav$ = gav;
        this.dir$ = dir;
        this.srcDir$ = dir.file_("src");
        this.buildDir$ = dir.file_("build");
        this.distDir$ = dir.file_("dist");
    }

    toString(): string {
        return this.gav$.toString();
    }
}

export class Builder implements IBuilder {
    log$: ILogger;
    conf$: IBuilderConf;
    constructor(log: ILogger, conf: IBuilderConf) {
        this.log$ = log;
        this.conf$ = conf;
    }
}
