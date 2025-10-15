// Font Loading System - Only show fonts that are actually available
class FontLoader {
    constructor() {
        this.availableFonts = new Set();
        this.fontTests = {
            'kaiti': 'Noto Serif SC',
            'song-ming': 'Noto Serif SC', 
            'heiti': 'Noto Sans SC',
            'fangsong': 'Noto Serif SC',
            'xingshu': 'Noto Sans SC',
            'lishu': 'Noto Sans SC',
            'monospace': 'Noto Sans Mono SC',
            'yahei': 'Noto Sans SC'
        };
    }

    // Since we're loading Google Fonts, assume they're all available
    async loadAvailableFonts() {
        console.log('Loading Google Fonts...');
        
        // Add all fonts since they're loaded via Google Fonts
        for (const fontKey of Object.keys(this.fontTests)) {
            this.availableFonts.add(fontKey);
            console.log(`✓ Font loaded: ${this.fontTests[fontKey]} (${fontKey})`);
        }
        
        console.log('Available fonts:', Array.from(this.availableFonts));
        return this.availableFonts;
    }

    // Update the font dropdown to only show available fonts
    updateFontDropdown() {
        console.log('🔄 Updating font dropdown...');
        const select = document.getElementById('hanziFontSelect');
        if (!select) {
            console.error('❌ Font select element not found!');
            return;
        }

        console.log('📋 Available fonts:', Array.from(this.availableFonts));

        // Clear existing options
        select.innerHTML = '';

        // Add only available fonts with accurate Google Font names
        const fontOptions = {
            'kaiti': 'Noto Serif SC/TC (Calligraphy Style)',
            'song-ming': 'Noto Serif SC/TC (Traditional Serif)',
            'heiti': 'Noto Sans SC/TC Bold (Bold Sans-serif)',
            'fangsong': 'Noto Serif SC/TC (Elegant Serif)',
            'xingshu': 'Noto Sans SC/TC (Cursive Style)',
            'lishu': 'Noto Sans SC/TC (Brush Script)',
            'monospace': 'Noto Sans Mono SC/TC (Monospace)',
            'yahei': 'Noto Sans SC/TC (Modern Sans-serif)'
        };

        let firstOption = null;
        let optionsAdded = 0;
        
        for (const [fontKey, displayName] of Object.entries(fontOptions)) {
            if (this.availableFonts.has(fontKey)) {
                const option = document.createElement('option');
                option.value = fontKey;
                option.textContent = displayName;
                select.appendChild(option);
                optionsAdded++;
                console.log(`✅ Added option: ${displayName}`);
                
                if (!firstOption) firstOption = fontKey;
            }
        }

        console.log(`📊 Total options added: ${optionsAdded}`);

        // Set first available font as default
        if (firstOption) {
            select.value = firstOption;
            console.log(`🎯 Set default font: ${firstOption}`);
            // Update the default in gameSettings
            if (typeof gameSettings !== 'undefined') {
                gameSettings.ui.hanziFont = firstOption;
            }
        } else {
            console.warn('⚠️ No fonts available to set as default!');
        }
    }

    // Initialize the font system
    async init() {
        console.log('🔤 Initializing font system...');
        
        // Wait for fonts to load
        await document.fonts.ready;
        console.log('📚 Fonts loaded, testing availability...');
        
        await this.loadAvailableFonts();
        this.updateFontDropdown();
        
        // Apply the default font
        if (this.availableFonts.size > 0) {
            const defaultFont = Array.from(this.availableFonts)[0];
            console.log('🎯 Setting default font:', defaultFont);
            document.body.className = document.body.className.replace(/\bhanzi-[^\s]+\b/g, '').trim();
            document.body.classList.add(`hanzi-${defaultFont}`);
            
            // Update gameSettings if it exists
            if (typeof gameSettings !== 'undefined') {
                gameSettings.ui.hanziFont = defaultFont;
            }
        } else {
            console.warn('⚠️ No fonts available!');
        }
    }
}

// Initialize font loader when DOM is ready
function initializeFontLoader() {
    if (!window.fontLoader) {
        window.fontLoader = new FontLoader();
        window.fontLoader.init();
    }
}

// Try to initialize immediately if DOM is already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFontLoader);
} else {
    // DOM is already ready
    initializeFontLoader();
}

// Fallback: If font loader fails, populate dropdown after a delay
setTimeout(() => {
    const select = document.getElementById('hanziFontSelect');
    if (select && select.children.length <= 1) { // Only has "Loading fonts..." option
        console.log('🚨 Font loader fallback triggered');
        select.innerHTML = `
            <option value="kaiti" selected>Noto Serif SC/TC (Calligraphy Style)</option>
            <option value="song-ming">Noto Serif SC/TC (Traditional Serif)</option>
            <option value="heiti">Noto Sans SC/TC Bold (Bold Sans-serif)</option>
            <option value="fangsong">Noto Serif SC/TC (Elegant Serif)</option>
            <option value="xingshu">Noto Sans SC/TC (Cursive Style)</option>
            <option value="lishu">Noto Sans SC/TC (Brush Script)</option>
            <option value="monospace">Noto Sans Mono SC/TC (Monospace)</option>
            <option value="yahei">Noto Sans SC/TC (Modern Sans-serif)</option>
        `;
        console.log('✅ Fallback dropdown populated');
    }
}, 3000); // 3 second fallback
