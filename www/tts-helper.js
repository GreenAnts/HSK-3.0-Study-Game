// Simplified TTS Helper - Clean version with minimal logging
let Capacitor, TextToSpeech, Preferences, TTSHelper, SplashScreen;

// Session flags to prevent repeated prompts
let ttsInstallationPromptShown = false;
let ttsInstallationDeclined = false;

// Function to create a plugin proxy for custom plugins
function createPluginProxy(pluginName) {
    return {
        async call(methodName, options = {}) {            
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins[pluginName]) {
                return await window.Capacitor.Plugins[pluginName][methodName](options);
            } else if (window.Capacitor && window.Capacitor.nativeCallback) {
                try {
                    return await window.Capacitor.nativeCallback(pluginName, methodName, options);
                } catch (error) {
                    throw error;
                }
            } else {
                try {
                    if (window.Capacitor && window.Capacitor.getPlugin) {
                        const plugin = window.Capacitor.getPlugin(pluginName);
                        if (plugin && plugin[methodName]) {
                            return await plugin[methodName](options);
                        }
                    }
                    throw new Error(`Plugin ${pluginName} not available`);
                } catch (error) {
                    throw error;
                }
            }
        },
        
        // TTS Helper methods
        async checkChineseTTSAvailability() {
            return await this.call('checkChineseTTSAvailability', {});
        },
        
        async openTTSSettings() {
            return await this.call('openTTSSettings', {});
        },
        
        async openTTSDataInstallation() {
            return await this.call('openTTSDataInstallation', {});
        },
        
        // TextToSpeech methods
        async speak(options) {
            return await this.call('speak', options);
        },
        
        async stop() {
            return await this.call('stop');
        },
        
        // Preferences methods
        async get(options) {
            return await this.call('get', options);
        },
        
        async set(options) {
            return await this.call('set', options);
        }
    };
}

// Function to wait for Capacitor bridge
function waitForCapacitorBridge() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkCapacitor = () => {
            attempts++;
            
            if (window.Capacitor) {
                resolve(true);
            } else if (attempts >= maxAttempts) {
                resolve(false);
            } else {
                setTimeout(checkCapacitor, 100);
            }
        };
        checkCapacitor();
    });
}

// Initialize Capacitor plugins
async function initializeCapacitorPlugins() {
    await waitForCapacitorBridge();
    
    if (window.Capacitor) {
        Capacitor = window.Capacitor;
        
        // Try different access methods
        if (window.Capacitor.Plugins) {
            TextToSpeech = window.Capacitor.Plugins.TextToSpeech;
            Preferences = window.Capacitor.Plugins.Preferences;
            TTSHelper = window.Capacitor.Plugins.TTSHelper;
            SplashScreen = window.Capacitor.Plugins.SplashScreen;
        } else if (window.Capacitor.getPlugin) {
            TextToSpeech = window.Capacitor.getPlugin('TextToSpeech');
            Preferences = window.Capacitor.getPlugin('Preferences');
            TTSHelper = window.Capacitor.getPlugin('TTSHelper');
            SplashScreen = window.Capacitor.getPlugin('SplashScreen');
        }
        
        // Make plugins globally available
        window.TextToSpeech = TextToSpeech || window.Capacitor.Plugins?.TextToSpeech;
        window.Preferences = Preferences || window.Capacitor.Plugins?.Preferences;
        window.TTSHelper = TTSHelper || window.Capacitor.Plugins?.TTSHelper;
        window.SplashScreen = SplashScreen || window.Capacitor.Plugins?.SplashScreen;
        
        // Create plugin proxies if needed
        if (window.Capacitor && window.Capacitor.Plugins) {
            if (!window.Capacitor.Plugins.TTSHelper) {
                window.Capacitor.Plugins.TTSHelper = createPluginProxy('TTSHelper');
            }
            if (!window.Capacitor.Plugins.TextToSpeech) {
                window.Capacitor.Plugins.TextToSpeech = createPluginProxy('TextToSpeech');
            }
            if (!window.Capacitor.Plugins.Preferences) {
                window.Capacitor.Plugins.Preferences = createPluginProxy('Preferences');
            }
        }
        
        return true;
    }
    return false;
}

// Capacitor is already available globally, no need to reassign

