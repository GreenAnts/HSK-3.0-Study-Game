"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AndroidProject = void 0;
const path_1 = require("path");
const utils_fs_1 = require("@ionic/utils-fs");
const gradle_file_1 = require("./gradle-file");
const xml_1 = require("../xml");
const properties_1 = require("../properties");
const platform_project_1 = require("../platform-project");
const read_src_1 = require("../read-src");
const logger_1 = require("../logger");
class AndroidProject extends platform_project_1.PlatformProject {
    constructor(project) {
        super(project);
        this.buildGradle = null;
        this.appBuildGradle = null;
        const manifestPath = this.getAndroidManifestPath();
        this.manifest = new xml_1.XmlFile(manifestPath, project.vfs);
    }
    async load() {
        try {
            await this.manifest.load();
            this.buildGradle = await this.loadGradle('build.gradle');
            this.appBuildGradle = await this.loadGradle('app/build.gradle');
        }
        catch (e) {
            this.setError(e);
        }
    }
    getBuildGradle() {
        return this.buildGradle;
    }
    getAppBuildGradle() {
        return this.appBuildGradle;
    }
    getAndroidManifest() {
        return this.manifest;
    }
    /**
     * Get a project file container for the given path in the project root.
     * This will return an existing file container or create a new one.
     */
    getProjectFile(path, create) {
        var _a;
        const root = (_a = this.project.config.android) === null || _a === void 0 ? void 0 : _a.path;
        if (!root) {
            return null;
        }
        const filename = (0, path_1.join)(root, path);
        const existing = this.project.vfs.get(filename);
        if (existing) {
            return existing.getData();
        }
        return create(filename);
    }
    getResourceXmlFile(resourcePath) {
        return this.getXmlFile((0, path_1.join)(this.getResourcesPath(), resourcePath));
    }
    getXmlFile(path) {
        return this.getProjectFile(path, (filename) => new xml_1.XmlFile(filename, this.project.vfs));
    }
    getPropertiesFile(path) {
        return this.getProjectFile(path, (filename) => new properties_1.PropertiesFile(filename, this.project.vfs));
    }
    async getGradleFile(path) {
        if (path === 'build.gradle') {
            return this.buildGradle;
        }
        else if (path === 'app/build.gradle') {
            return this.appBuildGradle;
        }
        return this.loadGradle(path);
    }
    async setAppName(appName) {
        const application = this.manifest.find('manifest/application');
        if (!application) {
            logger_1.Logger.v('android', 'setAppName', `No <application> node found in <manifest>`);
            return;
        }
        const label = application[0].getAttribute('android:label');
        logger_1.Logger.v('android', 'setAppName', `current app label is ${label}`);
        if (label) {
            if (label.indexOf('@string') === 0) {
                logger_1.Logger.v('android', 'setAppName', 'android:label pointing to strings.xml resource file. Reading values/strings.xml');
                const stringsFile = await this.getResourceXmlFile('values/strings.xml');
                if (!stringsFile) {
                    logger_1.Logger.v('android', 'setAppName', 'Unable to load values/strings.xml resource file');
                    return;
                }
                await stringsFile.load();
                const attr = label.replace('@string/', '');
                // TODO: use the value specified in the @strings attribute
                logger_1.Logger.v('android', 'setAppName', `Updated values/strings.xml <string name="${attr}"> to <string name="${attr}">${appName}</string>`);
                stringsFile.replaceFragment(`resources/string[@name="${attr}"]`, `<string name="${attr}">${appName}</string>`);
            }
        }
        else {
            logger_1.Logger.v('android', 'setAppName', `No android:label on <application> node, setting value directly`);
            application[0].setAttribute('android:label', appName);
        }
    }
    /**
     * Update the Android package name. This renames the package in `AndroidManifest.xml`,
     * the `applicationId` in `app/build.gradle`, and renames the java
     * package for the `MainActivity.java` file.
     *
     * This action will mutate the project on disk!
     */
    async setPackageName(packageName) {
        var _a, _b, _c, _d, _e, _f;
        const sourceDir = (0, path_1.join)(this.getAppRoot(), 'src', 'main', 'java');
        let hadPackageAttr = false;
        let oldPackageName = await ((_a = this.manifest
            .getDocumentElement()) === null || _a === void 0 ? void 0 : _a.getAttribute('package'));
        if (!oldPackageName) {
            oldPackageName = await ((_b = this.appBuildGradle) === null || _b === void 0 ? void 0 : _b.getApplicationId());
        }
        else {
            hadPackageAttr = true;
        }
        const oldPackageParts = (_c = oldPackageName === null || oldPackageName === void 0 ? void 0 : oldPackageName.split('.')) !== null && _c !== void 0 ? _c : [];
        logger_1.Logger.v('android', 'setPackageName', 'setting Android package name to', packageName, 'from', oldPackageName);
        if (packageName === oldPackageName) {
            return;
        }
        const existingPackage = (0, path_1.join)(sourceDir, ...oldPackageParts);
        if (!(await (0, utils_fs_1.pathExists)(existingPackage))) {
            throw new Error('Current Java package name and directory structure do not match the <manifest> package attribute. Ensure these match before modifying the project package name');
        }
        let activityName = '.MainActivity';
        if (hadPackageAttr) {
            (_d = this.manifest.getDocumentElement()) === null || _d === void 0 ? void 0 : _d.setAttribute('package', packageName);
            activityName = `${packageName}.MainActivity`;
        }
        await ((_e = this.appBuildGradle) === null || _e === void 0 ? void 0 : _e.setApplicationId(packageName));
        await ((_f = this.appBuildGradle) === null || _f === void 0 ? void 0 : _f.setNamespace(packageName));
        logger_1.Logger.v('android', 'setPackageName', `set manifest package attribute and applicationId to ${packageName}`);
        this.manifest.setAttrs('manifest/application/activity', {
            'android:name': activityName
        });
        logger_1.Logger.v('android', 'setPackageName', `set <activity android:name="${packageName}.MainActivity"`);
        if (!this.getAppRoot()) {
            return;
        }
        const newPackageParts = packageName.split('.');
        const destDir = (0, path_1.join)(sourceDir, ...newPackageParts);
        const mainActivityName = this.getMainActivityFilename();
        logger_1.Logger.v('android', 'setPackageName', `Got main activity name ${mainActivityName}`);
        let activityFile = (0, path_1.join)(sourceDir, ...oldPackageParts, mainActivityName);
        logger_1.Logger.v('android', 'setPackageName', `Looking for old activity file at ${activityFile}`);
        // Make the new directory tree and any missing parents
        await (0, utils_fs_1.mkdirp)(destDir);
        // Move the old activity file over
        await (0, utils_fs_1.move)(activityFile, (0, path_1.join)(destDir, 'MainActivity.java'));
        // Try to delete the empty directories we left behind, starting
        // from the deepest
        let sourceDirLeaf = (0, path_1.join)(sourceDir, ...oldPackageParts);
        logger_1.Logger.v('android', 'setPackageName', `removing old source dirs for old package (${sourceDirLeaf})`);
        for (const _ of oldPackageParts) {
            try {
                await (0, utils_fs_1.rmdir)(sourceDirLeaf);
            }
            catch (ex) {
                // This will fail if directory is not empty, that's fine, we won't delete those
            }
            sourceDirLeaf = (0, path_1.join)(sourceDirLeaf, '..');
        }
        // Rename the package in the main source file
        activityFile = (0, path_1.join)(sourceDir, ...newPackageParts, this.getMainActivityFilename());
        if (await (0, utils_fs_1.pathExists)(activityFile)) {
            logger_1.Logger.v('android', 'setPackageName', `renaming package in source for activity file ${activityFile}`);
            const activitySource = await (0, utils_fs_1.readFile)(activityFile, {
                encoding: 'utf-8',
            });
            const newActivitySource = activitySource === null || activitySource === void 0 ? void 0 : activitySource.replace(/(package\s+)[^;]+/, `$1${packageName}`);
            await (0, utils_fs_1.writeFile)(activityFile, newActivitySource);
        }
    }
    getMainActivityFilename() {
        const activity = this.manifest.find('manifest/application/activity');
        if (!activity) {
            return 'MainActivity.java';
        }
        const activityName = activity[0].getAttribute('android:name');
        const parts = activityName === null || activityName === void 0 ? void 0 : activityName.split('.');
        if (!parts) {
            return '';
        }
        return `${parts[parts.length - 1]}.java`;
    }
    async getMainActivityPath() {
        var _a, _b;
        const packageName = await ((_a = this.appBuildGradle) === null || _a === void 0 ? void 0 : _a.getApplicationId());
        const activityName = this.getMainActivityFilename();
        const packageParts = (_b = packageName === null || packageName === void 0 ? void 0 : packageName.split('.')) !== null && _b !== void 0 ? _b : [];
        return (0, path_1.join)('app', 'src', 'main', 'java', ...packageParts, activityName);
    }
    async getGradlePluginVersion() {
        var _a, _b, _c, _d;
        await ((_a = this.buildGradle) === null || _a === void 0 ? void 0 : _a.parse());
        const found = (_b = this.buildGradle) === null || _b === void 0 ? void 0 : _b.find({
            buildscript: {
                dependencies: {
                    classpath: {}
                }
            }
        });
        const sources = (found !== null && found !== void 0 ? found : []).map(f => { var _a, _b; return (_b = (_a = this.buildGradle) === null || _a === void 0 ? void 0 : _a.getSource(f.node)) !== null && _b !== void 0 ? _b : ''; });
        const gradleLine = sources.find(s => s.indexOf('com.android.tools.build:gradle:'));
        return (_d = (_c = gradleLine === null || gradleLine === void 0 ? void 0 : gradleLine.match(/:([\d.]+)/)) === null || _c === void 0 ? void 0 : _c[1]) !== null && _d !== void 0 ? _d : null;
    }
    async getPackageName() {
        var _a, _b;
        const namespace = await ((_a = this.appBuildGradle) === null || _a === void 0 ? void 0 : _a.getNamespace());
        if (namespace) {
            return namespace;
        }
        return (_b = this.manifest.getDocumentElement()) === null || _b === void 0 ? void 0 : _b.getAttribute('package');
    }
    setVersionCode(versionCode) {
        var _a;
        if (versionCode === '') {
            versionCode = 1;
        }
        return (_a = this.appBuildGradle) === null || _a === void 0 ? void 0 : _a.setVersionCode(typeof versionCode === 'number' ? versionCode : parseInt(versionCode, 10));
    }
    async getVersionCode() {
        var _a, _b;
        return (_b = (await ((_a = this.appBuildGradle) === null || _a === void 0 ? void 0 : _a.getVersionCode()))) !== null && _b !== void 0 ? _b : null;
    }
    incrementVersionCode() {
        var _a, _b;
        return (_b = (_a = this.appBuildGradle) === null || _a === void 0 ? void 0 : _a.incrementVersionCode()) !== null && _b !== void 0 ? _b : Promise.resolve();
    }
    setVersionName(versionName) {
        var _a;
        return (_a = this.appBuildGradle) === null || _a === void 0 ? void 0 : _a.setVersionName(versionName);
    }
    getVersionName() {
        var _a, _b;
        return (_b = (_a = this.appBuildGradle) === null || _a === void 0 ? void 0 : _a.getVersionName()) !== null && _b !== void 0 ? _b : Promise.resolve(null);
    }
    setVersionNameSuffix(versionNameSuffix) {
        var _a;
        return (_a = this.appBuildGradle) === null || _a === void 0 ? void 0 : _a.setVersionNameSuffix(versionNameSuffix);
    }
    getVersionNameSuffix() {
        var _a, _b;
        return (_b = (_a = this.appBuildGradle) === null || _a === void 0 ? void 0 : _a.getVersionNameSuffix()) !== null && _b !== void 0 ? _b : Promise.resolve(null);
    }
    /**
     * Add a new file to the given resources directory with the given contents and
     * given file name
     **/
    getResource(resDir, file, options = { encoding: 'utf-8' }) {
        const root = this.getResourcesRoot();
        if (!root) {
            return;
        }
        const dir = (0, path_1.join)(root, resDir);
        if (!options) {
            return (0, utils_fs_1.readFile)((0, path_1.join)(dir, file));
        }
        return (0, utils_fs_1.readFile)((0, path_1.join)(dir, file), options);
    }
    /**
     * Add a new file to the given resources directory with the given contents and
     * given file name
     **/
    async addResource(resDir, file, contents) {
        const root = this.getResourcesRoot();
        if (!root) {
            return;
        }
        const dir = (0, path_1.join)(root, resDir);
        logger_1.Logger.v(`android`, 'addResource', `add res file ${file} to ${resDir}`);
        if (!(await (0, utils_fs_1.pathExists)(dir))) {
            await (0, utils_fs_1.mkdir)(dir);
        }
        return (0, utils_fs_1.writeFile)((0, path_1.join)(dir, file), contents);
    }
    async copyFile(src, dest) {
        var _a, _b, _c;
        if (!((_c = (_b = (_a = this.project) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.android) === null || _c === void 0 ? void 0 : _c.path)) {
            return Promise.reject();
        }
        const destPath = (0, path_1.join)(this.project.config.android.path, dest);
        logger_1.Logger.v(`android`, `copyFile`, `copying ${src} to ${destPath}`);
        if (/^(https?:\/\/)/.test(src)) {
            const res = await fetch(src);
            return (0, utils_fs_1.writeFile)(destPath, Buffer.from(await res.arrayBuffer()));
        }
        const srcPath = (0, path_1.join)(this.project.config.android.path, src);
        return (0, utils_fs_1.copy)(srcPath, destPath);
    }
    /**
     * Copy the given source into the given resources directory with the
     * given file name
     **/
    async copyToResources(resDir, file, source) {
        const root = this.getResourcesRoot();
        if (!root) {
            return;
        }
        const dir = (0, path_1.join)(root, resDir);
        if (!(await (0, utils_fs_1.pathExists)(dir))) {
            await (0, utils_fs_1.mkdir)(dir);
        }
        logger_1.Logger.v(`android`, `copyToResources`, `copying ${file} to Android resources at ${(0, path_1.join)(dir, file)}`);
        const sourceData = await (0, read_src_1.readSource)(source);
        return (0, utils_fs_1.writeFile)((0, path_1.join)(dir, file), sourceData);
    }
    getAndroidManifestPath() {
        var _a, _b;
        if (!((_a = this.project.config.android) === null || _a === void 0 ? void 0 : _a.path)) {
            return null;
        }
        return (0, path_1.join)((_b = this.project.config.android) === null || _b === void 0 ? void 0 : _b.path, 'app', 'src', 'main', 'AndroidManifest.xml');
    }
    getResourcesPath() {
        return (0, path_1.join)('app', 'src', 'main', 'res');
    }
    getResourcesRoot() {
        var _a, _b;
        if (!((_a = this.project.config.android) === null || _a === void 0 ? void 0 : _a.path)) {
            return null;
        }
        return (0, path_1.join)((_b = this.project.config.android) === null || _b === void 0 ? void 0 : _b.path, this.getResourcesPath());
    }
    getAppRoot() {
        var _a, _b;
        if (!((_a = this.project.config.android) === null || _a === void 0 ? void 0 : _a.path)) {
            return null;
        }
        // TODO: Don't hard-code app
        return (0, path_1.join)((_b = this.project.config.android) === null || _b === void 0 ? void 0 : _b.path, 'app');
    }
    async loadGradle(path) {
        var _a, _b;
        if (!((_a = this.project.config.android) === null || _a === void 0 ? void 0 : _a.path)) {
            return null;
        }
        const filename = (0, path_1.join)((_b = this.project.config.android) === null || _b === void 0 ? void 0 : _b.path, path);
        return new gradle_file_1.GradleFile(filename, this.project.vfs);
    }
}
exports.AndroidProject = AndroidProject;
//# sourceMappingURL=project.js.map