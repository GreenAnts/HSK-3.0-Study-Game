/// <reference types="node" />
/// <reference types="node" />
import { MobileProject } from '../project';
import { AndroidResDir } from '../definitions';
import { GradleFile } from './gradle-file';
import { XmlFile } from '../xml';
import { PropertiesFile } from '../properties';
import { PlatformProject } from '../platform-project';
export declare class AndroidProject extends PlatformProject {
    private manifest;
    private buildGradle;
    private appBuildGradle;
    constructor(project: MobileProject);
    load(): Promise<void>;
    getBuildGradle(): GradleFile | null;
    getAppBuildGradle(): GradleFile | null;
    getAndroidManifest(): XmlFile;
    /**
     * Get a project file container for the given path in the project root.
     * This will return an existing file container or create a new one.
     */
    getProjectFile<T>(path: string, create: (filename: string) => T): T | null;
    getResourceXmlFile(resourcePath: string): XmlFile | null;
    getXmlFile(path: string): XmlFile | null;
    getPropertiesFile(path: string): PropertiesFile | null;
    getGradleFile(path: string): Promise<GradleFile | null>;
    setAppName(appName: string): Promise<void>;
    /**
     * Update the Android package name. This renames the package in `AndroidManifest.xml`,
     * the `applicationId` in `app/build.gradle`, and renames the java
     * package for the `MainActivity.java` file.
     *
     * This action will mutate the project on disk!
     */
    setPackageName(packageName: string): Promise<void>;
    getMainActivityFilename(): string;
    getMainActivityPath(): Promise<string>;
    getGradlePluginVersion(): Promise<string | null>;
    getPackageName(): Promise<string | null | undefined>;
    setVersionCode(versionCode: number): Promise<void> | undefined;
    getVersionCode(): Promise<number | null>;
    incrementVersionCode(): Promise<void>;
    setVersionName(versionName: string): Promise<void> | undefined;
    getVersionName(): Promise<string | null>;
    setVersionNameSuffix(versionNameSuffix: string): Promise<void> | undefined;
    getVersionNameSuffix(): Promise<string | null>;
    /**
     * Add a new file to the given resources directory with the given contents and
     * given file name
     **/
    getResource(resDir: AndroidResDir, file: string, options?: {
        encoding: 'utf-8' | string;
    } | null): Promise<string> | Promise<Buffer> | undefined;
    /**
     * Add a new file to the given resources directory with the given contents and
     * given file name
     **/
    addResource(resDir: AndroidResDir, file: string, contents: string): Promise<void>;
    copyFile(src: string, dest: string): Promise<void>;
    /**
     * Copy the given source into the given resources directory with the
     * given file name
     **/
    copyToResources(resDir: AndroidResDir, file: string, source: string): Promise<void>;
    private getAndroidManifestPath;
    getResourcesPath(): string;
    getResourcesRoot(): string | null;
    private getAppRoot;
    private loadGradle;
}
//# sourceMappingURL=project.d.ts.map