// Test functions
window.testTTS = async function(text = '你好') {
    if (!TextToSpeech || (typeof gameSettings !== 'undefined' && !gameSettings?.tts?.enabled)) return;
    
    try {
        const availabilityResult = await checkChineseTTSAvailability();
        if (availabilityResult.available) {
            await TextToSpeech.speak({ text: text, lang: 'zh-CN', rate: 0.7, pitch: 1.0, volume: 1.0 });
        }
    } catch (error) {
        console.error('TTS test failed:', error);
    }
};

window.testTTSSettings = async function() {
    let results = [];
    
    // Test Method 1: TextToSpeech.openInstall
    try {
        if (TextToSpeech && typeof TextToSpeech.openInstall === 'function') {
            results.push('Method 1: TextToSpeech.openInstall - Available');
            await TextToSpeech.openInstall();
            results.push('Method 1: SUCCESS');
            alert('Method 1 (TextToSpeech.openInstall) worked!\n\n' + results.join('\n'));
            return;
        } else {
            results.push('Method 1: TextToSpeech.openInstall - Not available');
        }
    } catch (error) {
        results.push('Method 1: FAILED - ' + error.message);
    }

    // Test Method 2: TTSHelper.openTTSSettings
    try {
        if (TTSHelper && typeof TTSHelper.openTTSSettings === 'function') {
            results.push('Method 2: TTSHelper.openTTSSettings - Available');
            await TTSHelper.openTTSSettings();
            results.push('Method 2: SUCCESS');
            alert('Method 2 (TTSHelper.openTTSSettings) worked!\n\n' + results.join('\n'));
            return;
        } else {
            results.push('Method 2: TTSHelper.openTTSSettings - Not available');
        }
    } catch (error) {
        results.push('Method 2: FAILED - ' + error.message);
    }

    // Test Method 3: Plugin proxy
    try {
        if (window.Capacitor?.Plugins?.TTSHelper) {
            results.push('Method 3: Plugin proxy - Available');
            await window.Capacitor.Plugins.TTSHelper.openTTSSettings();
            results.push('Method 3: SUCCESS');
            alert('Method 3 (Plugin proxy) worked!\n\n' + results.join('\n'));
            return;
        } else {
            results.push('Method 3: Plugin proxy - Not available');
        }
    } catch (error) {
        results.push('Method 3: FAILED - ' + error.message);
    }

    // Test Method 4: Direct Capacitor call
    try {
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            results.push('Method 4: Direct Capacitor - Available');
            const result = await window.Capacitor.getPlugin('TTSHelper').openTTSSettings();
            results.push('Method 4: SUCCESS');
            alert('Method 4 (Direct Capacitor) worked!\n\n' + results.join('\n'));
            return;
        } else {
            results.push('Method 4: Direct Capacitor - Not available');
        }
    } catch (error) {
        results.push('Method 4: FAILED - ' + error.message);
    }

    // All methods failed
    alert('All methods failed:\n\n' + results.join('\n'));
};

// Enhanced Chinese TTS availability check
window.checkChineseTTSAvailability = async function() {
    try {
        if (TTSHelper && TTSHelper.checkChineseTTSAvailability) {
            const result = await TTSHelper.checkChineseTTSAvailability();
            return result;
        } else if (window.Capacitor?.Plugins?.TTSHelper) {
            const result = await window.Capacitor.Plugins.TTSHelper.checkChineseTTSAvailability();
            return result;
        } else {
            return { 
                available: false, 
                needsInstallation: true, 
                message: 'TTS Helper not available' 
            };
        }
    } catch (error) {
        return { 
            available: false, 
            needsInstallation: true, 
            message: error.message || 'Check failed' 
        };
    }
};

