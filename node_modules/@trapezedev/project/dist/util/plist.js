"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePlistString = exports.parsePlist = void 0;
const plist_1 = __importDefault(require("plist"));
const utils_fs_1 = require("@ionic/utils-fs");
const lodash_1 = require("lodash");
async function parsePlist(filename) {
    const contents = await (0, utils_fs_1.readFile)(filename, { encoding: 'utf-8' });
    const parsed = plist_1.default.parse(contents);
    // If the plist is empty an empty array will come back
    // which is not what we want
    if ((0, lodash_1.isEmpty)(parsed)) {
        return {};
    }
    return parsed;
}
exports.parsePlist = parsePlist;
function parsePlistString(contents) {
    const parsed = plist_1.default.parse(contents);
    // If the plist is empty an empty array will come back
    // which is not what we want
    if ((0, lodash_1.isEmpty)(parsed)) {
        return {};
    }
    return parsed;
}
exports.parsePlistString = parsePlistString;
//# sourceMappingURL=plist.js.map