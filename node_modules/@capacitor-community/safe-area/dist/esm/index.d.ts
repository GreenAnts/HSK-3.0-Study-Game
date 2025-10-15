import type { SafeAreaPlugin } from './definitions';
declare const SafeArea: SafeAreaPlugin;
/**
 * Set initial safe area values.
 * This makes sure `var(--safe-area-inset-*)` values can be used immediately and everywhere.
 * This method will be automatically called.
 *
 * Note for developers using SSR:
 * Only in an SSR environment this method will not necessarily be executed.
 * So if you're using this plugin in an SSR environment,
 * you should call this method as soon as `window.document` becomes available.
 */
declare function initialize(): void;
export * from './definitions';
export { SafeArea, initialize };
