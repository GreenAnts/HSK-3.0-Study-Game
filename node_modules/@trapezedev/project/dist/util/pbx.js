"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pbxReadString = exports.pbxSerializeString = exports.parsePbxProject = void 0;
const xcode_1 = __importDefault(require("xcode"));
const utils_fs_1 = require("@ionic/utils-fs");
async function parsePbxProject(filename) {
    if (!(await (0, utils_fs_1.pathExists)(filename))) {
        throw new Error(`pbxproj file does not exist at ${filename}`);
    }
    const proj = xcode_1.default.project(filename);
    return proj.parseSync();
}
exports.parsePbxProject = parsePbxProject;
/**
 * PBX files are esoteric. Based on http://danwright.info/blog/2010/10/xcode-pbxproject-files/
 * we try to quote strings that need to be quoted. Right now
 * that test is just for a few characters but there may be
 * more that we need here
 */
function pbxSerializeString(value) {
    if (/[\s;]/.test(value)) {
        return `"${value}"`;
    }
    return value;
}
exports.pbxSerializeString = pbxSerializeString;
// Remove any quotes at the beginning and end of the string value
function pbxReadString(value) {
    if (typeof value === 'string') {
        return value === null || value === void 0 ? void 0 : value.replace(/(^")+|("$)+/g, '');
    }
    else {
        return value;
    }
}
exports.pbxReadString = pbxReadString;
//# sourceMappingURL=pbx.js.map