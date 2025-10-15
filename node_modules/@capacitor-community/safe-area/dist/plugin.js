var capacitorSafeArea = (function (exports, core) {
    'use strict';

    const SafeArea = core.registerPlugin('SafeArea', {
        web: () => Promise.resolve().then(function () { return web; }).then((m) => new m.SafeAreaWeb()),
    });
    function setProperty(position) {
        var _a;
        if (typeof document !== 'undefined') {
            (_a = document
                .querySelector(':root')) === null || _a === undefined ? undefined : _a.style.setProperty(`--safe-area-inset-${position}`, `max(env(safe-area-inset-${position}), 0px)`);
        }
    }
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
    function initialize() {
        setProperty('top');
        setProperty('left');
        setProperty('bottom');
        setProperty('right');
    }
    initialize();

    class SafeAreaWeb extends core.WebPlugin {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async enable(_options) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async disable(_options) {
            return;
        }
    }

    var web = /*#__PURE__*/Object.freeze({
        __proto__: null,
        SafeAreaWeb: SafeAreaWeb
    });

    exports.SafeArea = SafeArea;
    exports.initialize = initialize;

    return exports;

})({}, capacitorExports);
//# sourceMappingURL=plugin.js.map
