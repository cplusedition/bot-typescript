/*
  Copyright (c) Cplusedition Limited. All rights reserved.
  Licensed under the Apache License, Version 2.0; You may obtain a
  copy of the License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN AS IS BASIS, WITHOUT WARRANTIES OR CONDITIONS
  OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY
  IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR
  PURPOSE, MERCHANTABLITY OR NON-INFRINGEMENT.
*/

/// Utilities that works in nodejs.

import { Fun00, Fun10, Fun11, TextUt, With } from "./botcore";
import fs = require("fs");
import Path = require("path");

export class Basepath {

    private basepath$: Path.ParsedPath
    private path$: string | null = null;

    constructor(...segments: string[]) {
        this.basepath$ = Path.parse(segments.join(Path.sep));
    }

    path_() {
        if (this.path$ == null) {
            this.path$ = Path.join(this.basepath$.dir, this.basepath$.base);
        }
        return this.path$;
    }

    dir_() {
        return this.basepath$.dir;
    }

    /// @return filename with suffix.
    nameWithSuffix_() {
        return this.basepath$.base;
    }

    /// @return filename without suffix.
    nameWithoutSuffix_() {
        return this.basepath$.name;
    }

    suffix_() {
        return this.basepath$.ext;
    }

    lcSuffix_() {
        return this.basepath$.ext.toLowerCase();
    }

    ext_() {
        const suffix = this.suffix_();
        return suffix.length == 0 ? null : suffix.substring(1);
    }

    lcExt() {
        const lcsuffix = this.lcSuffix_();
        return lcsuffix.length == 0 ? null : lcsuffix.substring(1);
    }

    parent_() {
        return new Basepath(this.dir_());
    }

    dirAndNameWithoutSuffix_() {
        const dir = this.dir_();
        const name = this.nameWithoutSuffix_();
        return dir.length == 0 ? name : dir + Path.sep + name;
    }

    sibling_(base: string): Basepath {
        return new Basepath(this.dir_(), base);
    }

    toString(): string {
        return `[${this.dir_()}, ${this.nameWithSuffix_()}, ${this.nameWithoutSuffix_()}, ${this.suffix_()}]`;
    }
}

export type FilepathX = Filepath | null;
export type FilepathXX = Filepath | null | undefined;

export type FileWalkerSyncCallback = (filepath: Filepath, rpath: string, stat: fs.Stats) => void;
export type FileWalkerSyncPredicate = (filepath: Filepath, rpath: string, stat: fs.Stats) => boolean
export type FileWalkerAsyncCallback = (filepath: Filepath, rpath: string, stat: fs.Stats, done: Fun00) => void;
export type FileWalkerAsyncPredicate = (filepath: Filepath, rpath: string, stat: fs.Stats, done: Fun10<boolean>) => void;

export class Filepath extends Basepath {

    static readonly DIRMODE = 0o755;
    static readonly FILEMODE = 0o644;
    static readonly SEP = "/";

    constructor(...segments: string[]) {
        let base = Filepath.SEP;
        let path = Path.normalize(segments.join(Path.sep));
        if (!path.startsWith(Filepath.SEP)) {
            base = process.cwd();
            path = Path.normalize(base + Path.sep + path);
        }
        super(path)
    }

    static resolve_(basedir: string, ...segments: string[]): Filepath {
        let path = Path.normalize(segments.join(Path.sep));
        if (!path.startsWith(Filepath.SEP)) {
            path = basedir + Path.sep + path;
        }
        return new Filepath(path);
    }

    static pwd_(): Filepath {
        return new Filepath(process.cwd());
    }

    static aMkdtemp_(): Promise<Filepath> {
        return new Promise<Filepath>((resolve, reject) => {
            fs.mkdtemp("temp", async (err, path) => {
                if (err != null) reject(err);
                resolve(new Filepath(path));
            });
        })
    }

    static async aTmpdir_(code: Fun11<Filepath, Promise<void>>): Promise<void> {
        return Filepath.aMkdtemp_().then(async (tmpdir) => {
            await code(tmpdir).finally(async () => {
                await tmpdir.aRmdirTree_();
            });
        });
    }

