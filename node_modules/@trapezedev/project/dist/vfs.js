"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VFS = exports.VFSRef = exports.VFSStorable = void 0;
const Diff = __importStar(require("diff"));
// All classes that are stored in the VFS must implement this interface
class VFSStorable {
}
exports.VFSStorable = VFSStorable;
/**
 * Reference to a file and its data (which can be of any type) in the VFS
 */
class VFSRef {
    constructor(filename, data, commitFn, diffFn) {
        this.filename = filename;
        this.data = data;
        this.commitFn = commitFn;
        this.diffFn = diffFn;
        this.buffer = null;
        this.modified = false;
    }
    getFilename() {
        return this.filename;
    }
    getData() {
        return this.data;
    }
    isModified() {
        return this.modified;
    }
    setData(data) {
        this.data = data;
        this.modified = true;
    }
    commit() {
        return this.commitFn(this);
    }
    async diff() {
        var _a, _b;
        const diff = (_b = (await ((_a = this.diffFn) === null || _a === void 0 ? void 0 : _a.call(this, this)))) !== null && _b !== void 0 ? _b : Promise.resolve({ file: this });
        return {
            ...diff,
            file: this,
        };
    }
}
exports.VFSRef = VFSRef;
/**
 * Simple virtual filesystem to share files across operations and
 * keep track of modifications over time
 */
class VFS {
    constructor() {
        this.openFiles = {};
    }
    open(filename, data, commitFn, diffFn) {
        const ref = new VFSRef(filename, data, commitFn, diffFn);
        this.openFiles[filename] = ref;
        return ref;
    }
    get(filename) {
        var _a;
        return (_a = this.openFiles[filename]) !== null && _a !== void 0 ? _a : null;
    }
    isOpen(filename) {
        return !!this.get(filename);
    }
    all() {
        return Object.keys(this.openFiles).reduce((files, fname) => {
            files[fname] = this.openFiles[fname];
            return files;
        }, {});
    }
    async commitAll(project) {
        await Promise.all(Object.values(this.openFiles).map(file => file.commit()));
    }
    async diffAll() {
        const diffs = await Promise.all(Object.values(this.openFiles).map(file => {
            if (file.diff) {
                return file.diff();
            }
            return null;
        }));
        return diffs.filter(d => !!d && !!d.new).map(diff => {
            var _a, _b, _c, _d;
            return ({
                ...diff,
                patch: Diff.createPatch((_b = (_a = diff === null || diff === void 0 ? void 0 : diff.file) === null || _a === void 0 ? void 0 : _a.getFilename()) !== null && _b !== void 0 ? _b : '', (_c = diff === null || diff === void 0 ? void 0 : diff.old) !== null && _c !== void 0 ? _c : '', (_d = diff === null || diff === void 0 ? void 0 : diff.new) !== null && _d !== void 0 ? _d : '') // Diff.diffChars(diff!.old ?? '', diff!.new ?? '')
            });
        });
    }
    set(filename, data) {
        var _a;
        (_a = this.get(filename)) === null || _a === void 0 ? void 0 : _a.setData(data);
    }
    close(ref) {
        delete this.openFiles[ref.getFilename()];
    }
}
exports.VFS = VFS;
//# sourceMappingURL=vfs.js.map