// Improved TTS installation prompt
async function promptChineseTTSInstallation() {
    // Don't show prompt if user already declined or if we've shown it this session
    if (ttsInstallationDeclined || ttsInstallationPromptShown) {
        return;
    }
    
    ttsInstallationPromptShown = true;
    
    const message = `Chinese Text-to-Speech needs to be installed.

To enable Chinese pronunciation:
1. Tap "OK" to open TTS settings
2. Install Chinese language data
3. Return to the app

This is a one-time setup.`;

    if (confirm(message)) {
        try {
            // Method 1: Use TextToSpeech.openInstall if available
            if (TextToSpeech && typeof TextToSpeech.openInstall === 'function') {
                console.log('Trying TextToSpeech.openInstall()');
                await TextToSpeech.openInstall();
                console.log('TextToSpeech.openInstall() succeeded');
                return;
            }
        } catch (error) {
            console.error('TextToSpeech.openInstall() failed:', error);
        }

        try {
            // Method 2: Use TTSHelper.openTTSSettings
            if (TTSHelper && typeof TTSHelper.openTTSSettings === 'function') {
                console.log('Trying TTSHelper.openTTSSettings()');
                await TTSHelper.openTTSSettings();
                console.log('TTSHelper.openTTSSettings() succeeded');
                return;
            }
        } catch (error) {
            console.error('TTSHelper.openTTSSettings() failed:', error);
        }

        try {
            // Method 3: Use plugin proxy
            if (window.Capacitor?.Plugins?.TTSHelper) {
                console.log('Trying window.Capacitor.Plugins.TTSHelper.openTTSSettings()');
                await window.Capacitor.Plugins.TTSHelper.openTTSSettings();
                console.log('Plugin proxy TTSHelper.openTTSSettings() succeeded');
                return;
            }
        } catch (error) {
            console.error('Plugin proxy TTSHelper failed:', error);
        }

        try {
            // Method 4: Direct Capacitor call
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
                console.log('Trying direct Capacitor plugin call');
                const result = await window.Capacitor.getPlugin('TTSHelper').openTTSSettings();
                console.log('Direct Capacitor call succeeded:', result);
                return;
            }
        } catch (error) {
            console.error('Direct Capacitor call failed:', error);
        }

        // Fallback: Manual instructions
        alert(`Could not open TTS settings automatically.

Please manually:
1. Open Android Settings
2. Go to: Accessibility → Text-to-speech
3. Select "Google Text-to-Speech"
4. Tap settings ⚙️ and install Chinese data

Or search "Google Text-to-Speech" in Play Store.`);
    } else {
        // User declined, don't show prompt again this session
        ttsInstallationDeclined = true;
    }
}

// Main TTS function with better error handling
window.playPronunciation = async function(text) {
    if (!text || !TextToSpeech || (typeof gameSettings !== 'undefined' && !gameSettings?.tts?.enabled)) return;
    
    try {
        await TextToSpeech.speak({
            text: text,
            lang: 'zh-CN',
            rate: 0.7,
            pitch: 1.0,
            volume: (typeof gameSettings !== 'undefined' && gameSettings.tts?.volume) || 0.8,
        });
    } catch (speakError) {
        console.error('TTS speak error:', speakError);
        
        // Only show prompt if we haven't shown it already this session
        if (ttsInstallationPromptShown || ttsInstallationDeclined) {
            return; // Don't spam the user with prompts
        }
        
        // Check if it's specifically a language data issue
        const isLanguageError = speakError.message && (
            speakError.message.includes('language') || 
            speakError.message.includes('not supported') ||
            speakError.message.includes('voice data') ||
            speakError.message.includes('LANG_MISSING_DATA') ||
            speakError.message.includes('Chinese') ||
            speakError.message.includes('zh')
        );
        
        if (isLanguageError) {
            // Only prompt for clear language data issues
            await promptChineseTTSInstallation();
        } else {
            // For other errors, do a single availability check but don't be aggressive
            try {
                const availabilityResult = await checkChineseTTSAvailability();
                if (availabilityResult && availabilityResult.needsInstallation && !availabilityResult.available) {
                    await promptChineseTTSInstallation();
                }
            } catch (availError) {
                console.error('TTS availability check failed:', availError);
                // Don't show prompt for availability check failures
            }
        }
    }
};

// Storage functions (simplified)
window.saveGameState = async function(state) {
    try {
        console.log('Attempting to save game state:', state);
        const prefs = Preferences || window.Preferences || window.Capacitor?.Plugins?.Preferences;
        if (prefs) {
            if (state === null) {
                // Clear the saved state
                await prefs.remove({ key: 'savedGameState' });
                console.log('Game state cleared successfully');
            } else {
                await prefs.set({
                    key: 'savedGameState',
                    value: JSON.stringify(state)
                });
                console.log('Game state saved successfully');
            }
        } else {
            console.warn('Preferences not available, falling back to localStorage');
            if (state === null) {
                localStorage.removeItem('savedGameState');
                console.log('Game state cleared from localStorage');
            } else {
                localStorage.setItem('savedGameState', JSON.stringify(state));
            }
        }
    } catch (error) {
        console.error('Save error:', error);
        // Fallback to localStorage
        try {
            if (state === null) {
                localStorage.removeItem('savedGameState');
                console.log('Game state cleared from localStorage as fallback');
            } else {
                localStorage.setItem('savedGameState', JSON.stringify(state));
                console.log('Game state saved to localStorage as fallback');
            }
        } catch (localError) {
            console.error('localStorage fallback failed:', localError);
        }
    }
};