    static tmpdir_(code: Fun10<Filepath>) {
        const tmpdir = new Filepath(fs.mkdtempSync("temp"));
        try {
            code(tmpdir);
        } finally {
            tmpdir.rmdirTree_();
        }
    }

    /// @return An relative path of this file under the given basedir 
    /// or null if this file is not under the given basedir.
    rpathUnder_(basedir: Filepath): string | null {
        let path = this.path_();
        let basepath = basedir.path_() + Filepath.SEP;
        if (path.startsWith(basepath)) {
            return path.substring(basepath.length)
        }
        return null;
    }

    file_(...segments: string[]): Filepath {
        return new Filepath(this.path_(), segments.join(Path.sep));
    }

    /// @param base Filename with suffix.
    changeNameWithSuffix_(base: string): Filepath {
        return new Filepath(this.dir_(), base);
    }

    /// @param name Filename without suffix.
    changeNameWithoutSuffix_(name: string): Filepath {
        return new Filepath(this.dir_(), name + this.suffix_());
    }

    /// @param suffix Filename suffix with ".".
    changeSuffix_(suffix: string): Filepath {
        return new Filepath(this.dir_(), this.nameWithoutSuffix_() + suffix);
    }

    parentFilepath_(): Filepath | null {
        const dir = this.dir_();
        return dir == null ? null : new Filepath(dir);
    }

    toString(): string {
        return this.path_();
    }

    ///////////////////////////////////////////////////////////////
    // Sync methods

    access_(flag: number): boolean {
        try {
            fs.accessSync(this.path_(), flag);
            return true;
        } catch (_e) {
            return false;
        }
    }

    exists_(): boolean {
        return this.access_(fs.constants.F_OK);
    }

    existsOrFail_(): Filepath | never {
        fs.accessSync(this.path_(), fs.constants.F_OK);
        return this;
    }

    canRead_(): boolean {
        return this.access_(fs.constants.R_OK);
    }

    canWrite_(): boolean {
        return this.access_(fs.constants.W_OK);
    }

    lstatOrNull_(): fs.Stats | null {
        try {
            return fs.lstatSync(this.path_());
        } catch (_e) {
            return null;
        }
    }

    lstatOrFail_(): fs.Stats {
        return fs.lstatSync(this.path_());
    }

    statOrNull_(): fs.Stats | null {
        try {
            return fs.statSync(this.path_());
        } catch (_e) {
            return null;
        }
    }

    statOrFail_(): fs.Stats {
        return fs.statSync(this.path_());
    }

    isFile_(): boolean {
        return this.statOrNull_()?.isFile() ?? false;
    }

    isDirectory_(): boolean {
        return this.statOrNull_()?.isDirectory() ?? false;
    }

    isSymLink_(): boolean {
        return this.lstatOrNull_()?.isSymbolicLink() ?? false;
    }

    isEmptyDir_(): boolean {
        return this.listOrEmpty_().length == 0;
    }

    isNewerThan_(other: Filepath): boolean {
        return this.msOrFail_() > other.msOrZero_();
    }

    sizeOrFail_(): number {
        return this.statOrFail_().size;
    }

    msOrZero_(): number {
        return this.statOrNull_()?.mtimeMs ?? 0;
    }

    msOrFail_(): number {
        return this.statOrFail_().mtimeMs;
    }

    /// Remove this file if this is a file.
    rm_(): boolean {
        try {
            this.rmOrFail_();
            return true;
        } catch (e) {
            return false;
        }
    }

    rmOrFail_(): Filepath {
        if (fs.existsSync(this.path_())) {
            fs.unlinkSync(this.path_());
        }
        return this;
    }

    /// Remove this directory if it is an empty directory.
    rmdir_(): boolean {
        try {
            fs.rmdirSync(this.path_());
            return true;
        } catch (e) {
            return false;
        }
    }

    rmdirOrFail_(): Filepath {
        if (fs.existsSync(this.path_())) {
            fs.rmdirSync(this.path_());
        }
        return this;
    }

    /// Remove everything under this directory.
    rmdirSubtrees_(): boolean {
        let ret = true;
        for (const name of this.listOrEmpty_()) {
            const file = this.file_(name);
            const stat = file.statOrFail_();
            if (stat.isFile()) {
                if (!file.rm_()) ret = false;
            } else if (stat.isDirectory()) {
                if (!file.rmdirSubtrees_()) ret = false;
                if (!file.rmdir_()) ret = false;
            }
        }
        return ret;
    }

