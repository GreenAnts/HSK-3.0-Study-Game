import { VFS, VFSStorable } from './vfs';
export declare class XmlFile extends VFSStorable {
    private path;
    private vfs;
    private doc;
    private select;
    constructor(path: string, vfs: VFS);
    load(): Promise<void>;
    getDocumentElement(): HTMLElement | undefined;
    find(target: string): Element[] | null;
    deleteNodes(target: string): void;
    deleteAttributes(target: string, attributes: string[]): void;
    /**
     * Injects a fragment of XML as a child of the given target.
     * Note: If the target resolves to a node list, each node will
     * have the fragment appended.
     */
    injectFragment(target: string, fragment: string): void;
    /**
     * Merges a fragment of XML into the given target.
     */
    mergeFragment(target: string, fragment: string): void;
    mergeJsonTree(target: any, fragment: any): any;
    _mergeJson(target: any, fragment: any): void;
    /**
     * Replaces a given target with the given fragment
     */
    replaceFragment(target: string, fragment: string): void;
    /**
     * Set the key/value attributes on the target.
     * Note: if the target resolves to a node list, each node will
     * have its attributes modified
     */
    setAttrs(target: string, attrs: any): void;
    private xmlCommitFn;
    private xmlDiffFn;
}
//# sourceMappingURL=xml.d.ts.map