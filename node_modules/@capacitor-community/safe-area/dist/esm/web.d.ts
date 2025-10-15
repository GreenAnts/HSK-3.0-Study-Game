import { WebPlugin } from '@capacitor/core';
import type { Config, SafeAreaPlugin } from './definitions';
export declare class SafeAreaWeb extends WebPlugin implements SafeAreaPlugin {
    enable(_options: {
        config: Config;
    }): Promise<void>;
    disable(_options: {
        config: Config;
    }): Promise<void>;
}