    rmdirSubtreesOrFail_(): Filepath {
        if (!this.rmdirSubtrees_()) throw this.path_();
        return this;
    }

    /// Remove this directory and everything under this directory.
    rmdirTree_(): boolean {
        if (!this.rmdirSubtrees_()) return false;
        if (!this.rmdir_()) return false;
        return true;
    }

    rmdirTreeOrFail_(): Filepath {
        if (!this.rmdirTree_()) throw this.path_();
        return this;
    }

    rename_(to: string | Filepath) {
        const tofile = (to instanceof Filepath) ? to : new Filepath(to);
        fs.renameSync(this.path_(), tofile.path_())
    }

    copyFileAs_(tofile: string | Filepath, dirmode: number = Filepath.DIRMODE) {
        const tofilepath = (tofile instanceof Filepath) ? tofile : new Filepath(tofile);
        tofilepath.mkparentOrFail_(dirmode);
        fs.copyFileSync(this.path_(), tofilepath.path_());
    }

    copyFileToDir_(todir: string | Filepath, dirmode: number = Filepath.DIRMODE) {
        const dstdir = (todir instanceof Filepath) ? todir : new Filepath(todir);
        dstdir.mkdirsOrFail_(dirmode)
        fs.copyFileSync(this.path_(), dstdir.file_(this.nameWithSuffix_()).path_());
    }

    /// @return Number of files, not including directories, copied.
    copyDirToDir_(
        todir: string | Filepath,
        accept: FileWalkerSyncPredicate | null = null,
        dirmode: number = Filepath.DIRMODE
    ): number {
        let ret = 0;
        const dstdir = (todir instanceof Filepath) ? todir : new Filepath(todir);
        this.walk_((src, rpath, stat) => {
            if (accept != null && !accept(src, rpath, stat)) return;
            const dst = dstdir.file_(rpath);
            if (stat.isFile()) {
                dst.mkparentOrFail_(dirmode);
                fs.copyFileSync(src.path_(), dst.path_());
                ++ret;
            } else if (stat.isDirectory()) {
                dst.mkdirsOrFail_(dirmode);
            }
        });
        return ret;
    }

    readText_(encoding: string = "UTF-8"): string {
        return fs.readFileSync(this.path_()).toString(encoding);
    }

    differ_(other: Filepath): boolean {
        return fs.readFileSync(this.path_()).compare(fs.readFileSync(other.path_())) != 0;
    }

    writeText_(data: string, options?: fs.WriteFileOptions) {
        fs.writeFileSync(this.path_(), data, options);
    }

    writeData_(data: any, options?: fs.WriteFileOptions) {
        fs.writeFileSync(this.path_(), data, options);
    }

    createWriteStream_(options?: string | {
        flags?: string;
        encoding?: string;
        fd?: number;
        mode?: number;
        autoClose?: boolean;
        emitClose?: boolean;
        start?: number;
        highWaterMark?: number;
    }): fs.WriteStream {
        return fs.createWriteStream(this.path_(), options);
    }

    createReadStream_(options?: string | {
        flags?: string;
        encoding?: string;
        fd?: number;
        mode?: number;
        autoClose?: boolean;
        emitClose?: boolean;
        start?: number;
        end?: number;
        highWaterMark?: number;
    }): fs.ReadStream {
        return fs.createReadStream(this.path_(), options);
    }

    chmod_(mode: string | number): boolean {
        try {
            fs.chmodSync(this.path_(), mode);;
            return true;
        } catch (_e) {
            return false;
        }
    }

    chmodOrFail_(mode: string | number): Filepath {
        fs.chmodSync(this.path_(), mode);
        return this;
    }

    /// @param time in sec.
    utimes_(time: number | string | Date): boolean {
        try {
            fs.utimesSync(this.path_(), time, time);
            return true;
        } catch (e) {
            return false;
        }
    }

    utimesOrFail_(time: number | string | Date): Filepath {
        fs.utimesSync(this.path_(), time, time);
        return this;
    }