window.loadGameState = async function() {
    try {
        console.log('Attempting to load game state...');
        const prefs = Preferences || window.Preferences || window.Capacitor?.Plugins?.Preferences;
        if (prefs) {
            const result = await prefs.get({ key: 'savedGameState' });
            const state = result.value ? JSON.parse(result.value) : null;
            console.log('Loaded game state from Preferences:', state);
            return state;
        } else {
            console.warn('Preferences not available, checking localStorage');
            const saved = localStorage.getItem('savedGameState');
            const state = saved ? JSON.parse(saved) : null;
            console.log('Loaded game state from localStorage:', state);
            return state;
        }
    } catch (error) {
        console.error('Load error:', error);
        // Fallback to localStorage
        try {
            const saved = localStorage.getItem('savedGameState');
            const state = saved ? JSON.parse(saved) : null;
            console.log('Loaded game state from localStorage (fallback):', state);
            return state;
        } catch (localError) {
            console.error('localStorage fallback failed:', localError);
        }
    }
    return null;
};

window.saveSettings = async function(settings) {
    try {
        console.log('Attempting to save settings:', settings);
        const prefs = Preferences || window.Preferences || window.Capacitor?.Plugins?.Preferences;
        if (prefs) {
            await prefs.set({
                key: 'gameSettings',
                value: JSON.stringify(settings)
            });
            console.log('Settings saved successfully');
        } else {
            console.warn('Preferences not available, falling back to localStorage');
            localStorage.setItem('gameSettings', JSON.stringify(settings));
        }
    } catch (error) {
        console.error('Settings save error:', error);
        // Fallback to localStorage
        try {
            localStorage.setItem('gameSettings', JSON.stringify(settings));
            console.log('Settings saved to localStorage as fallback');
        } catch (localError) {
            console.error('localStorage fallback failed:', localError);
        }
    }
};

window.loadSettings = async function() {
    try {
        console.log('Attempting to load settings...');
        const prefs = Preferences || window.Preferences || window.Capacitor?.Plugins?.Preferences;
        if (prefs) {
            const result = await prefs.get({ key: 'gameSettings' });
            const settings = result.value ? JSON.parse(result.value) : null;
            console.log('Loaded settings from Preferences:', settings);
            return settings;
        } else {
            console.warn('Preferences not available, checking localStorage');
            const saved = localStorage.getItem('gameSettings');
            const settings = saved ? JSON.parse(saved) : null;
            console.log('Loaded settings from localStorage:', settings);
            return settings;
        }
    } catch (error) {
        console.error('Settings load error:', error);
        // Fallback to localStorage
        try {
            const saved = localStorage.getItem('gameSettings');
            const settings = saved ? JSON.parse(saved) : null;
            console.log('Loaded settings from localStorage (fallback):', settings);
            return settings;
        } catch (localError) {
            console.error('localStorage fallback failed:', localError);
        }
    }
    return null;
};

// Simplified initialization
async function initializeApp() {
    const success = await initializeCapacitorPlugins();
    
    // Only do initial TTS check on app startup, not on every game session
    if (success && window.Capacitor?.isNativePlatform() && !window.ttsInitialCheckDone) {
        window.ttsInitialCheckDone = true;
        
        // Check TTS availability after a delay, but only once per app startup
        setTimeout(async () => {
            if (typeof gameSettings !== 'undefined' && gameSettings?.tts?.enabled) {
                try {
                    const availabilityResult = await checkChineseTTSAvailability();
                    if (!availabilityResult.available && availabilityResult.needsInstallation) {
                        // Only prompt on app startup, not during gameplay
                        setTimeout(() => {
                            promptChineseTTSInstallation();
                        }, 1000);
                    }
                } catch (error) {
                    console.error('Initial TTS check failed:', error);
                }
            }
        }, 3000); // Longer delay to avoid interfering with app startup
    }
    
    // Handle mobile UI adjustments
    const hotkeysSection = document.getElementById('hotkeysSection');
    if (hotkeysSection && (window.Capacitor?.isNativePlatform() || window.innerWidth <= 768)) {
        hotkeysSection.style.display = 'none';
    }
    
    // Settings will be loaded by the main app initialization
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}