"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertParentDirs = void 0;
const utils_fs_1 = require("@ionic/utils-fs");
const path_1 = require("path");
async function assertParentDirs(path) {
    const dirs = (0, path_1.dirname)(path);
    await (0, utils_fs_1.mkdirp)(dirs);
}
exports.assertParentDirs = assertParentDirs;
//# sourceMappingURL=fs.js.map