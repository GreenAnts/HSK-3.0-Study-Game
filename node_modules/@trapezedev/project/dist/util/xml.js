"use strict";
/// <reference lib="dom" />
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeXml = exports.formatXml = exports.serializeXml = exports.parseXmlString = exports.parseXml = void 0;
const path_1 = require("path");
const utils_fs_1 = require("@ionic/utils-fs");
const xmldom_1 = __importStar(require("@xmldom/xmldom"));
const standalone_1 = __importDefault(require("prettier/standalone"));
const plugin_xml_1 = __importDefault(require("@prettier/plugin-xml"));
async function parseXml(filename) {
    let contents = await (0, utils_fs_1.readFile)(filename, { encoding: 'utf-8' });
    if (!contents) {
        contents = '<?xml version="1.0" encoding="utf-8" ?>\n<root />';
    }
    return new xmldom_1.default.DOMParser().parseFromString(contents);
}
exports.parseXml = parseXml;
function parseXmlString(contents) {
    return new xmldom_1.default.DOMParser().parseFromString(contents);
}
exports.parseXmlString = parseXmlString;
function serializeXml(doc) {
    return new xmldom_1.XMLSerializer().serializeToString(doc);
}
exports.serializeXml = serializeXml;
async function formatXml(doc) {
    var xml = new xmldom_1.XMLSerializer().serializeToString(doc);
    const p = (0, path_1.dirname)(require.resolve('@prettier/plugin-xml'));
    const formatted = standalone_1.default.format(xml, {
        parser: 'xml',
        printWidth: 120,
        bracketSameLine: true,
        xmlWhitespaceSensitivity: 'ignore',
        tabWidth: 4,
        pluginSearchDirs: [p],
        plugins: [plugin_xml_1.default]
    });
    return formatted;
}
exports.formatXml = formatXml;
async function writeXml(doc, filename) {
    const formatted = await formatXml(doc);
    return (0, utils_fs_1.writeFile)(filename, formatted);
}
exports.writeXml = writeXml;
//# sourceMappingURL=xml.js.map