/// <reference lib="dom" />
export declare function parseXml(filename: string): Promise<Document>;
export declare function parseXmlString(contents: string): Document;
export declare function serializeXml(doc: any): string;
export declare function formatXml(doc: any): Promise<string>;
export declare function writeXml(doc: any, filename: string): Promise<void>;
//# sourceMappingURL=xml.d.ts.map