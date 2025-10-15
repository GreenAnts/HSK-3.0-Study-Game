"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeProperties = exports.parseProperties = void 0;
const utils_fs_1 = require("@ionic/utils-fs");
const ini_1 = __importDefault(require("ini"));
async function parseProperties(filename) {
    const data = await (0, utils_fs_1.readFile)(filename, { encoding: 'utf-8' });
    return ini_1.default.parse(data);
}
exports.parseProperties = parseProperties;
async function writeProperties(filename, data) {
    const serialized = ini_1.default.stringify(data);
    return (0, utils_fs_1.writeFile)(filename, data);
}
exports.writeProperties = writeProperties;
//# sourceMappingURL=properties.js.map