    /// @return true if directory already exists or created.
    mkdirs_(mode: number = Filepath.DIRMODE): boolean {
        if (this.exists_()) return true;
        try {
            fs.mkdirSync(this.path_(), { recursive: true, mode: mode });
            return true;
        } catch (_e) {
            return false;
        }
    }

    /// @return true if parent directory already exists or created.
    mkparent_(mode: number = Filepath.DIRMODE): boolean {
        return new Filepath(this.dir_()).mkdirs_(mode);
    }

    /// @return Ths file if directory already exists or created, otherwise throw an exception.
    mkdirsOrFail_(mode: number = Filepath.DIRMODE): Filepath | never {
        if (this.exists_()) return this;
        fs.mkdirSync(this.path_(), { recursive: true, mode: mode });
        return this.existsOrFail_();
    }

    /// @return This file if parent directory already exists or created, otherwse throw an exception.
    mkparentOrFail_(mode: number = Filepath.DIRMODE): Filepath | never {
        new Filepath(this.dir_()).mkdirsOrFail_(mode);
        return this;
    }

    listOrEmpty_(): string[] {
        try {
            return fs.readdirSync(this.path_());
        } catch (e) {
            return [];
        }
    }

    walk_(callback: FileWalkerSyncCallback) {
        this.walk1_("", this.statOrFail_(), callback);
    }

    scan_(callback: FileWalkerSyncPredicate) {
        this.scan1_("", this.statOrFail_(), callback);
    }

    ///////////////////////////////////////////////////////////////
    // Async methods

    async aStat_(): Promise<fs.Stats | null> {
        return new Promise((resolve, _reject) => {
            fs.stat(this.path_(), (err, stat) => {
                if (err) resolve(null);
                else resolve(stat);
            });
        });
    }

    async aLstat_(): Promise<fs.Stats | null> {
        return new Promise((resolve, _reject) => {
            fs.lstat(this.path_(), (err, stat) => {
                if (err) resolve(null);
                else resolve(stat);
            });
        });
    }

    /// Remove everything under this directory.
    aRmdirSubtrees_(): Promise<boolean> {
        let ret = true
        return this.aWalk_((file, _rpath, stat, done) => {
            let ok = (ok: boolean) => {
                if (!ok) ret = false;
                done();
            }
            if (stat.isFile()) {
                ok(file.rm_());
            } else {
                ok(file.rmdir_());
            }
        }).then(() => {
            return ret;
        });
    }

    /// Remove this directory and everything under this directory.
    aRmdirTree_(): Promise<boolean> {
        return this.aRmdirSubtrees_().then((ok) => {
            if (!ok) return false;
            return this.rmdir_()
        });
    }

