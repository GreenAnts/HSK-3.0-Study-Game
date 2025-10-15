"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlFile = void 0;
const xml_1 = require("./util/xml");
const xpath_1 = __importDefault(require("xpath"));
const xml_js_1 = require("xml-js");
const vfs_1 = require("./vfs");
const fs_extra_1 = require("fs-extra");
const logger_1 = require("./logger");
const fs_1 = require("./util/fs");
class XmlFile extends vfs_1.VFSStorable {
    constructor(path, vfs) {
        super();
        this.path = path;
        this.vfs = vfs;
        this.doc = null;
        this.select = xpath_1.default.select;
        this.xmlCommitFn = async (file) => {
            const data = file.getData();
            if (data.doc) {
                await (0, fs_1.assertParentDirs)(file.getFilename());
                return (0, xml_1.writeXml)(data.doc, file.getFilename());
            }
        };
        this.xmlDiffFn = async (file) => {
            const data = file.getData();
            const xmlString = await (0, xml_1.formatXml)(data.doc);
            const currentString = await (0, fs_extra_1.readFile)(file.getFilename(), {
                encoding: 'utf-8',
            });
            return {
                old: currentString,
                new: xmlString,
            };
        };
    }
    async load() {
        var _a;
        // Don't load the file if it's already open
        if (this.vfs.isOpen(this.path)) {
            return;
        }
        try {
            this.doc = await (0, xml_1.parseXml)(this.path);
        }
        catch (e) {
            console.error('Unable to load XML file', e);
        }
        logger_1.Logger.v('xml', 'load', `at ${this.path}`);
        this.vfs.open(this.path, this, this.xmlCommitFn, this.xmlDiffFn);
        const rootNode = this.getDocumentElement();
        if (rootNode) {
            const namespaces = {};
            for (const attr in rootNode.attributes) {
                const attribute = rootNode.attributes[attr];
                if (!attribute.name) {
                    continue;
                }
                if (attribute.name.indexOf('xmlns') >= 0) {
                    const nsName = attribute.name.split(':').slice(1).join();
                    namespaces[nsName] = (_a = attribute.value) !== null && _a !== void 0 ? _a : '';
                }
            }
            logger_1.Logger.v('xml', 'load', `Found root namespaces in XML file:`, Object.values(namespaces).join(' '));
            this.select = xpath_1.default.useNamespaces(namespaces);
        }
    }
    getDocumentElement() {
        var _a;
        return (_a = this.doc) === null || _a === void 0 ? void 0 : _a.documentElement;
    }
    find(target) {
        var _a;
        if (!this.doc) {
            return null;
        }
        return (_a = this.select) === null || _a === void 0 ? void 0 : _a.call(this, target, this.doc);
    }
    deleteNodes(target) {
        var _a;
        if (!this.doc) {
            return;
        }
        logger_1.Logger.v('xml', 'deleteNodes', `at ${target}`);
        const nodes = (_a = this.select) === null || _a === void 0 ? void 0 : _a.call(this, target, this.doc);
        nodes.forEach(n => { var _a; return (_a = n.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(n); });
        this.vfs.set(this.path, this);
    }
    deleteAttributes(target, attributes) {
        var _a;
        if (!this.doc) {
            return;
        }
        const nodes = (_a = this.select) === null || _a === void 0 ? void 0 : _a.call(this, target, this.doc);
        nodes.forEach(n => attributes.forEach(a => n.removeAttribute(a)));
        logger_1.Logger.v('xml', 'deleteAttributes', `at ${target}`);
        this.vfs.set(this.path, this);
    }
    /**
     * Injects a fragment of XML as a child of the given target.
     * Note: If the target resolves to a node list, each node will
     * have the fragment appended.
     */
    injectFragment(target, fragment) {
        var _a, _b;
        if (!this.doc) {
            return;
        }
        const nodes = (_a = this.select) === null || _a === void 0 ? void 0 : _a.call(this, target, this.doc);
        const parsed = (0, xml_1.parseXmlString)(fragment);
        const docNodes = (_b = parsed.childNodes) !== null && _b !== void 0 ? _b : [];
        logger_1.Logger.v('xml', 'injectFragment', `at ${target}`);
        nodes.forEach(n => Array.prototype.forEach.call(docNodes, d => n.appendChild(d)));
        this.vfs.set(this.path, this);
    }
    /**
     * Merges a fragment of XML into the given target.
     */
    mergeFragment(target, fragment) {
        var _a;
        if (!this.doc) {
            return;
        }
        // Get the target element
        const node = (_a = this.select) === null || _a === void 0 ? void 0 : _a.call(this, target, this.doc);
        logger_1.Logger.v('xml', 'mergeFragment', `at ${target}`);
        if (!node.length) {
            return;
        }
        const targetSerialized = (0, xml_1.serializeXml)(node[0]);
        const targetParsed = (0, xml_js_1.xml2js)(targetSerialized.trim());
        const fragmentParsed = (0, xml_js_1.xml2js)(fragment.trim());
        const newTree = this.mergeJsonTree(targetParsed, fragmentParsed);
        const xml = (0, xml_js_1.js2xml)(newTree);
        const newTreeElement = (0, xml_1.parseXmlString)(xml);
        for (const n of Array.prototype.slice.call(node[0].childNodes)) {
            node[0].removeChild(n);
        }
        for (const n of Array.prototype.slice.call(newTreeElement.documentElement.childNodes)) {
            node[0].appendChild(n);
        }
    }
    mergeJsonTree(target, fragment) {
        this._mergeJson(target, fragment);
        return target;
    }
    // Recursively merge nodes with some heuristics based on
    // likely merge expectations
    _mergeJson(target, fragment) {
        var _a;
        for (const e of fragment.elements) {
            let child = null;
            for (const t of target.elements) {
                const attrs = (_a = e.attributes) !== null && _a !== void 0 ? _a : [];
                const attrsMatch = Object.keys(attrs).every((a) => { var _a; return ((_a = t.attributes) !== null && _a !== void 0 ? _a : {})[a] === attrs[a]; });
                // Match the same tag names and, if the node to be merged has attributes, make sure
                // every attribute matches with the source tag to count this as a match (heuristic)
                if (e.name && t.name && e.name === t.name &&
                    (Object.keys(attrs).length > 0 ? attrsMatch : true)) {
                    child = t;
                    break;
                }
            }
            if (!child) {
                // If these are both terminal text nodes, replace the text
                // content instead of appending
                if (target.elements &&
                    target.elements.every((a) => a.type === 'text') &&
                    e.type === 'text') {
                    target.elements = [e];
                }
                else {
                    target.elements.push(e);
                }
            }
            else if (e.elements) {
                this._mergeJson(child, e);
            }
        }
    }
    /**
     * Replaces a given target with the given fragment
     */
    replaceFragment(target, fragment) {
        var _a;
        if (!this.doc) {
            return;
        }
        const nodes = (_a = this.select) === null || _a === void 0 ? void 0 : _a.call(this, target, this.doc);
        const parsed = (0, xml_1.parseXmlString)(fragment);
        nodes.forEach(n => {
            var _a, _b;
            const index = Array.prototype.indexOf.call((_a = n.parentNode) === null || _a === void 0 ? void 0 : _a.childNodes, n);
            if (index >= 0) {
                const parent = n.parentNode;
                parent.removeChild(n);
                parent.insertBefore(parsed.documentElement, (_b = parent === null || parent === void 0 ? void 0 : parent.childNodes[index]) !== null && _b !== void 0 ? _b : null);
            }
        });
        this.vfs.set(this.path, this);
    }
    /**
     * Set the key/value attributes on the target.
     * Note: if the target resolves to a node list, each node will
     * have its attributes modified
     */
    setAttrs(target, attrs) {
        var _a, _b;
        if (!this.doc) {
            return;
        }
        logger_1.Logger.v('xml', 'setAttrs', `at ${this.path} - ${target}`);
        const nodes = (_b = (_a = this.select) === null || _a === void 0 ? void 0 : _a.call(this, target, this.doc)) !== null && _b !== void 0 ? _b : [];
        nodes.forEach((n) => {
            Object.keys(attrs).forEach(attr => {
                n.setAttribute(attr, attrs[attr]);
            });
        });
        this.vfs.set(this.path, this);
    }
}
exports.XmlFile = XmlFile;
//# sourceMappingURL=xml.js.map