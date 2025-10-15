import { VFS, VFSStorable } from '../vfs';
import { AndroidGradleInjectType } from '../definitions';
export type GradleAST = any;
export interface GradleASTNode {
    type: string;
    name: string;
    children?: GradleASTNode[];
    source: {
        line: number;
        column: number;
        lastLine: number;
        lastColumn: number;
    };
}
export declare class GradleFile extends VFSStorable {
    filename: string;
    private vfs;
    private source;
    private parsed;
    private tempFile;
    constructor(filename: string, vfs: VFS);
    getDocument(): string | null;
    /**
     * Replace the given properties at the specified point in the Gradle file or insert
     * if the replacement doesn't exist
     *
     * exact specifies whether the pathObject should be exact from the root of the document or
     * if it can match on a sub-object
     **/
    replaceProperties(pathObject: any, toReplace: any, exact?: boolean): Promise<void>;
    _makeReplacePathObject(pathObject: any, injectKey: string): any;
    /**
     * Replace an entry in the gradle file.
     */
    private replaceInGradleFile;
    /**
     * Insert the given properties at the specified point in the Gradle file.
     * exact specifies whether the pathObject should be exact from the root of the document or
     * if it can match on a sub-object
     **/
    insertProperties(pathObject: any, toInject: any[], type?: AndroidGradleInjectType, exact?: boolean): Promise<void>;
    /**
     * Inject the given properties at the specified point in the Gradle file.
     * exact specifies whether the pathObject should be exact from the root of the document or
     * if it can match on a sub-object
     **/
    insertFragment(pathObject: any, toInject: string, exact?: boolean): Promise<void>;
    /**
     * Parse the underlying Gradle file and build the AST. Note: this calls out to
     * a Java process which incurs some overhead and requires java to be installed
     * This is because Gradle is actually a DSL for the Groovy language, which is
     * a JVM language. Additionally, the Groovy parser is based on a modified version
     * of the Antlr project that is tightly bound to the JVM. Ultimatley, this means
     * the only safe, accurate way to feasibly build a Gradle AST is to use the Groovy
     * parser API which this uses under the hood.
     */
    parse(): Promise<any>;
    /**
     * Inject a modification into the gradle file.
     */
    private insertIntoGradleFile;
    find(pathObject: any | null, exact?: boolean): {
        node: GradleASTNode;
        depth: number;
    }[];
    private _find;
    getSource(node: GradleASTNode): string;
    private getDepth;
    private matchesExact;
    private isTargetNode;
    getJava(): Promise<string | null>;
    getGradleParserPath(): string;
    setApplicationId(applicationId: string): Promise<void>;
    getApplicationId(): Promise<string | null>;
    setVersionCode(versionCode: number): Promise<void>;
    getVersionCode(): Promise<number | null>;
    incrementVersionCode(): Promise<void>;
    setVersionName(versionName: string): Promise<void>;
    getVersionName(): Promise<string | null>;
    setVersionNameSuffix(versionNameSuffix: string): Promise<void>;
    getVersionNameSuffix(): Promise<string | null>;
    getNamespace(): Promise<string | null>;
    setNamespace(namespace: string): Promise<void>;
    private createGradleSource;
    private getGradleSource;
    private gradleParseError;
    private gradleCommitFn;
    private gradleDiffFn;
}
//# sourceMappingURL=gradle-file.d.ts.map