    aCopyFileAs_(
        tofile: string | Filepath,
        dirmode: number = Filepath.DIRMODE
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const tofilepath = (tofile instanceof Filepath) ? tofile : new Filepath(tofile);
            tofilepath.mkparentOrFail_(dirmode);
            fs.copyFile(this.path_(), tofilepath.path_(), (err) => {
                if (err == null) resolve(); else reject(err);
            });
        });
    }

    aCopyFileToDir_(
        todir: string | Filepath,
        dirmode: number = Filepath.DIRMODE
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const dstdir = (todir instanceof Filepath) ? todir : new Filepath(todir);
            fs.copyFile(this.path_(), dstdir.mkdirsOrFail_(dirmode).file_(this.nameWithSuffix_()).path_(), (err) => {
                if (err == null) resolve(); else reject(err);
            });
        });
    }

    /// @return Number of files, not including directories, copied.
    aCopyDirToDir_(
        todir: string | Filepath,
        accept: FileWalkerAsyncPredicate | null = null,
        dirmode: number = Filepath.DIRMODE
    ): Promise<number> {
        const dstdir = (todir instanceof Filepath) ? todir : new Filepath(todir);
        let ret = 0;
        return this.aWalk_((src, rpath, stat, done) => {
            let copy1 = (yes: boolean) => {
                if (!yes) {
                    done();
                    return;
                }
                let dst = dstdir.file_(rpath)
                this.acopy1_(dst, src, stat, dirmode, (count) => {
                    ret += count;
                    done();
                });
            }
            if (accept == null) {
                copy1(true);
            } else {
                accept(src, rpath, stat, copy1);
            }
        }).then(() => {
            return ret;
        });
    }

    /// Update file/directory under this directory from another directory if file differ.
    /// @return [copied, missing] Number of files, not including directories, copied 
    /// and number of files missing at the other directory.
    aUpdateDirFromDir_(
        srcdir: string | Filepath,
        accept: FileWalkerAsyncPredicate | null = null,
        dirmode: number = Filepath.DIRMODE
    ): Promise<[number, number]> {
        const fromdir = (srcdir instanceof Filepath) ? srcdir : new Filepath(srcdir);
        let copied = 0;
        let missing = 0;
        return this.aWalk_((file, rpath, stat, done) => {
            let copy1 = async (yes: boolean) => {
                if (!yes) {
                    done();
                    return;
                }
                let src = fromdir.file_(rpath)
                if (src.exists_()) {
                    ++missing;
                    done();
                    return;
                }
                this.acopy1_(file, src, stat, dirmode, (count) => {
                    copied += count;
                    done();
                });
            }
            if (accept == null) {
                copy1(true);
            } else {
                accept(file, rpath, stat, copy1);
            }
        }).then(() => {
            return [copied, missing];
        });
    }

    aContentEquals_(another: Filepath): Promise<boolean> {
        return this.aReadFileOrFail_().then((a) => {
            return another.aReadFileOrFail_().then((b) => {
                return a.equals(b);
            });
        });
    }

    aReadFileOrFail_(): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            fs.readFile(this.path_(), (err, content) => {
                if (err == null) resolve(content); else reject(err);
            });
        });
    }

    aWriteFileOrFail_(data: any, options: fs.WriteFileOptions): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(this.path_(), data, options, (err) => {
                if (err == null) resolve(); else reject(err);
            });
        });
    }

    aReadTextOrNull_(): Promise<string | null> {
        return new Promise<string | null>((resolve, _reject) => {
            fs.readFile(this.path_(), (err, content) => {
                if (err == null) resolve(content.toString()); else resolve(null);
            });
        });
    }

    aReadTextOrFail_(): Promise<string> | never {
        return new Promise<string>((resolve, reject) => {
            fs.readFile(this.path_(), (err, content) => {
                if (err == null) resolve(content.toString()); else reject(err);
            });
        });
    }

    async aReadLinesOrFail_(code: Fun11<string, string | null>): Promise<string[]> {
        return this.aReadTextOrFail_().then((content) => {
            return Promise.resolve(With.lines_(content, code));
        });
    }

    async aRewriteTextOrFail_(code: Fun11<string, string | null>, options?: fs.WriteFileOptions): Promise<void> {
        return this.aReadTextOrFail_().then((content) => {
            let output = code(content)
            if (output != content) {
                this.aWriteText_(output!, options);
            }
        });
    }

    async aRewriteLinesOrFail_(code: Fun11<string, string | null>, options?: fs.WriteFileOptions): Promise<void> {
        return this.aReadTextOrFail_().then((content) => {
            let output = With.lines_(content, code).join(TextUt.lineSep$);
            if (output != content) {
                this.aWriteText_(output, options);
            }
        });
    }

    aWriteText_(data: string, options: fs.WriteFileOptions = {
        encoding: Encoding.utf8$,
        mode: 0o744,
        flag: "w",
    }): Promise<void> | never {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(this.path_(), data, options, (err) => {
                if (err == null) resolve(); else reject(err);
            });
        });
    }

    aListOrEmpty_(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(this.path_(), (err, files) => {
                if (err != null) reject(err); else resolve(files);
            });
        });
    }

    /// Post order walk of the directory tree under this directory recursively.
    aWalk_(callback: FileWalkerAsyncCallback): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let stat = await this.aLstat_()
            if (stat == null || !stat.isDirectory) {
                reject(this.path_())
            }
            this.awalk1_((await this.aListOrEmpty_()).sort(), 0, "", callback, resolve, reject);
        });
    }

    /// Pre order scan of the directory tree under this directory.
    /// Recurse into a directory only if callback returns true.
    aScan_(callback: FileWalkerAsyncPredicate): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let stat = await this.aLstat_()
            if (stat == null || !stat.isDirectory) {
                reject(this.path_())
            }
            this.ascan1_((await this.aListOrEmpty_()).sort(), 0, "", callback, resolve, reject);
        });
    }

    ///////////////////////////////////////////////////////////////
    // Helper methods

    private async awalk1_(
        entries: string[],
        index: number,
        dirpath: string,
        callback: FileWalkerAsyncCallback,
        resolve: Fun00,
        reject: Fun10<string>
    ) {
        if (index >= entries.length) {
            resolve();
            return;
        }
        const dir = this;
        const name = entries[index];
        const file = new Filepath(this.path_(), name);
        const filepath = dirpath.length == 0 ? name : dirpath + Path.sep + name;
        const filestat = await file.aLstat_();
        if (filestat == null) {
            reject(file.path_());
            return;
        }
        if (filestat.isDirectory()) {
            setTimeout(async () => {
                file.awalk1_((await file.aListOrEmpty_()).sort(), 0, filepath, callback, () => {
                    callback(file, filepath, filestat, () => {
                        dir.awalk1_(entries, index + 1, dirpath, callback, resolve, reject);
                    });
                }, reject);
            }, 0);
        } else {
            callback(file, filepath, filestat, () => {
                dir.awalk1_(entries, index + 1, dirpath, callback, resolve, reject);
            });
        }
    }

    private async ascan1_(
        entries: string[],
        index: number,
        dirpath: string,
        callback: FileWalkerAsyncPredicate,
        resolve: Fun00,
        reject: Fun10<string>
    ) {
        if (index >= entries.length) {
            resolve();
            return;
        }
        const dir = this;
        const name = entries[index];
        const file = new Filepath(this.path_(), name);
        const filepath = dirpath.length == 0 ? name : dirpath + Path.sep + name;
        const filestat = await file.aLstat_();
        if (filestat == null) {
            reject(file.path_());
            return;
        }
        callback(file, filepath, filestat, (recurse) => {
            if (recurse && filestat.isDirectory()) {
                setTimeout(async () => {
                    file.ascan1_((await file.aListOrEmpty_()).sort(), 0, filepath, callback, () => {
                        dir.ascan1_(entries, index + 1, dirpath, callback, resolve, reject);
                    }, reject)
                }, 0);
            } else {
                dir.ascan1_(entries, index + 1, dirpath, callback, resolve, reject);
            }
        });
    }

    private async acopy1_(dst: Filepath, src: Filepath, srcstat: fs.Stats, dirmode: number, done: Fun10<number>) {
        if (srcstat.isDirectory()) {
            dst.mkdirsOrFail_(dirmode);
            done(0);
            return;
        }
        if (srcstat.isFile()) {
            if (dst.isFile_() && await dst.aContentEquals_(src)) {
                done(0);
                return;
            }
            dst.mkparentOrFail_(dirmode)
            src.aCopyFileAs_(dst, dirmode).then(() => {
                done(1);
            });
            return;
        }
        done(0);
    }

    private walk1_(dir: string, stat: fs.Stats, callback: FileWalkerSyncCallback) {
        if (!stat.isDirectory()) return;
        for (const name of this.listOrEmpty_().sort()) {
            const file = new Filepath(this.path_(), name);
            const filepath = dir.length == 0 ? name : dir + Path.sep + name;
            const stat = file.statOrFail_();
            callback(file, filepath, stat);
            file.walk1_(filepath, stat, callback);
        }
    }

    private scan1_(dir: string, stat: fs.Stats, callback: (filepath: Filepath, rpath: string, stat: fs.Stats) => boolean) {
        if (!stat.isDirectory()) return;
        for (const name of fs.readdirSync(this.path_()).sort()) {
            const file = new Filepath(this.path_(), name);
            const filepath = dir.length == 0 ? name : dir + Path.sep + name;
            const stat = file.statOrFail_();
            if (callback(file, filepath, stat)) file.scan1_(filepath, stat, callback);
        }
    }
}

export class Encoding {
    static ascii$ = "ascii";
    static utf8$ = "utf8";
    static utf16le$ = "utf16le";
    static ucs2$ = "ucs2";
    static binary$ = "binary";
    static latin1$ = "latin1";
    static win1252$ = "win-1252";
    static iso88591$ = "ISO-8859-1";
    static base64$ = "base64";
    static hex$ = "hex";
}
