/*
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

import { Stats } from "fs";
import { Fun31 } from "./botcore";
import { Filepath } from "./botnode";

export function copyDiff_(todir: Filepath, fromdir: Filepath, ...rpaths: string[]): number {
    let count = 0;
    for (const rpath of rpaths) {
        const fromfile = fromdir.file_(rpath);
        const tofile = todir.file_(rpath);
        if (copyDiffFile_(fromfile, tofile)) {
            ++count;
        }
    }
    return count;
}

export function copyDiffFile_(fromfile: Filepath, tofile: Filepath): boolean {
    const fromexists = fromfile.exists_();
    const toexists = tofile.exists_();
    if (fromexists && toexists) {
        if (fromfile.readText_() == tofile.readText_()) {
            return false;
        }
    }
    fromfile.copyFileAs_(tofile);
    return true;
}

export function copyDiffDir_(todir: Filepath, fromdir: Filepath, accept?: Fun31<Filepath, string, Stats, boolean>): number {
    let count = 0;
    fromdir.walk_((file, rpath, stat) => {
        if (accept?.(file, rpath, stat) ?? true) {
            file.copyFileToDir_(todir);
            ++count;
        }
    });
    return count;
}

export function copyMirrorDir_(todir: Filepath, ...fromdirs: Filepath[]): [copied: number, notcopied: number] {
    const toremove = new Array<Filepath>();
    todir.scan_((file, rpath, stat) => {
        let found = false;
        const isfile = stat.isFile();
        const isdir = stat.isDirectory();
        if (isfile || isdir) {
            for (const fromdir of fromdirs) {
                const fromfile = fromdir.file_(rpath);
                const fromstat = fromfile.lstatOrNull_();
                if (fromstat != null && (fromstat.isFile() || fromstat.isDirectory()) && fromstat.isFile() == isfile) {
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            toremove.push(file);
            return false;
        }
        return true;
    });
    for (const file of toremove) {
        if (file.isDirectory_()) file.rmdirTree_(); else file.rmdir_();
    }
    let copied = 0;
    let notcopied = 0;
    for (const fromdir of fromdirs) {
        fromdir.walk_((file, rpath, stat) => {
            const tofile = todir.file_(rpath);
            if (stat.isDirectory()) {
                tofile.mkdirs_();
                return;
            }
            if (!tofile.exists_() || tofile.differ_(file)) {
                file.copyFileAs_(tofile);
                ++copied;
            } else {
                ++notcopied;
            }
        });
    }
    return [copied, notcopied];
}
