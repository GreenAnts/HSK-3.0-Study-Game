export declare function parsePbxProject(filename: string): Promise<any>;
/**
 * PBX files are esoteric. Based on http://danwright.info/blog/2010/10/xcode-pbxproject-files/
 * we try to quote strings that need to be quoted. Right now
 * that test is just for a few characters but there may be
 * more that we need here
 */
export declare function pbxSerializeString(value: string): string;
export declare function pbxReadString(value: string): string;
//# sourceMappingURL=pbx.d.ts.map