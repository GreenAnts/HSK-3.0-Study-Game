// Enhanced Game Settings with Audio Support
let gameSettings = {
    music: { enabled: false, volume: 0.15 },
    sfx: { enabled: true, volume: 0.7 },
    tts: { enabled: true, volume: 0.8 }, // ADD this line
    ui: { showPinyin: true, pinyinMode: false, easyMode: false, traditional: false, hanziFont: 'kaiti', writingRequired: true, randomize: false, band: 1, rangeStart: 1, rangeEnd: 50, tierRequirement: 3 },
    app: { currentPage: 'landing', hasPlayedBefore: false },
    mascot: { lastInteraction: Date.now(), idleTimeout: 5000 }
};

// HSK Words Data Structure
const hskBands = {
    1: typeof hskBand1 !== 'undefined' ? hskBand1 : [],
    2: typeof hskBand2 !== 'undefined' ? hskBand2 : [],
    3: typeof hskBand3 !== 'undefined' ? hskBand3 : []
};

let hskWords = [];
let currentBand = 1;
let useTraditional = false;
let randomizeWords = false;
let clickAudio = null;

// TTS state management to prevent overlapping audio
let ttsState = {
    currentAudio: null,
    isPlaying: false,
    lastText: null,
    lastPlayTime: 0
};

// Saved game state for resume functionality
let savedGameState = null;

// Enhanced Game State with New Animation Durations
let gameState = {
    selectedWords: [], currentWords: [], activeWordIndex: 0, wordProgress: {},
    starsEarned: 0, completedWords: 0, charactersOnScreen: [], optionButtons: [],
    currentOptions: [], hotkeys: ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'],
    nextWordIndex: 0,
    audioHotkey: ' ', // Spacebar for audio pronunciation
    streakCount: 0, lastAnswerTime: 0, alreadyPenalized: false, easyMode: false,
    tierRequirement: 5,
    
    // Updated mascot animations with new durations
    mascotAnimations: {
        idle: 'Mascot/idle.gif', 
        walk: 'Mascot/walk.gif', 
        rally: 'Mascot/rally.gif',
        sad: 'Mascot/sad.gif', 
        celebrate: 'Mascot/celebrate.gif', 
        ouch: 'Mascot/ouch.gif'
    },
    
    // Updated animation durations as requested
    mascotAnimationDurations: {
        idle: 1200,      // 1.2 seconds
        walk: 800,       // 0.8 seconds  
        rally: 1000,     // 1 second
        sad: 5400,       // 5.4 seconds
        celebrate: 1100, // 1.1 seconds
        ouch: 650        // 0.65 seconds
    },
    
    mascotAnimationQueue: [], 
    currentMascotAnimation: 'walk', // Default to walk instead of idle
    mascotAnimationPlaying: false, 
    sadAnimationActive: false,
    
    // Fix for shake animation bug
    shakeInProgress: false, 
    pendingCharacterAdvance: false,
    lastOuchTime: 0
};

// Global variables for hotkey listening
let listeningForInput = -1;

// Core Functions - Load HSK Words
function loadHSKWords(band = 1) {
    try {
        if (hskBands[band] && hskBands[band].length > 0) {
            hskWords = hskBands[band];
            // HSK words loaded
            
            // Note: allWordsButton was removed - all buttons now say "Start Game"
            
            const maxWords = hskWords.length;
            document.getElementById('startInput').max = maxWords;
            document.getElementById('endInput').max = maxWords;
            
            // Only set default value if no saved value exists
            const endInput = document.getElementById('endInput');
            if (!endInput.value || endInput.value === '50') {
                endInput.value = Math.min(50, maxWords);
            }
            updateRange(false);
            
            return true;
        } else {
            throw new Error(`Band ${band} not available or empty`);
        }
    } catch (error) {
        console.error('Failed to load HSK words:', error);
        hskWords = hskBands[1] || [];
        // Using fallback wordlist
        return false;
    }
}

// Helper function to get Chinese character (simplified or traditional)
function getChineseChar(word) {
    return useTraditional && word.traditional ? word.traditional : word.chinese;
}

// Helper function to create Chinese character element with dynamic sizing
function createChineseCharElement(word) {
    const chineseText = getChineseChar(word);
    const length = chineseText.length;
    const coloredText = colorChineseByCharacter(chineseText, word.pinyin);
    return `<div class="chinese-char" data-length="${length}">${coloredText}</div>`;
}

// Tone detection from pinyin
function getToneNumber(syllable) {
    if (!syllable) return 5;
    
    // Check for tone marks on vowels
    const tone1 = /[āēīōūǖĀĒĪŌŪǕ]/;
    const tone2 = /[áéíóúǘÁÉÍÓÚǗ]/;
    const tone3 = /[ǎěǐǒǔǚǍĚǏǑǓǙ]/;
    const tone4 = /[àèìòùǜÀÈÌÒÙǛ]/;
    
    if (tone1.test(syllable)) return 1;
    if (tone2.test(syllable)) return 2;
    if (tone3.test(syllable)) return 3;
    if (tone4.test(syllable)) return 4;
    
    return 5; // Neutral tone
}

function getToneColor(toneNumber) {
    const toneColors = {
        1: '#e74c3c',  // Red (flat)
        2: '#27ae60',  // Green (rising)
        3: '#2980b9',  // Blue (dipping)
        4: '#8e44ad',  // Purple (falling)
        5: '#7f8c8d'   // Gray (neutral)
    };
    return toneColors[toneNumber] || toneColors[5];
}

// NEW: Color each pinyin syllable individually
function colorPinyinBySyllable(pinyin) {
    if (!pinyin) return '<span style="color: #7f8c8d">-</span>';
    
    // Split pinyin by spaces (each syllable is space-separated)
    const syllables = pinyin.trim().split(/\s+/);
    
    return syllables.map(syllable => {
        const tone = getToneNumber(syllable);
        const color = getToneColor(tone);
        return `<span style="color: ${color}">${syllable}</span>`;
    }).join(' ');
}

// NEW: Color each Chinese character individually
function colorChineseByCharacter(chineseText, pinyin) {
    if (!chineseText) return '';
    
    const characters = Array.from(chineseText);
    const syllables = pinyin ? pinyin.trim().split(/\s+/) : [];
    
    // Map each character to its corresponding syllable's tone
    return characters.map((char, index) => {
        const syllable = syllables[index] || '';
        const tone = getToneNumber(syllable);
        const color = getToneColor(tone);
        // FIX: Added class="character" so styles.css doesn't force 'Inter' font
        return `<span class="character" style="color: ${color}">${char}</span>`;
    }).join('');
}

// Toggle randomize word order function - defined early to avoid reference errors
function toggleRandomize() {
    randomizeWords = !randomizeWords;
    const checkbox = document.getElementById('randomizeCheckbox');
    
    if (checkbox) {
        if (randomizeWords) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
    }

    // Persist setting
    gameSettings.ui.randomize = randomizeWords;
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

// Page state management
function savePageState(pageName) {
    gameSettings.app.currentPage = pageName;
    gameSettings.app.hasPlayedBefore = true;
    
    // Save settings immediately
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
    console.log('Page state saved:', pageName);
}

function getCurrentPage() {
    return gameSettings.app.currentPage || 'landing';
}

function hasPlayedBefore() {
    return gameSettings.app.hasPlayedBefore || false;
}

async function restoreLastPage() {
    const currentPage = getCurrentPage();
    console.log('Restoring last page:', currentPage, 'hasPlayedBefore:', hasPlayedBefore());
    
    // If this is the first time opening the app, stay on landing page
    if (!hasPlayedBefore()) {
        console.log('First time user, staying on landing page');
        return;
    }
    
    // If user was on the game page, try to resume
    if (currentPage === 'game') {
        // Check if there's a saved game state to resume
        const savedState = await loadSavedGameState();
        if (savedState && savedState.selectedWords && savedState.selectedWords.length > 0) {
            console.log('Restoring game from saved state');
            // Automatically resume the game
            await resumeGame();
        } else {
            console.log('No game state to resume, staying on landing page');
            // No saved game, user was probably on game page but finished
            savePageState('landing');
        }
    }
    // If currentPage is 'landing' or any other page, we're already there by default
}

// Complete app initialization behind native loading overlay
async function initializeAppCompletely() {
    console.log('=== Starting Complete App Initialization ===');
    
    try {
        // Step 1: Load saved game state to determine what to show
        console.log('Step 1: Loading saved game state...');
        await checkForSavedGame();
        
        const currentPage = getCurrentPage();
        const hasPlayed = hasPlayedBefore();
        let targetPage = 'landing';
        let shouldResumeGame = false;
        
        console.log('Current page:', currentPage, 'hasPlayedBefore:', hasPlayed);
        
        // Step 2: Determine target page  
        if (!hasPlayed) {
            console.log('First time user - will show landing page');
            targetPage = 'landing';
        } else if (currentPage === 'game') {
            const savedState = await loadSavedGameState();
            if (savedState && savedState.selectedWords && savedState.selectedWords.length > 0) {
                console.log('Has saved game - will resume game');
                targetPage = 'game';
                shouldResumeGame = true;
            } else {
                console.log('No saved game - will show landing page');
                targetPage = 'landing';
                savePageState('landing');
            }
        } else {
            console.log('Default - will show landing page');
            targetPage = 'landing';
        }
        
        // Step 3: Prepare the target page completely
        if (shouldResumeGame) {
            console.log('Step 3: Preparing game resume completely...');
            await prepareCompleteGameResume();
        } else {
            console.log('Step 3: Preparing landing page...');
            // Landing page is ready by default
        }
        
        // Step 4: Show the correct page  
        console.log('Step 4: Revealing app with target page:', targetPage);
        if (targetPage === 'game') {
            document.getElementById('landingPage').style.display = 'none';
            document.getElementById('gamePage').style.display = 'flex';
            
            // NOW position the mascot after the page is visible
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (gameState.charactersOnScreen.length > 0) {
                        console.log('Repositioning characters and mascot after game page shown');
                        positionCharacterContainers();
                    }
                });
            });
            
            // Start background music if enabled
            if (gameSettings.music.enabled) {
                const bgMusic = document.getElementById('backgroundMusic');
                if (bgMusic) {
                    bgMusic.muted = false;
                    bgMusic.volume = gameSettings.music.volume;
                    bgMusic.play().catch(e => {
                        console.log('Background music failed to start:', e);
                    });
                }
            }
        } else {
            document.getElementById('landingPage').style.display = 'flex';
            document.getElementById('gamePage').style.display = 'none';
        }
        
        // Step 5: Remove loading overlay and show app
        console.log('Step 5: Removing loading overlay...');
        await removeLoadingOverlay();
        
        console.log('=== App Initialization Complete ===');
        
    } catch (error) {
        console.error('Error during app initialization:', error);
        // Fallback: show landing page and remove overlay
        document.getElementById('landingPage').style.display = 'flex';
        document.getElementById('gamePage').style.display = 'none';
        await removeLoadingOverlay();
    }
}

// Complete game resume preparation - all operations done behind loading overlay
async function prepareCompleteGameResume() {
    try {
        console.log('Starting complete game resume preparation...');
        let savedState = null;
        
        // Load saved state
        if (typeof window.loadGameState === 'function') {
            console.log('Using Capacitor loadGameState function');
            savedState = await window.loadGameState();
            console.log('Loaded state from Capacitor:', savedState);
        } else {
            console.log('Capacitor not available, using localStorage');
            const saved = localStorage.getItem('savedGameState');
            if (saved) {
                savedState = JSON.parse(saved);
                console.log('Loaded state from localStorage:', savedState);
            } else {
                console.log('No saved state in localStorage');
            }
        }
        
        if (savedState && savedState.selectedWords && savedState.selectedWords.length > 0) {
            console.log('Restoring complete game state...');
            
            // Restore all game state
            gameState.selectedWords = savedState.selectedWords;
            gameState.currentWords = savedState.currentWords || [];
            gameState.wordProgress = savedState.wordProgress || {};
            gameState.starsEarned = savedState.starsEarned || 0;
            gameState.completedWords = savedState.completedWords || 0;
            gameState.activeWordIndex = savedState.activeWordIndex || 0;
            gameState.tierRequirement = savedState.tierRequirement || 3;
            currentBand = savedState.band || 1;
            randomizeWords = savedState.randomize || false;
            
            // Update UI elements
            document.getElementById('totalStarsCount').textContent = gameState.selectedWords.length;
            document.getElementById('starsCount').textContent = gameState.starsEarned;
            
            // Save page state
            savePageState('game');
            
            // Initialize game components completely
            console.log('Initializing all game components...');
            await initializeCompleteGameComponents();
            
            // Clear saved state reference
            savedGameState = null;
            
            console.log('Complete game resume preparation finished');
        } else {
            throw new Error('No valid saved state found');
        }
    } catch (error) {
        console.error('Error preparing complete game resume:', error);
        throw error;
    }
}

// Remove loading overlay and show app content
async function removeLoadingOverlay() {
    try {
        console.log('Removing loading overlay...');
        const overlay = document.getElementById('appLoadingOverlay');
        const appContent = document.getElementById('appContent');
        
        if (overlay && appContent) {
            // Fade out overlay
            overlay.style.transition = 'opacity 0.3s ease-out';
            overlay.style.opacity = '0';
            
            // Show app content
            appContent.style.display = 'block';
            
            // Remove overlay after fade
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
            
            console.log('Loading overlay removed, app visible');
        } else {
            console.warn('Loading overlay or app content not found');
        }
    } catch (error) {
        console.error('Error removing loading overlay:', error);
        // Fallback: force show app content
        const appContent = document.getElementById('appContent');
        if (appContent) {
            appContent.style.display = 'block';
        }
    }
}

// Complete game component initialization for background preparation
async function initializeCompleteGameComponents() {
    // FORCE complete reset of all problematic state
    gameState.activeWordIndex = gameState.activeWordIndex || 0;
    gameState.charactersOnScreen = [];
    gameState.optionButtons = [];
    gameState.currentOptions = [];
    gameState.streakCount = 0;
    gameState.lastAnswerTime = 0;
    gameState.alreadyPenalized = false;
    gameState.shakeInProgress = false;
    gameState.pendingCharacterAdvance = false;
    gameState.mascotAnimationPlaying = false;
    gameState.sadAnimationActive = false;
    gameState.mascotAnimationQueue = [];
    
    // Ensure audioHotkey is preserved
    if (!gameState.audioHotkey) {
        gameState.audioHotkey = ' '; // Default to spacebar
    }
    
    // Re-setup keyboard listeners
    setupKeyboardListeners();
    
    // Initialize components in strict order
    setupCharactersRow();
    setupOptionsGrid();
    
    // Set mascot to walk and update interaction time
    setMascotAnimation('walk');
    gameSettings.mascot.lastInteraction = Date.now();
    
    console.log('Game components initialized');
}


async function loadSavedGameState() {
    try {
        if (typeof window.loadGameState === 'function') {
            return await window.loadGameState();
        } else {
            const saved = localStorage.getItem('savedGameState');
            return saved ? JSON.parse(saved) : null;
        }
    } catch (error) {
        console.error('Error loading saved game state:', error);
        return null;
    }
}

async function clearSavedGameState() {
    try {
        if (typeof window.saveGameState === 'function') {
            await window.saveGameState(null);
        } else {
            localStorage.removeItem('savedGameState');
        }
        console.log('Saved game state cleared');
    } catch (error) {
        console.error('Error clearing saved game state:', error);
    }
}

// Adaptive text sizing for option buttons
function applyAdaptiveTextSize(button) {
    const span = button.querySelector('span');
    if (!span) return;
    
    const text = span.textContent;
    const textLength = text.length;
    const isMobile = window.innerWidth <= 768;
    
    // Base font sizes
    let fontSize;
    
    if (isMobile) {
        // Mobile sizing
        if (textLength <= 10) {
            fontSize = '1.0rem';
        } else if (textLength <= 20) {
            fontSize = '0.9rem';
        } else if (textLength <= 30) {
            fontSize = '0.8rem';
        } else if (textLength <= 40) {
            fontSize = '0.75rem';
        } else {
            fontSize = '0.7rem';
        }
    } else {
        // Desktop sizing
        if (textLength <= 10) {
            fontSize = '1.3rem';
        } else if (textLength <= 20) {
            fontSize = '1.1rem';
        } else if (textLength <= 30) {
            fontSize = '1.0rem';
        } else if (textLength <= 40) {
            fontSize = '0.9rem';
        } else {
            fontSize = '0.8rem';
        }
    }
    
    span.style.fontSize = fontSize;
    span.style.lineHeight = textLength > 20 ? '1.1' : '1.2';
    
    // Adjust padding for better visual balance
    if (textLength > 30) {
        button.style.padding = isMobile ? '8px 6px' : '16px 12px';
    } else {
        button.style.padding = isMobile ? '12px 8px' : '20px 15px';
    }
}

// Enhanced TTS with Capacitor support
function playPronunciation(text) {
    if (!text || !gameSettings.tts.enabled) return;
    
    // Prevent duplicate TTS calls for same text within 500ms
    const now = Date.now();
    if (ttsState.lastText === text && now - ttsState.lastPlayTime < 500) {
        // DEBUG: 'Preventing duplicate TTS call for:', text);
        return;
    }
    
    // Use Capacitor TTS if available, otherwise use desktop TTS
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        // Use Capacitor TTS for mobile
        window.playPronunciation(text);
    } else {
        // Use desktop TTS (Web Speech API with Google TTS fallback)
        stopCurrentTTS();
        playDesktopTTS(text);
    }
    
    ttsState.lastText = text;
    ttsState.lastPlayTime = now;
}

// Desktop TTS using Web Speech API (better for desktop browsers)
function playDesktopTTS(text) {
    // Try Web Speech API first (native browser TTS)
    if ('speechSynthesis' in window) {
        try {
            // Stop any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.8;
            utterance.pitch = 1.0;
            utterance.volume = gameSettings.tts.volume;
            
            ttsState.isPlaying = true;
            ttsState.currentAudio = { type: 'speechSynthesis', utterance };
            
            utterance.onend = () => {
                ttsState.isPlaying = false;
                if (ttsState.currentAudio && ttsState.currentAudio.type === 'speechSynthesis') {
                    ttsState.currentAudio = null;
                }
            };
            
            utterance.onerror = (event) => {
                console.log('Web Speech API error, trying Google TTS fallback:', event.error);
                ttsState.isPlaying = false;
                if (ttsState.currentAudio && ttsState.currentAudio.type === 'speechSynthesis') {
                    ttsState.currentAudio = null;
                }
                // Fallback to Google TTS
                playTTSWithFallbacks(text, 0);
            };
            
            window.speechSynthesis.speak(utterance);
            return;
        } catch (error) {
            console.log('Web Speech API exception:', error);
            ttsState.isPlaying = false;
            ttsState.currentAudio = null;
        }
    }
    
    // Fallback to Google TTS if Web Speech API not available or failed
    playTTSWithFallbacks(text, 0);
}

function playTTSWithFallbacks(text, attemptNumber) {
    const maxAttempts = 3;
    if (attemptNumber >= maxAttempts) {
        // DEBUG: 'All TTS attempts failed for:', text);
        ttsState.isPlaying = false;
        return;
    }
    
    try {
        // Create fresh audio element each time to avoid caching issues
        const audio = new Audio();
        ttsState.currentAudio = audio;
        ttsState.isPlaying = true;
        
        // Different URL formats for different attempts
        let ttsUrl;
        switch(attemptNumber) {
            case 0:
                ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=tw-ob&ttsspeed=0.8`;
                break;
            case 1:
                ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=gtx&ttsspeed=0.8`;
                break;
            case 2:
                ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=webapp&ttsspeed=0.8`;
                break;
        }
        
        audio.volume = gameSettings.tts.volume;
        audio.preload = 'none'; // Don't preload to avoid caching issues
        
        // Clean up when audio ends or fails
        const cleanup = () => {
            ttsState.isPlaying = false;
            if (ttsState.currentAudio === audio) {
                ttsState.currentAudio = null;
            }
        };
        
        // Set up error handling before setting src
        audio.onerror = function(e) {
            // DEBUG: `TTS attempt ${attemptNumber + 1} failed:`, e);
            cleanup();
            // Try next fallback after short delay, but only if we haven't been stopped
            if (ttsState.currentAudio === audio) {
                setTimeout(() => {
                    playTTSWithFallbacks(text, attemptNumber + 1);
                }, 200);
            }
        };
        
        // Set up success and end handling
        audio.onended = cleanup;
        audio.oncanplaythrough = function() {
            // DEBUG: `TTS attempt ${attemptNumber + 1} loaded successfully`);
        };
        
        // Mobile browsers need user interaction, so ensure we have it
        audio.src = ttsUrl;
        
        // Add timestamp to prevent caching
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // DEBUG: `TTS started successfully on attempt ${attemptNumber + 1}`);
            }).catch(err => {
                // DEBUG: `TTS play failed on attempt ${attemptNumber + 1}:`, err);
                cleanup();
                // Try next fallback, but only if we haven't been stopped
                if (ttsState.currentAudio === audio) {
                    setTimeout(() => {
                        playTTSWithFallbacks(text, attemptNumber + 1);
                    }, 200);
                }
            });
        }
        
    } catch (error) {
        // DEBUG: `TTS creation failed on attempt ${attemptNumber + 1}:`, error);
        ttsState.isPlaying = false;
        // Try next fallback, but only if we haven't been stopped
        setTimeout(() => {
            playTTSWithFallbacks(text, attemptNumber + 1);
        }, 200);
    }
}

// Add function to stop current TTS
function stopCurrentTTS() {
    // Stop Web Speech API if active
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    
    // Stop audio element TTS if active
    if (ttsState.currentAudio && ttsState.currentAudio.pause) {
        try {
            ttsState.currentAudio.pause();
            ttsState.currentAudio.src = '';
        } catch (error) {
            // DEBUG: 'Error stopping TTS:', error);
        }
    }
    
    ttsState.currentAudio = null;
    ttsState.isPlaying = false;
}

// Function to replay audio for the active character
function replayActiveCharacterAudio() {
    if (gameState.charactersOnScreen.length > 0 && gameSettings.tts.enabled) {
        const activeCharacter = gameState.charactersOnScreen[0];
        if (activeCharacter && activeCharacter.word) {
            // Check if TTS is currently playing to prevent spam
            if (ttsState.isPlaying) {
                // DEBUG: 'TTS already playing, ignoring replay request');
                return;
            }
            
            // DEBUG: 'Replaying audio for active character:', activeCharacter.word.chinese);
            playPronunciation(getChineseChar(activeCharacter.word));
        }
    }
}

// Helper function to set up click handler for active character
function setupActiveCharacterClickHandler() {
    // Remove click handlers from all character containers first
    const allContainers = document.querySelectorAll('.character-container');
    allContainers.forEach(container => {
        container.removeEventListener('click', handleCharacterClick);
        container.style.cursor = '';
        container.title = '';
        container.style.pointerEvents = '';
    });
    
    // Add click handler only to active character
    const activeContainer = document.querySelector('.character-container.active');
    if (activeContainer) {
        activeContainer.addEventListener('click', handleCharacterClick, { capture: true, passive: false });
        activeContainer.style.cursor = 'pointer';
        activeContainer.style.pointerEvents = 'all';
        activeContainer.title = `Click to replay pronunciation (${getAudioHotkeyDisplayName()})`;
        
        // Also add click handlers to child elements to ensure clicks are captured
        const childElements = activeContainer.querySelectorAll('*');
        childElements.forEach(child => {
            child.style.pointerEvents = 'none'; // Prevent event interference
        });
        
        // DEBUG: 'Click handler set up for active character:', activeContainer.querySelector('.chinese-char')?.textContent);
    }
}

// Separate click handler for better debugging and control
function handleCharacterClick(event) {
    // DEBUG: 'Active character clicked!', event.target);
    event.preventDefault();
    event.stopPropagation();
    replayActiveCharacterAudio();
}

// Helper to get display name for audio hotkey
function getAudioHotkeyDisplayName() {
    // Safety check for undefined audioHotkey
    if (!gameState.audioHotkey) {
        gameState.audioHotkey = ' '; // Default to spacebar
    }
    
    if (gameState.audioHotkey === ' ') return 'SPACEBAR';
    else if (gameState.audioHotkey === 'Enter') return 'ENTER';
    else if (gameState.audioHotkey === 'Tab') return 'TAB';
    else return gameState.audioHotkey.toUpperCase();
}

// Add TTS reset function for mobile issues
function resetTTSSystem() {
    // DEBUG: 'Resetting TTS system for mobile stability');
    
    // Stop current TTS first
    stopCurrentTTS();
    
    // Clear any existing TTS elements that might be lingering
    const existingTTS = document.querySelectorAll('audio[src*="translate.google.com"]');
    existingTTS.forEach(audio => {
        try {
            audio.pause();
            audio.src = '';
            if (audio.parentNode) {
                audio.parentNode.removeChild(audio);
            }
        } catch (error) {
            // DEBUG: 'Error cleaning up TTS element:', error);
        }
    });
    
    // Reset TTS state completely
    ttsState = {
        currentAudio: null,
        isPlaying: false,
        lastText: null,
        lastPlayTime: 0
    };
    
    // Force garbage collection of audio contexts
    if (window.gc) {
        window.gc();
    }
}

function toggleTTS() {
    gameSettings.tts.enabled = !gameSettings.tts.enabled;
    const toggle = document.getElementById('ttsToggle');
    
    if (gameSettings.tts.enabled) {
        toggle.classList.add('active');
    } else {
        toggle.classList.remove('active');
    }
    
    // Save settings
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

function adjustTTSVolume() {
    const slider = document.getElementById('ttsVolume');
    const label = document.getElementById('ttsVolumeText');
    
    gameSettings.tts.volume = slider.value / 100;
    label.textContent = `${slider.value}%`;
    
    // Save settings
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

// Background Music Management
function initializeBackgroundMusic() {
    const bgMusic = document.getElementById('backgroundMusic');
    const toggle = document.getElementById('musicToggle');
    
    if (bgMusic) {
        bgMusic.volume = gameSettings.music.volume;
        bgMusic.muted = !gameSettings.music.enabled;
        
        // Set up proper event listeners for music
        bgMusic.addEventListener('canplay', () => {
            // DEBUG: 'Background music is ready to play');
        });
        
        bgMusic.addEventListener('error', (e) => {
            // DEBUG: 'Background music error:', e);
        });
        
        // Initialize toggle state
        if (toggle) {
            if (gameSettings.music.enabled) {
                toggle.classList.add('active');
            } else {
                toggle.classList.remove('active');
            }
        }
    }
}

function toggleMusic() {
    gameSettings.music.enabled = !gameSettings.music.enabled;
    const toggle = document.getElementById('musicToggle');
    const bgMusic = document.getElementById('backgroundMusic');
    
    if (gameSettings.music.enabled) {
        toggle.classList.add('active');
        if (bgMusic) {
            bgMusic.muted = false;
            bgMusic.volume = gameSettings.music.volume;
            
            // Try to play music with better error handling
            const playPromise = bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // DEBUG: 'Background music started successfully');
                }).catch(error => {
                    // DEBUG: 'Music play failed (likely due to browser autoplay policy):', error);
                    // Show user feedback that they need to interact first
                    if (error.name === 'NotAllowedError') {
                        // DEBUG: 'User interaction required for music playback');
                    }
                });
            }
        }
    } else {
        toggle.classList.remove('active');
        if (bgMusic) {
            bgMusic.pause();
            bgMusic.muted = true;
        }
    }
    
    // Save settings
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

function adjustMusicVolume() {
    const slider = document.getElementById('musicVolume');
    const label = document.getElementById('musicVolumeText');
    const bgMusic = document.getElementById('backgroundMusic');
    
    gameSettings.music.volume = slider.value / 100;
    label.textContent = `${slider.value}%`;
    
    if (bgMusic) {
        bgMusic.volume = gameSettings.music.volume;
    }
    
    // Save settings
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

function toggleSFX() {
    gameSettings.sfx.enabled = !gameSettings.sfx.enabled;
    const toggle = document.getElementById('sfxToggle');
    
    if (gameSettings.sfx.enabled) {
        toggle.classList.add('active');
        playClickSound();
    } else {
        toggle.classList.remove('active');
    }
    
    // Save settings
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

function adjustSFXVolume() {
    const slider = document.getElementById('sfxVolume');
    const label = document.getElementById('sfxVolumeText');
    
    gameSettings.sfx.volume = slider.value / 100;
    label.textContent = `${slider.value}%`;
    
    // Save settings
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

// Enhanced Sound Effects System
function playSound(type) {
    if (!gameSettings.sfx.enabled) return;
    
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let frequencies, duration;
        
        switch(type) {
            case 'correct':
                frequencies = [523, 659, 784]; // C, E, G chord
                duration = 0.3;
                break;
            case 'incorrect':
                frequencies = [196, 220]; // Dissonant low notes
                duration = 0.5;
                break;
            case 'complete':
                frequencies = [523, 659, 784, 1047]; // C major with high C
                duration = 0.8;
                break;
            case 'tierUp':
                frequencies = [440, 554, 659]; // A, C#, E - triumph chord
                duration = 0.6;
                break;
            case 'starShoot':
                frequencies = [523, 659, 784, 1047, 1319]; // Rising star sound
                duration = 1.0;
                break;
            default:
                frequencies = [440];
                duration = 0.3;
        }
        
        // ADD THIS SAFETY CHECK:
        if (!frequencies || !Array.isArray(frequencies)) {
            // DEBUG: 'Invalid frequencies for sound type:', type);
            return;
        }
        
        frequencies.forEach((frequency, index) => {
            // ... rest of function stays the same
        });
        
    } catch (error) {
        // DEBUG: 'Sound synthesis failed:', error);
    }
}

function playClickSound() {
    if (!gameSettings.sfx.enabled || !clickAudio) return;
    
    try {
        clickAudio.volume = gameSettings.sfx.volume * 0.3;
        clickAudio.currentTime = 0; // Reset to beginning
        clickAudio.play().catch(err => {
            // DEBUG: 'Click sound failed:', err);
        });
    } catch (error) {
        // DEBUG: 'Click sound playback failed:', error);
    }
}

// Click Effect System with Sprite Animation
function createClickEffect(event) {
    // Always show sprite regardless of SFX setting
    const effect = document.createElement('img');
    effect.className = 'click-effect';
    effect.src = 'Sprites/click.gif?t=' + Date.now();
    effect.style.left = (event.clientX - 20) + 'px';
    effect.style.top = (event.clientY - 20) + 'px';
    
    document.body.appendChild(effect);
    
    // Play sound only if SFX enabled
    if (gameSettings.sfx.enabled) {
        playClickSound();
    }
    
    setTimeout(() => {
        if (effect.parentNode) {
            effect.parentNode.removeChild(effect);
        }
    }, 660);
}

function selectAllWords() {
    const maxWords = parseInt(document.getElementById('startInput').max);
    document.getElementById('startInput').value = 1;
    document.getElementById('endInput').value = maxWords;
    updateRange(true);
}

// Update tier requirement and save settings
function updateTierRequirement() {
    const tierRequirement = parseInt(document.getElementById('landingTierRequirement').value);
    gameSettings.ui.tierRequirement = tierRequirement;
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

// Add click effect listener to entire document
document.addEventListener('click', createClickEffect);

// Add music enablement on first user interaction (for autoplay policy)
let musicInteractionHandled = false;
document.addEventListener('click', function enableMusicOnFirstClick() {
    if (!musicInteractionHandled && gameSettings.music.enabled) {
        const bgMusic = document.getElementById('backgroundMusic');
        if (bgMusic && bgMusic.paused) {
            const playPromise = bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // DEBUG: 'Background music enabled after user interaction');
                    musicInteractionHandled = true;
                }).catch(e => {
                    // DEBUG: Music still failed after user interaction
                });
            }
        }
    }
}, { once: false }); // Don't use once, as we might need multiple attempts
// Enhanced Mascot Animation System with Idle Detection
function setupIdleDetection() {
    // Track user interactions for idle detection
    document.addEventListener('click', () => {
        gameSettings.mascot.lastInteraction = Date.now();
        if (gameState.currentMascotAnimation === 'idle') {
            queueMascotAnimation('walk');
        }
    });

    document.addEventListener('keydown', () => {
        gameSettings.mascot.lastInteraction = Date.now();
        if (gameState.currentMascotAnimation === 'idle') {
            queueMascotAnimation('walk');
        }
    });

    // Check for idle state every second
    setInterval(checkIdleState, 1000);
}

function checkIdleState() {
    const timeSinceLastInteraction = Date.now() - gameSettings.mascot.lastInteraction;
    
    // If idle for 5+ seconds and currently walking, switch to idle
    if (timeSinceLastInteraction > gameSettings.mascot.idleTimeout && 
        gameState.currentMascotAnimation === 'walk' && 
        !gameState.mascotAnimationPlaying &&
        gameState.mascotAnimationQueue.length === 0) {
        
        queueMascotAnimation('idle');
    }
}

function setMascotAnimation(animationType) {
    const mascotImage = document.getElementById('mascotImage');
    if (mascotImage && gameState.mascotAnimations[animationType]) {
        // Force reload of GIF to start from beginning
        const timestamp = new Date().getTime();
        mascotImage.src = gameState.mascotAnimations[animationType] + '?t=' + timestamp;
        gameState.currentMascotAnimation = animationType;
        
        // Track if sad animation is starting
        if (animationType === 'sad') {
            gameState.sadAnimationActive = true;
        }
    }
}

function queueMascotAnimation(animationType) {
    // Walk and idle can be set immediately if nothing is playing
    if (animationType === 'walk' || animationType === 'idle') {
        if (!gameState.mascotAnimationPlaying && 
            gameState.mascotAnimationQueue.length === 0 && 
            !gameState.sadAnimationActive) {
            setMascotAnimation(animationType);
        }
        return;
    }

    // OUCH animations - BLOCK if sad is active
    if (animationType === 'ouch') {
        // Block ouch if sad animation is active
        if (gameState.sadAnimationActive) {
            // DEBUG: 'Blocking ouch animation because sad animation is active');
            return;
        }
        
        // Only play if not already playing ouch or if enough time has passed
        if (gameState.currentMascotAnimation !== 'ouch' || 
            Date.now() - gameState.lastOuchTime > 1000) { // 1 second cooldown
            setMascotAnimation('ouch');
            gameState.lastOuchTime = Date.now();
            
            // Return to walk after ouch completes
            setTimeout(() => {
                if (gameState.currentMascotAnimation === 'ouch') {
                    setMascotAnimation('walk');
                    gameSettings.mascot.lastInteraction = Date.now();
                }
            }, gameState.mascotAnimationDurations.ouch);
        }
        return;
    }

    // SAD animations should be queued and block other animations
    if (animationType === 'sad') {
        if (!gameState.sadAnimationActive) { // Only queue if not already sad
            gameState.mascotAnimationQueue.push(animationType);
            processAnimationQueue();
        }
        return;
    }

    // Block all other animations if sad is active
    if (gameState.sadAnimationActive) {
        // DEBUG: `Blocking ${animationType} animation because sad animation is active`);
        return;
    }

    // Only CELEBRATE animations get queued (prevent spam)
    if (animationType === 'celebrate') {
        gameState.mascotAnimationQueue.push(animationType);
        processAnimationQueue();
        return;
    }

    // Rally and other animations play immediately if nothing is playing
    if (!gameState.mascotAnimationPlaying && gameState.mascotAnimationQueue.length === 0) {
        gameState.mascotAnimationQueue.push(animationType);
        processAnimationQueue();
    }
}

function processAnimationQueue() {
    // If already playing an animation, wait
    if (gameState.mascotAnimationPlaying || gameState.mascotAnimationQueue.length === 0) {
        return;
    }

    // Play next animation in queue
    const nextAnimation = gameState.mascotAnimationQueue.shift();
    gameState.mascotAnimationPlaying = true;
    
    setMascotAnimation(nextAnimation);
    
    // Use updated durations from gameState
    const duration = gameState.mascotAnimationDurations[nextAnimation] || 1000;
    setTimeout(() => {
        gameState.mascotAnimationPlaying = false;
        
        // IMPORTANT: Clear sad animation flag when sad animation completes
        if (nextAnimation === 'sad') {
            gameState.sadAnimationActive = false;
            // DEBUG: 'Sad animation completed, clearing sadAnimationActive flag');
        }
        
        // After action animations, return to walk and update interaction time
        if (['rally', 'celebrate', 'ouch', 'sad'].includes(nextAnimation)) { // Added 'sad' here
            setMascotAnimation('walk');
            gameSettings.mascot.lastInteraction = Date.now();
        }
        
        // Process next animation in queue
        processAnimationQueue();
    }, duration);
}

function togglePinyin() {
    gameSettings.ui.showPinyin = !gameSettings.ui.showPinyin;
    const toggle = document.getElementById('pinyinToggle');
    const container = document.getElementById('pinyinModeContainer');
    
    if (gameSettings.ui.showPinyin) {
        toggle.classList.add('active');
        container.style.display = 'flex';
    } else {
        toggle.classList.remove('active');
        //--- container.style.display = 'none';
        // If pinyin is hidden, also disable pinyin mode
        if (gameSettings.ui.pinyinMode) {
            //--- togglePinyinMode();
        }
    }
    
    updatePinyinDisplay();
    
    // Save settings
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

function toggleWritingRequired() {
    gameSettings.ui.writingRequired = !gameSettings.ui.writingRequired;
    const writingReqToggle = document.getElementById('writingRequiredToggle');
    if (writingReqToggle) {
        if (gameSettings.ui.writingRequired) writingReqToggle.classList.add('active');
        else writingReqToggle.classList.remove('active');
    }
    // Update checkmarks visibility immediately on current grid
    updateAllCheckmarks();
    
    // Save settings
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

function togglePinyinMode() {
    gameSettings.ui.pinyinMode = !gameSettings.ui.pinyinMode;
    const toggle = document.getElementById('pinyinModeToggle');
    
    if (gameSettings.ui.pinyinMode) {
        toggle.classList.add('active');
    } else {
        toggle.classList.remove('active');
    }
    
    // Update option buttons to show pinyin or english
    updateOptionButtonsText();
    
    // Save settings
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

function updatePinyinDisplay() {
    // Show/hide pinyin elements on character containers
    const pinyinElements = document.querySelectorAll('.pinyin');
    pinyinElements.forEach(element => {
        if (gameSettings.ui.showPinyin) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });
}

function updateOptionButtonsText() {
    // Update button text based on pinyin mode
    gameState.optionButtons.forEach((button, index) => {
        const word = gameState.currentOptions[index];
        if (word) {
            const span = button.querySelector('span');
            if (span) {
                span.textContent = gameSettings.ui.pinyinMode ? word.pinyin : word.english;
                fitTextToButton(button, span);
            }
        }
    });
}

// Auto-fit text inside option button span without clipping
function fitTextToButton(button, span) {
    try {
        const maxFont = 22; // allow larger by default
        const minFont = 10; // px
        // Start from current computed size or max
        let size = parseFloat(window.getComputedStyle(span).fontSize) || maxFont;
        size = Math.min(size, maxFont);
        span.style.whiteSpace = 'normal';
        span.style.wordBreak = 'break-word';
        span.style.hyphens = 'auto';
        const maxHeight = button.clientHeight - 40; // account for bars/padding
        const maxWidth = button.clientWidth - 24;
        for (let s = size; s >= minFont; s -= 1) {
            span.style.fontSize = s + 'px';
            // measure
            const overflows = span.scrollHeight > maxHeight || span.scrollWidth > maxWidth;
            if (!overflows) break;
        }
    } catch (_) {}
}

function toggleEasyMode() {
    gameState.easyMode = !gameState.easyMode;
    gameSettings.ui.easyMode = gameState.easyMode;
    updateSettingsToggles();
    
    // Save settings
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

function toggleTraditional() {
    useTraditional = !useTraditional;
    gameSettings.ui.traditional = useTraditional;
    // Toggle body class to drive font variant selection
    document.body.classList.toggle('use-traditional', !!useTraditional);
    updateSettingsToggles();
    updateCharacterDisplay();
    
    // Save settings
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        // Fallback to localStorage for web
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

function changeHanziFont() {
    const select = document.getElementById('hanziFontSelect');
    if (!select) return;
    
    const selectedFont = select.value; // opt1, opt2, or opt3
    
    // Save the setting
    gameSettings.ui.hanziFont = selectedFont;
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
    
    // Remove old font classes (matches hanzi-opt1, hanzi-opt2, etc.)
    document.body.className = document.body.className.replace(/\bhanzi-opt\d\b/g, '').trim();
    
    // Add new font class
    document.body.classList.add(`hanzi-${selectedFont}`);
    
    // Update live preview
    updateFontPreview();
    
    // Force update of characters on screen
    updateCharacterDisplay();
}

function updateFontPreview() {
    const preview = document.getElementById('fontPreview');
    const select = document.getElementById('hanziFontSelect');
    
    if (!preview || !select) return;
    
    // Update text based on Traditional/Simplified mode
    // (This ensures the user sees the correct character variant in the preview)
    const sampleText = useTraditional ? "讓我們一起學習！" : "让我们一起学习！";
    preview.textContent = sampleText;
    
    // The font family is handled automatically by the body class (hanzi-optX) 
    // defined in fonts.css, so we don't need to manually set style.fontFamily here.
}

// Ensure this function correctly toggles the body class for CSS variables to work
function toggleTraditional() {
    useTraditional = !useTraditional;
    gameSettings.ui.traditional = useTraditional;
    
    // Toggle body class to drive CSS variable selection in fonts.css
    document.body.classList.toggle('use-traditional', !!useTraditional);
    
    updateSettingsToggles();
    updateCharacterDisplay();
    updateFontPreview(); // Update preview text immediately
    
    // Save settings
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    } else {
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    }
}

function updateCharacterDisplay() {
    // Update all visible characters in real-time
    gameState.charactersOnScreen.forEach(char => {
        const chineseCharElement = char.element.querySelector('.chinese-char');
        if (chineseCharElement) {
            const chineseText = getChineseChar(char.word);
            
            // Use innerHTML to render the spans with class="character" and tone colors
            chineseCharElement.innerHTML = colorChineseByCharacter(chineseText, char.word.pinyin);
            
            chineseCharElement.setAttribute('data-length', chineseText.length);
        }
        
        // Recalculate container width if needed
        const chineseText = getChineseChar(char.word);
        const estimatedWidth = Math.max(130, chineseText.length * 35 + 45);
        char.width = estimatedWidth;
        char.element.style.width = `${estimatedWidth}px`;
    });
    
    // Reposition characters with new widths
    positionCharacterContainers();
}

function updateSettingsToggles() {
    // Update all toggle states in settings modal
    const easyToggle = document.getElementById('easyModeToggleSettings');
    const traditionalToggle = document.getElementById('traditionalToggleSettings');
    const hanziFontSelect = document.getElementById('hanziFontSelect');
    const writingReqToggle = document.getElementById('writingRequiredToggle');
    const pinyinToggle = document.getElementById('pinyinToggle');
    const pinyinModeToggle = document.getElementById('pinyinModeToggle');
    const musicToggle = document.getElementById('musicToggle');
    const sfxToggle = document.getElementById('sfxToggle');
    const ttsToggle = document.getElementById('ttsToggle');
    const musicVolume = document.getElementById('musicVolume');
    const sfxVolume = document.getElementById('sfxVolume');
    const ttsVolume = document.getElementById('ttsVolume');
    const musicVolumeText = document.getElementById('musicVolumeText');
    const sfxVolumeText = document.getElementById('sfxVolumeText');
    const ttsVolumeText = document.getElementById('ttsVolumeText');
    const randomizeCheckbox = document.getElementById('randomizeCheckbox');
    const bandSelector = document.getElementById('bandSelector');
    const startInput = document.getElementById('startInput');
    const endInput = document.getElementById('endInput');
    const landingTierRequirement = document.getElementById('landingTierRequirement');
    
    if (gameState.easyMode) {
        easyToggle?.classList.add('active');
    } else {
        easyToggle?.classList.remove('active');
    }
    
    if (useTraditional) traditionalToggle?.classList.add('active');
    else traditionalToggle?.classList.remove('active');
    
    // Initialize Hanzi font selection
    if (hanziFontSelect && gameSettings.ui.hanziFont) {
        // Migrate legacy saved keys to new options
        const legacyToNew = {
            'kaiti': 'opt1',
            'song-ming': 'opt1',
            'heiti': 'opt1',
            'fangsong': 'opt3',
            'xingshu': 'opt2',
            'lishu': 'opt2',
            'monospace': 'opt2',
            'yahei': 'opt1'
        };
        const saved = gameSettings.ui.hanziFont;
        const migrated = legacyToNew[saved] || saved;
        gameSettings.ui.hanziFont = ['opt1','opt2','opt3'].includes(migrated) ? migrated : 'opt1';
        hanziFontSelect.value = gameSettings.ui.hanziFont;
        // Apply the font class to the body
        document.body.className = document.body.className.replace(/\bhanzi-[^\s]+\b/g, '').trim();
        document.body.classList.add(`hanzi-${gameSettings.ui.hanziFont}`);
        // Apply traditional body class based on saved setting
        document.body.classList.toggle('use-traditional', !!gameSettings.ui.traditional);
        // Initialize font preview
        updateFontPreview();
    }

    // Initialize Writing Required toggle
    if (writingReqToggle) {
        if (gameSettings.ui.writingRequired) writingReqToggle.classList.add('active');
        else writingReqToggle.classList.remove('active');
    }

    // Pinyin toggles
    if (pinyinToggle) {
        if (gameSettings.ui.showPinyin) pinyinToggle.classList.add('active');
        else pinyinToggle.classList.remove('active');
    }
    if (pinyinModeToggle) {
        if (gameSettings.ui.pinyinMode) pinyinModeToggle.classList.add('active');
        else pinyinModeToggle.classList.remove('active');
    }

    // Audio toggles and sliders
    if (musicToggle) musicToggle.classList.toggle('active', !!gameSettings.music.enabled);
    if (sfxToggle) sfxToggle.classList.toggle('active', !!gameSettings.sfx.enabled);
    if (ttsToggle) ttsToggle.classList.toggle('active', !!gameSettings.tts.enabled);
    if (musicVolume) { musicVolume.value = Math.round((gameSettings.music.volume || 0) * 100); }
    if (sfxVolume) { sfxVolume.value = Math.round((gameSettings.sfx.volume || 0) * 100); }
    if (ttsVolume) { ttsVolume.value = Math.round((gameSettings.tts.volume || 0) * 100); }
    if (musicVolumeText && musicVolume) musicVolumeText.textContent = `${musicVolume.value}%`;
    if (sfxVolumeText && sfxVolume) sfxVolumeText.textContent = `${sfxVolume.value}%`;
    if (ttsVolumeText && ttsVolume) ttsVolumeText.textContent = `${ttsVolume.value}%`;

    // Landing controls
    if (randomizeCheckbox) {
        randomizeWords = !!gameSettings.ui.randomize;
        randomizeCheckbox.classList.toggle('checked', randomizeWords);
    }
    if (bandSelector && Number.isFinite(gameSettings.ui.band)) {
        bandSelector.value = String(gameSettings.ui.band);
    }
    if (startInput && Number.isFinite(gameSettings.ui.rangeStart)) {
        startInput.value = String(gameSettings.ui.rangeStart);
        const startValue = document.getElementById('startValue');
        if (startValue) startValue.textContent = startInput.value;
    }
    if (endInput && Number.isFinite(gameSettings.ui.rangeEnd)) {
        endInput.value = String(gameSettings.ui.rangeEnd);
        const endValue = document.getElementById('endValue');
        if (endValue) endValue.textContent = endInput.value;
    }
    if (landingTierRequirement && Number.isFinite(gameSettings.ui.tierRequirement)) {
        landingTierRequirement.value = String(gameSettings.ui.tierRequirement);
    }
}

// Fixed Game Logic - Addresses Shake Animation Bug
function highlightCorrectAnswer(correctWord) {
    // Remove all the console.log statements
    
    if (gameState.shakeInProgress) {
        return;
    }

    gameState.shakeInProgress = true;
    
    const activeCharacter = gameState.charactersOnScreen[gameState.activeWordIndex];
    if (!activeCharacter) {
        gameState.shakeInProgress = false;
        return;
    }
    
    const activeWordChinese = activeCharacter.word.chinese;
    
    // Find and shake the correct answer button
    gameState.optionButtons.forEach((button, index) => {
        const option = gameState.currentOptions[index];
        if (option && option.chinese === activeWordChinese) {
            button.classList.add('shake-animation');
            button.style.border = '3px solid var(--sunglow)';
            button.style.boxShadow = '0 0 15px rgba(255, 203, 105, 0.6)';
            
            setTimeout(() => {
                button.classList.remove('shake-animation');
                button.style.border = '';
                button.style.boxShadow = '';
                gameState.shakeInProgress = false;
                gameState.pendingCharacterAdvance = false;
            }, 800);
        }
    });
}

async function selectOption(optionIndex) {
    const selectedWord = gameState.currentOptions[optionIndex];
    const activeCharacter = gameState.charactersOnScreen[gameState.activeWordIndex];
    
    if (!selectedWord || !activeCharacter) return;
    
    // Update mascot interaction time
    gameSettings.mascot.lastInteraction = Date.now();
    
    const isCorrect = selectedWord.chinese === activeCharacter.word.chinese;
    const button = gameState.optionButtons[optionIndex];
    const currentTime = Date.now();
    
    if (isCorrect) {
        // Handle streak tracking
        const timeDiff = currentTime - gameState.lastAnswerTime;
        if (timeDiff < 1000 && gameState.lastAnswerTime > 0) {
            gameState.streakCount++;
        } else {
            gameState.streakCount = 1;
        }
        gameState.lastAnswerTime = currentTime;
        
        await handleCorrectAnswer(selectedWord, button, optionIndex);
        gameState.alreadyPenalized = false;
    } else {
        gameState.streakCount = 0;
        await handleIncorrectAnswer(activeCharacter.word, optionIndex);
        
        // ONLY shake - don't set up any character advance
        highlightCorrectAnswer(activeCharacter.word);
        // Remove this logic that was causing the advance:
        // if (!gameState.shakeInProgress) {
        //     highlightCorrectAnswer(activeCharacter.word);
        // } else {
        //     gameState.pendingCharacterAdvance = true;
        // }
    }
}

async function handleCorrectAnswer(word, button, optionIndex) {
    playSound('correct');
    button.classList.add('correct-animation');
    
    const progress = gameState.wordProgress[word.chinese];
    progress.count++;
    
    let tierChanged = false;
    const req = gameState.tierRequirement;
    
    // Check tier progression
    if (progress.count === req && progress.tier === 'bronze') {
        progress.tier = 'silver';
        tierChanged = true;
    } else if (progress.count === req * 2 && progress.tier === 'silver') {
        progress.tier = 'gold';
        tierChanged = true;
    } else if (progress.count === req * 3 && progress.tier === 'gold') {
        // Check quiz requirement
        if (gameSettings.ui.writingRequired && !isCharacterQuizCompleted(word.chinese)) {
            // Hanzi quiz required - show auto-popup
            hanziQuizState.autoPopupPending = true;
            hanziQuizState.currentQuizWord = word;
            
            // Show the quiz immediately
            setTimeout(() => {
                showHanziQuizModal(word);
            }, 500); // Small delay for smooth UX
            
            return; // Don't award star yet
        }
        
        // Word completed - earn star (quiz already completed)
        createStarAnimation(button);
        playStarShootAnimation();
        playSound('starShoot');
        queueMascotAnimation('celebrate');
        
        gameState.starsEarned++;
        gameState.completedWords++;
        updateUI();
        
        if (gameState.completedWords === gameState.selectedWords.length) {
            setTimeout(() => {
                alert('Congratulations! You completed all words!');
                // Clear the saved game state since game is completed
                clearSavedGameState();
                // Return to landing page
                returnToMenu();
            }, 1000);
            return;
        }
        
        // Remove ONLY the active character, then add new word to rotation
        removeActiveCharacterOnly();
        addNewWordToRotation(word, optionIndex);
        
        // Save game state after character advancement
        await saveCurrentGameState();
        
        setTimeout(() => button.classList.remove('correct-animation'), 800);
        return;
    }
    
    // Play tier up animation and sound
    if (tierChanged) {
        button.classList.add('tier-up');
        playSound('tierUp');
        setTimeout(() => button.classList.remove('tier-up'), 800);
    }
    
    updateOptionButton(optionIndex, word, progress);
    removeActiveCharacterAndAdvance();
    
    // Save game state after all updates are complete
    await saveCurrentGameState();
    
    setTimeout(() => button.classList.remove('correct-animation'), 800);
}

function removeActiveCharacterOnly() {
    const activeChar = gameState.charactersOnScreen[gameState.activeWordIndex];
    if (!activeChar) return;
    
    const activeWord = activeChar.word;
    
    // Remove ONLY the first instance (the active one)
    let removedOne = false;
    gameState.charactersOnScreen = gameState.charactersOnScreen.filter((char, index) => {
        if (char.word.chinese === activeWord.chinese && !removedOne && index === gameState.activeWordIndex) {
            char.element.classList.add('slide-left');
            setTimeout(() => {
                if (char.element.parentNode) {
                    char.element.parentNode.removeChild(char.element);
                }
            }, 500);
            removedOne = true;
            return false; // Remove this character
        }
        return true; // Keep all other characters
    });
    
    // Add new character to maintain 8 total
    const word = getRandomCurrentWord();
    const container = document.createElement('div');
    container.className = 'character-container upcoming';
    container.innerHTML = `
        <div class="pinyin${gameSettings.ui.showPinyin ? '' : ' hidden'}">${colorPinyinBySyllable(word.pinyin)}</div>
        ${createChineseCharElement(word)}
    `;
    
    const chineseText = getChineseChar(word);
    const estimatedWidth = Math.max(130, chineseText.length * 35 + 45);
    container.style.width = `${estimatedWidth}px`;
    
    const charactersRow = document.getElementById('charactersRow');
    charactersRow.appendChild(container);
    gameState.charactersOnScreen.push({ element: container, word: word, width: estimatedWidth });
    
    // Reposition characters
    positionCharacterContainers();
    
    // Play pronunciation for new active character
    setTimeout(() => playPronunciation(getChineseChar(gameState.charactersOnScreen[0].word)), 300);
}

async function handleIncorrectAnswer(correctWord, selectedOptionIndex) {
    // Only penalize if NOT in easy mode
    if (!gameSettings.ui.easyMode && !gameState.alreadyPenalized) {
        gameState.alreadyPenalized = true;
        
        // Find the correct word's button for tier demotion
        let correctOptionIndex = -1;
        for (let i = 0; i < gameState.currentOptions.length; i++) {
            if (gameState.currentOptions[i] && gameState.currentOptions[i].chinese === correctWord.chinese) {
                correctOptionIndex = i;
                break;
            }
        }
        
        if (correctOptionIndex !== -1) {
            const progress = gameState.wordProgress[correctWord.chinese];
            const oldTier = progress.tier;
            
            // Demote tier and reset count to appropriate level
            if (progress.tier === 'gold') {
                progress.tier = 'silver';
                // Reset count to silver tier threshold to allow progression
                progress.count = gameState.tierRequirement * 2 - 1; // Just below gold threshold
            } else if (progress.tier === 'silver') {
                progress.tier = 'bronze';
                // Reset count to bronze tier threshold to allow progression  
                progress.count = gameState.tierRequirement - 1; // Just below silver threshold
            }
            
            // Play appropriate mascot animation based on tier change
            if (oldTier !== progress.tier) {
                queueMascotAnimation('sad');
            } else if (progress.tier === 'bronze') {
                queueMascotAnimation('ouch');
            }
            
            updateOptionButton(correctOptionIndex, correctWord, progress);
            
            // Save game state after tier demotion
            await saveCurrentGameState();
        }
    } else {
        // Easy mode or already penalized - just play ouch
        queueMascotAnimation('ouch');
    }
    
    playSound('incorrect');
}

// Game Initialization System
function initializeGame() {
    // DEBUG: '=== INITIALIZING FRESH GAME ===');
    
    // FORCE complete reset of all problematic state
    gameState.activeWordIndex = 0;
    gameState.charactersOnScreen = [];
    gameState.optionButtons = [];
    gameState.currentOptions = [];
    gameState.streakCount = 0;
    gameState.lastAnswerTime = 0;
    gameState.alreadyPenalized = false;
    gameState.shakeInProgress = false;
    gameState.pendingCharacterAdvance = false;
    gameState.mascotAnimationPlaying = false;
    gameState.sadAnimationActive = false;
    gameState.mascotAnimationQueue = [];
    
    // Ensure audioHotkey is preserved
    if (!gameState.audioHotkey) {
        gameState.audioHotkey = ' '; // Default to spacebar
    }
    
    // DEBUG: State after reset - activeWordIndex, charactersOnScreen, currentWords
    
    // Re-setup keyboard listeners
    setupKeyboardListeners();
    
    // Initialize components in strict order
    setupCharactersRow();
    setupOptionsGrid();
    
    // VERIFY synchronization after setup
    // DEBUG: State after setup - activeWordIndex, charactersOnScreen, optionButtons, activeWord, firstOption
    
    // Set mascot to walk and update interaction time
    setMascotAnimation('walk');
    gameSettings.mascot.lastInteraction = Date.now();
    
    // Start background music if enabled (user interaction guaranteed here)
    if (gameSettings.music.enabled) {
        const bgMusic = document.getElementById('backgroundMusic');
        if (bgMusic) {
            bgMusic.muted = false;
            bgMusic.volume = gameSettings.music.volume;
            const playPromise = bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // DEBUG: 'Background music started successfully in game');
                }).catch(e => {
                    // DEBUG: 'Background music failed to start:', e);
                    // If it fails here, the file might not exist or be corrupted
                });
            }
        }
    }
    
    // DEBUG: '=== GAME INITIALIZATION COMPLETE ===');
}

function setupCharactersRow() {
    const charactersRow = document.getElementById('charactersRow');
    
    // Remove all existing character containers (except mascot)
    const existingCharacters = charactersRow.querySelectorAll('.character-container:not(.mascot-container)');
    existingCharacters.forEach(char => char.remove());
    
    gameState.charactersOnScreen = [];
    
    if (gameState.currentWords.length === 0) {
        console.error('No current words available for character setup!');
        return;
    }
    
    // Create 8 fresh character containers
    for (let i = 0; i < 8; i++) {
        const word = getRandomCurrentWord();
        const container = document.createElement('div');
        
        // Set positioning classes
        if (i === 0) {
            container.className = 'character-container active';
            gameState.activeWordIndex = 0;
            setTimeout(() => playPronunciation(getChineseChar(word)), 300);
        } else if (i <= 2) {
            container.className = 'character-container next';
        } else {
            container.className = 'character-container upcoming';
        }
        
        // Create character content with pinyin visibility control
        container.innerHTML = `
            <div class="pinyin${gameSettings.ui.showPinyin ? '' : ' hidden'}">${colorPinyinBySyllable(word.pinyin)}</div>
            ${createChineseCharElement(word)}
        `;
        
        
        // Calculate container width based on content
        const chineseText = getChineseChar(word);
        const estimatedWidth = Math.max(130, chineseText.length * 35 + 45);
        container.style.width = `${estimatedWidth}px`;
        
        charactersRow.appendChild(container);
        gameState.charactersOnScreen.push({ element: container, word: word, width: estimatedWidth });
    }
    
    // Position all character containers after browser completes layout
    // Using double requestAnimationFrame to ensure DOM measurements are accurate
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            positionCharacterContainers();
        });
    });
    
    // Set up click handler for active character
    setupActiveCharacterClickHandler();
}

function getRandomCurrentWord() {
    return gameState.currentWords[Math.floor(Math.random() * gameState.currentWords.length)];
}

function setupOptionsGrid() {
    const optionsGrid = document.getElementById('optionsGrid');
    
    // Preserve the control buttons before cleanup
    // const voiceButton = document.getElementById('voiceReplayBtn');
    // const hanziButton = document.getElementById('hanziQuizBtn');
    
    // Complete cleanup
    optionsGrid.innerHTML = '';
    gameState.optionButtons = [];
    gameState.currentOptions = [];
    

    
    // Ensure we have words to work with
    if (gameState.currentWords.length === 0 && gameState.selectedWords.length > 0) {
        gameState.currentWords = gameState.selectedWords.slice(0, Math.min(10, gameState.selectedWords.length));
    }
    
    // Create 10 option buttons
    for (let i = 0; i < 10; i++) {
        const word = i < gameState.currentWords.length ? gameState.currentWords[i] : null;
        const button = document.createElement('button');
        button.className = 'option-btn tier-bronze';
        
        if (word) {
            const progress = gameState.wordProgress[word.chinese];
            if (!progress) {
                gameState.wordProgress[word.chinese] = { count: 0, tier: 'bronze' };
            }
            
            const currentProgress = gameState.wordProgress[word.chinese];
            button.className = `option-btn tier-${currentProgress.tier}`;
            
            // Use pinyin or english based on settings
            const displayText = gameSettings.ui.pinyinMode ? word.pinyin : word.english;
            
            button.innerHTML = `
                <span>${displayText}</span>
                <div class="progress-count">${currentProgress.count}/${gameState.tierRequirement}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(currentProgress.count % gameState.tierRequirement) * (100/gameState.tierRequirement)}%"></div>
                </div>
                <div class="hotkey">${gameState.hotkeys[i]}</div>
            `;
            
            // Apply adaptive text sizing
            applyAdaptiveTextSize(button);
            
            // Add checkmark
            updateCheckmarkForButton(button, word);
            
            button.onclick = async () => await selectOption(i);
            gameState.currentOptions[i] = word;
            // Ensure text fits after insertion
            const span = button.querySelector('span');
            if (span) { fitTextToButton(button, span); }
        } else {
            button.innerHTML = `
                <span>---</span>
                <div class="hotkey">${gameState.hotkeys[i]}</div>
            `;
            button.style.opacity = '0.5';
            gameState.currentOptions[i] = null;
        }
        
        optionsGrid.appendChild(button);
        gameState.optionButtons.push(button);
    }
}
// Enhanced Character Positioning System
function positionCharacterContainers() {
    if (gameState.charactersOnScreen.length === 0) return;
    
    const isMobile = window.innerWidth <= 768;
    const screenCenter = window.innerWidth / 2;
    let positions = [];
    
    // Active character at screen center
    positions[0] = screenCenter;
    
    // Calculate positions from center outward (characters trail to the LEFT)
    for (let i = 1; i < gameState.charactersOnScreen.length; i++) {
        const currentContainer = gameState.charactersOnScreen[i];
        const prevContainer = gameState.charactersOnScreen[i - 1];
        
        const currentWidth = currentContainer.width;
        const prevWidth = prevContainer.width;
        
        let minDistance;
        if (isMobile) {
            if (i === 1) {
                const activeScaledWidth = prevWidth * 1.1;
                const nextScaledWidth = currentWidth * 0.8;
                minDistance = (activeScaledWidth / 2) + (nextScaledWidth / 2) + 50;
            } else if (i <= 2) {
                const nextScaledWidth = prevWidth * 0.8;
                const upcomingScaledWidth = currentWidth * 0.8;
                minDistance = (nextScaledWidth / 2) + (upcomingScaledWidth / 2) + 20;
            } else {
                const prevScaledWidth = prevWidth * 0.6;
                const currentScaledWidth = currentWidth * 0.6;
                minDistance = (prevScaledWidth / 2) + (currentScaledWidth / 2) + 15;
            }
        } else {
            if (i === 1) {
                const activeScaledWidth = prevWidth * 1.3;
                const nextWidth = currentWidth * 1.0;
                minDistance = (activeScaledWidth / 2) + (nextWidth / 2) + 25;
            } else {
                const prevScaledWidth = prevWidth * (i <= 2 ? 1.0 : 0.8);
                const currentScaledWidth = currentWidth * (i <= 2 ? 1.0 : 0.8);
                minDistance = (prevScaledWidth / 2) + (currentScaledWidth / 2) + 25;
            }
        }
        
        positions[i] = positions[i - 1] - minDistance;
    }
    
    // Apply positions and styling
    gameState.charactersOnScreen.forEach((char, index) => {
        const container = char.element;
        container.className = 'character-container';
        
        container.style.left = `${positions[index]}px`;
        container.style.transform = 'translateX(-50%)';
        
        if (index === 0) {
            container.classList.add('active');
            container.style.transform = isMobile ? 
                'translateX(-50%) scale(1.1)' : 
                'translateX(-50%) scale(1.3)';
            container.style.zIndex = '100';
            container.style.pointerEvents = 'auto'; // Ensure clicks work on active character
            gameState.activeWordIndex = 0;
            
            // Give active container extra width for longer characters
            const word = gameState.charactersOnScreen[index]?.word;
            if (word) {
                const chineseText = getChineseChar(word);
                const activeWidth = Math.max(150, chineseText.length * 40 + 55);
                container.style.width = `${activeWidth}px`;
            }
        } else if (index <= 2) {
            container.classList.add('next');
            container.style.transform = isMobile ? 
                'translateX(-50%) scale(0.8)' : 
                'translateX(-50%) scale(1.0)';
            container.style.zIndex = '5';
            container.style.pointerEvents = 'none'; // Prevent interference with active character clicks
            
            // Give next containers adequate width for longer characters
            const word = gameState.charactersOnScreen[index]?.word;
            if (word) {
                const chineseText = getChineseChar(word);
                const nextWidth = Math.max(140, chineseText.length * 38 + 50);
                container.style.width = `${nextWidth}px`;
            }
        } else {
            container.classList.add('upcoming');
            container.style.transform = isMobile ? 
                'translateX(-50%) scale(0.6)' : 
                'translateX(-50%) scale(0.8)';
            container.style.zIndex = '1';
            container.style.pointerEvents = 'none'; // Prevent interference with active character clicks
        }
    });
    
    // Position mascot to the RIGHT of active character (fixed positioning relative to viewport)
    const mascotContainer = document.getElementById('mascotContainer');
    if (mascotContainer && gameState.charactersOnScreen.length > 0) {
        // Use a small delay to ensure DOM measurements are accurate
        setTimeout(() => {
            const activeContainer = gameState.charactersOnScreen[0];
            const activeWidth = activeContainer.width;
            
            // Calculate responsive mascot width based on viewport height (matches CSS clamp)
            const viewportHeight = window.innerHeight;
            const mascotWidth = Math.max(150, Math.min(220, viewportHeight * 0.20)); // 20vh with clamps
            
            // Get character row element for vertical positioning
            const charactersRow = document.getElementById('charactersRow');
            const rowRect = charactersRow.getBoundingClientRect();
            
            let mascotDistance;
            if (isMobile) {
                const activeScaledWidth = activeWidth * 1.1;
                const mascotScaledWidth = mascotWidth * 1.1;
                mascotDistance = (activeScaledWidth / 2) + (mascotScaledWidth / 2) - 35; // Much closer, allowing overlap
            } else {
                const activeScaledWidth = activeWidth * 1.3;
                const mascotScaledWidth = mascotWidth * 1.3;
                mascotDistance = (activeScaledWidth / 2) + (mascotScaledWidth / 2) - 40; // Much closer, allowing overlap
            }
            
            // Position relative to page (absolute positioning)
            const activePos = screenCenter;
            const mascotPosX = activePos + mascotDistance;
            // Use getBoundingClientRect for more reliable measurements, with fallback to offsetTop
            const mascotPosY = (rowRect.top > 0 ? rowRect.top : charactersRow.offsetTop) + (rowRect.height > 0 ? rowRect.height : charactersRow.offsetHeight) / 2 - 130;
            
            // Explicitly set position to override any conflicting CSS
            mascotContainer.style.position = 'absolute';
            mascotContainer.style.left = `${mascotPosX}px`;
            mascotContainer.style.top = `${mascotPosY}px`;
            mascotContainer.style.transform = 'translate(-50%, -50%)'; // Center the mascot on its position
            mascotContainer.style.zIndex = '0'; // Behind all characters
            // Remove any conflicting classes that might have position: fixed
            mascotContainer.classList.remove('mascot-icon');
        }, 50); // Small delay to ensure layout is complete
    }
    
    // Set up click handler for the new active character
    setupActiveCharacterClickHandler();
}

// Mobile Menu Controls
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('active');
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const mobileMenu = document.getElementById('mobileMenu');
    const toggleButton = document.querySelector('.mobile-menu-toggle');
    
    if (mobileMenu && !mobileMenu.contains(event.target) && !toggleButton.contains(event.target)) {
        mobileMenu.classList.remove('active');
    }
});

// Character Advancement System
function removeActiveCharacterAndAdvance() {
    const activeChar = gameState.charactersOnScreen[gameState.activeWordIndex];
    if (!activeChar) return;
    
    const activeWord = activeChar.word;
    
    // Remove only the first matching character
    let removedOne = false;
    gameState.charactersOnScreen.forEach(char => {
        if (char.word.chinese === activeWord.chinese && !removedOne) {
            char.element.classList.add('slide-left');
            setTimeout(() => {
                if (char.element.parentNode) {
                    char.element.parentNode.removeChild(char.element);
                }
            }, 500);
            removedOne = true;
        }
    });
    
    // Filter out the removed character
    let foundFirst = false;
    gameState.charactersOnScreen = gameState.charactersOnScreen.filter(char => {
        if (char.word.chinese === activeWord.chinese && !foundFirst) {
            foundFirst = true;
            return false;
        }
        return true;
    });
    
    // Maintain 8 characters by adding new ones
    while (gameState.charactersOnScreen.length < 8) {
        const word = getRandomCurrentWord();
        const container = document.createElement('div');
        container.className = 'character-container upcoming';
        container.innerHTML = `
            <div class="pinyin${gameSettings.ui.showPinyin ? '' : ' hidden'}">${colorPinyinBySyllable(word.pinyin)}</div>
            ${createChineseCharElement(word)}
        `;
        
        const chineseText = getChineseChar(word);
        const estimatedWidth = Math.max(130, chineseText.length * 35 + 45);
        container.style.width = `${estimatedWidth}px`;
        
        const charactersRow = document.getElementById('charactersRow');
        charactersRow.appendChild(container);
        gameState.charactersOnScreen.push({ element: container, word: word, width: estimatedWidth });
    }
    
    // Reposition all characters
    positionCharacterContainers();
    
    // Play pronunciation for new active character
    if (gameState.charactersOnScreen.length > 0) {
        setTimeout(() => playPronunciation(getChineseChar(gameState.charactersOnScreen[0].word)), 300);
    }
}
// Settings Modal Management
function openSettings() {
    const modal = document.getElementById('settingsModal');
    const settingsContainer = document.getElementById('hotkeySettings');
    
    // Only rebuild hotkey settings if not on mobile
    if (settingsContainer && !window.Capacitor?.isNativePlatform() && window.innerWidth > 768) {
        // Clear and rebuild hotkey settings in numpad layout
        settingsContainer.innerHTML = '';
        
        // FIXED: Correct numpad layout order to match physical numpad
        // Visual layout:  7 8 9  (indices 0,1,2)
        //                 4 5 6  (indices 3,4,5)
        //                 1 2 3  (indices 6,7,8)
        //                   0    (index  9)
        const numpadOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        
        numpadOrder.forEach((index) => {
            const button = document.createElement('div');
            button.className = 'hotkey-btn';
            button.textContent = gameState.hotkeys[index];
            button.setAttribute('data-index', index); // Important: set data attribute
            button.tabIndex = 0; // Make it focusable
            
            // Add click listener
            button.addEventListener('click', () => startListening(index));
            
            // Add keyboard listener for when button is focused
            button.addEventListener('keydown', (e) => {
                e.preventDefault();
                if (listeningForInput === index) {
                    updateHotkey(index, e.key);
                }
            });
            
            settingsContainer.appendChild(button);
        });
    }
    
    updateSettingsToggles();
    modal.style.display = 'block';
    
    // Ensure modal is properly positioned on mobile
    if (window.Capacitor?.isNativePlatform() || window.innerWidth <= 768) {
        modal.style.paddingTop = 'env(safe-area-inset-top, 0px)';
    }
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
    
    // Clear any listening states before closing
    clearAllListeningStates();
    listeningForInput = -1;
    
    // Only update existing buttons, don't regenerate the entire grid
    if (gameState.optionButtons.length > 0) {
        updateExistingOptionsGrid();
    }
}

// Add this new function instead of regenerating the grid
function updateExistingOptionsGrid() {
    gameState.optionButtons.forEach((button, index) => {
        const word = gameState.currentOptions[index];
        if (word) {
            // Only update the content, keep the same word in same position
            const displayText = gameSettings.ui.pinyinMode ? word.pinyin : word.english;
            const progress = gameState.wordProgress[word.chinese];
            
            const span = button.querySelector('span');
            const hotkeyDiv = button.querySelector('.hotkey');
            
            if (span) span.textContent = displayText;
            if (hotkeyDiv) hotkeyDiv.textContent = gameState.hotkeys[index];
            
            // Apply adaptive text sizing after content change
            applyAdaptiveTextSize(button);
            
            // Update progress display
            const progressCount = button.querySelector('.progress-count');
            if (progressCount) {
                progressCount.textContent = `${progress.count}/${gameState.tierRequirement}`;
            }
        }
    });
}

// Hotkey Management
function startListening(index) {
    // First, clear any previous listening state
    clearAllListeningStates();
    
    listeningForInput = index;
    
    // Find the button by data-index attribute (for numpad layout)
    const button = document.querySelector(`[data-index="${index}"]`);
    if (button) {
        button.classList.add('listening');
        button.textContent = '?';
    }
    
    // Focus on the button to ensure key events are captured
    button?.focus();
}

// Helper function to clear all listening states
function clearAllListeningStates() {
    const allHotkeyButtons = document.querySelectorAll('.hotkey-btn');
    allHotkeyButtons.forEach((btn, idx) => {
        if (btn.classList.contains('listening')) {
            btn.classList.remove('listening');
            // Restore original hotkey text
            const dataIndex = btn.getAttribute('data-index');
            if (dataIndex !== null) {
                btn.textContent = gameState.hotkeys[parseInt(dataIndex)];
            } else if (btn.id === 'audioHotkeyBtn') {
                // Handle audio hotkey button specially
                let displayKey = gameState.audioHotkey;
                if (displayKey === ' ') displayKey = 'SPACE';
                else if (displayKey === 'Enter') displayKey = 'ENTER';
                else if (displayKey === 'Tab') displayKey = 'TAB';
                else displayKey = displayKey.toUpperCase();
                btn.textContent = displayKey;
            }
        }
    });
}

function updateHotkey(index, newKey) {
    if (newKey.length >= 1) {
        gameState.hotkeys[index] = newKey.toUpperCase();
        
        // Find and update the button by data-index
        const button = document.querySelector(`[data-index="${index}"]`);
        if (button) {
            button.textContent = newKey.toUpperCase();
            button.classList.remove('listening');
        }
        
        listeningForInput = -1;
    }
}

// Audio hotkey management
function startListeningForAudio() {
    // Clear other listening states first
    clearAllListeningStates();
    listeningForInput = -1; // Not using numpad index system
    
    const audioButton = document.getElementById('audioHotkeyBtn');
    if (audioButton) {
        audioButton.classList.add('listening');
        audioButton.textContent = '?';
        audioButton.focus();
        
        // Set flag to indicate we're listening for audio hotkey
        listeningForInput = 'audio';
    }
}

function updateAudioHotkey(newKey) {
    if (newKey.length >= 1) {
        // Convert special keys to display names
        let displayKey = newKey;
        if (newKey === ' ') displayKey = 'SPACE';
        else if (newKey === 'Enter') displayKey = 'ENTER';
        else if (newKey === 'Tab') displayKey = 'TAB';
        else displayKey = newKey.toUpperCase();
        
        gameState.audioHotkey = newKey;
        
        const audioButton = document.getElementById('audioHotkeyBtn');
        if (audioButton) {
            audioButton.textContent = displayKey;
            audioButton.classList.remove('listening');
        }
        
        listeningForInput = -1;
        // DEBUG: 'Audio hotkey updated to:', displayKey);
    }
}

// Global keyboard handler reference for proper cleanup
let gameKeydownHandler = null;

// Keyboard Controls
function setupKeyboardListeners() {
    // Remove existing listener if present
    if (gameKeydownHandler) {
        document.removeEventListener('keydown', gameKeydownHandler);
    }
    
    // Create new handler
    gameKeydownHandler = async (event) => {
        // Check if we're listening for hotkey input in settings
        if (listeningForInput !== -1) {
            event.preventDefault();
            if (listeningForInput === 'audio') {
                updateAudioHotkey(event.key);
            } else {
                updateHotkey(listeningForInput, event.key);
            }
            return;
        }
        
        // Check if settings modal is open
        if (document.getElementById('settingsModal').style.display === 'block') {
            if (event.key === 'Escape') {
                closeSettings();
            }
            return;
        }
        
        // Don't interfere with input fields on landing page
        if (document.getElementById('landingPage').style.display !== 'none') {
            // Allow normal typing in input fields
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return;
            }
        }
        
        // Handle game hotkeys only when in game
        if (document.getElementById('gamePage').style.display === 'flex') {
            // Handle dynamic audio hotkey for audio replay
            if (event.key === gameState.audioHotkey) {
                event.preventDefault();
                replayActiveCharacterAudio();
                return;
            }
            
            const pressedKey = event.key.toUpperCase();
            const optionIndex = gameState.hotkeys.indexOf(pressedKey);
            
            if (optionIndex !== -1) {
                event.preventDefault();
                await selectOption(optionIndex);
            }
        }
    };
    
    document.addEventListener('keydown', gameKeydownHandler);
}

function removeKeyboardListeners() {
    if (gameKeydownHandler) {
        document.removeEventListener('keydown', gameKeydownHandler);
        gameKeydownHandler = null;
    }
}

// UI Update Functions
function updateUI() {
    document.getElementById('starsCount').textContent = gameState.starsEarned;
}

function updateOptionButton(optionIndex, word, progress) {
    const button = gameState.optionButtons[optionIndex];
    button.className = `option-btn tier-${progress.tier}`;
    
    const progressPercent = (progress.count % gameState.tierRequirement) * (100/gameState.tierRequirement);
    const progressFill = button.querySelector('.progress-fill');
    const progressCount = button.querySelector('.progress-count');
    
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }
    if (progressCount) {
        progressCount.textContent = `${progress.count}/${gameState.tierRequirement}`;
    }
    
    // Update checkmark
    updateCheckmarkForButton(button, word);

    // Ensure text fits
    const span = button.querySelector('span');
    if (span) { fitTextToButton(button, span); }
}

// Star Animation System
function createStarAnimation(button) {
    const star = document.createElement('div');
    star.innerHTML = '⭐';
    star.className = 'float-up';
    star.style.position = 'absolute';
    star.style.fontSize = '2rem';
    star.style.left = '50%';
    star.style.top = '50%';
    star.style.transform = 'translate(-50%, -50%)';
    star.style.pointerEvents = 'none';
    star.style.zIndex = '1000';
    
    button.style.position = 'relative';
    button.appendChild(star);
    
    setTimeout(() => {
        if (star.parentNode) star.parentNode.removeChild(star);
    }, 1000);
}

function playStarShootAnimation() {
    const starIcon = document.getElementById('starIcon');
    starIcon.classList.add('star-shoot');
    setTimeout(() => starIcon.classList.remove('star-shoot'), 1200);
}
// Word Rotation System
function addNewWordToRotation(completedWord, optionIndex) {
    // Find available words not yet completed
    const availableWords = gameState.selectedWords.filter(word => 
        gameState.wordProgress[word.chinese].count < gameState.tierRequirement * 3 &&
        !gameState.currentWords.some(w => w.chinese === word.chinese)
    );
    
    // Remove completed word from current rotation
    gameState.currentWords = gameState.currentWords.filter(word => 
        word.chinese !== completedWord.chinese
    );
    
    // Remove completed word from character rotation
    removeCompletedWordFromCharacters(completedWord.chinese);
    
    // Add a new word if available
    if (availableWords.length > 0) {
        const newWord = randomizeWords
            ? availableWords[Math.floor(Math.random() * availableWords.length)]
            : (function() {
                // Sequential: pick next from selectedWords not in currentWords and not completed
                const total = gameState.selectedWords.length;
                for (let step = 0; step < total; step++) {
                    const idx = (gameState.nextWordIndex + step) % total;
                    const candidate = gameState.selectedWords[idx];
                    const notInCurrent = !gameState.currentWords.some(w => w.chinese === candidate.chinese);
                    const notCompleted = gameState.wordProgress[candidate.chinese].count < gameState.tierRequirement * 3;
                    if (notInCurrent && notCompleted) {
                        gameState.nextWordIndex = (idx + 1) % total;
                        return candidate;
                    }
                }
                // fallback to first available if sequential search fails
                return availableWords[0];
            })();
        gameState.currentWords.push(newWord);
        
        // Replace the specific option button with new word
        gameState.currentOptions[optionIndex] = newWord;
        const progress = gameState.wordProgress[newWord.chinese];
        
        const button = gameState.optionButtons[optionIndex];
        button.classList.add('new-word-entry');
        button.className = 'option-btn tier-bronze new-word-entry';
        
        // Use pinyin or english based on settings
        const displayText = gameSettings.ui.pinyinMode ? newWord.pinyin : newWord.english;
        
        button.innerHTML = `
            <span>${displayText}</span>
            <div class="progress-count">${progress.count}/${gameState.tierRequirement}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(progress.count % gameState.tierRequirement) * (100/gameState.tierRequirement)}%"></div>
            </div>
            <div class="hotkey">${gameState.hotkeys[optionIndex]}</div>
        `;
        
        // Apply adaptive text sizing
        applyAdaptiveTextSize(button);
        
        // Add checkmark
        updateCheckmarkForButton(button, newWord);
        // Fit text
        const span = button.querySelector('span');
        if (span) { fitTextToButton(button, span); }
        
        setTimeout(() => button.classList.remove('new-word-entry'), 800);
    } else {
        // No more words available
        gameState.currentOptions[optionIndex] = null;
        const button = gameState.optionButtons[optionIndex];
        button.className = 'option-btn tier-bronze';
        button.innerHTML = `
            <span>COMPLETE</span>
            <div class="hotkey">${gameState.hotkeys[optionIndex]}</div>
        `;
        button.style.opacity = '0.5';
    }
}

function removeCompletedWordFromCharacters(completedWordChinese) {
    // Remove all instances of completed word from character row
    gameState.charactersOnScreen = gameState.charactersOnScreen.filter(char => {
        if (char.word.chinese === completedWordChinese) {
            char.element.classList.add('slide-left');
            setTimeout(() => {
                if (char.element.parentNode) {
                    char.element.parentNode.removeChild(char.element);
                }
            }, 500);
            return false;
        }
        return true;
    });
    
    // Replenish character row
    while (gameState.charactersOnScreen.length < 8) {
        const word = randomizeWords ? getRandomCurrentWord() : (function() {
            // Sequentially prefer the left-most in currentWords not already over-represented
            return gameState.currentWords[(gameState.charactersOnScreen.length) % gameState.currentWords.length];
        })();
        const container = document.createElement('div');
        container.className = 'character-container upcoming';
        container.innerHTML = `
            <div class="pinyin${gameSettings.ui.showPinyin ? '' : ' hidden'}">${colorPinyinBySyllable(word.pinyin)}</div>
            ${createChineseCharElement(word)}
        `;
        
        const chineseText = getChineseChar(word);
        const estimatedWidth = Math.max(130, chineseText.length * 35 + 45);
        container.style.width = `${estimatedWidth}px`;
        
        const charactersRow = document.getElementById('charactersRow');
        charactersRow.appendChild(container);
        gameState.charactersOnScreen.push({ element: container, word: word, width: estimatedWidth });
    }
    
    positionCharacterContainers();
    
    // Play pronunciation for new active character
    if (gameState.charactersOnScreen.length > 0) {
        setTimeout(() => playPronunciation(getChineseChar(gameState.charactersOnScreen[0].word)), 300);
    }
}

// Landing Page Logic
function updateRange(saveSettings = true) {
    const startInput = document.getElementById('startInput');
    const endInput = document.getElementById('endInput');
    const maxWords = parseInt(startInput.max);
    
    let start = parseInt(startInput.value);
    let end = parseInt(endInput.value);
    
    // Validate and constrain inputs
    start = Math.max(1, Math.min(start, maxWords));
    end = Math.max(1, Math.min(end, maxWords));
    
    if (start > end) {
        end = start;
    }
    
    startInput.value = start;
    endInput.value = end;

    // Only persist range if saveSettings is true (user-initiated change)
    if (saveSettings) {
        gameSettings.ui.rangeStart = start;
        gameSettings.ui.rangeEnd = end;
        console.log('Saving range settings:', { start, end, gameSettings: gameSettings.ui });
        if (typeof window.saveSettings === 'function') {
            window.saveSettings(gameSettings);
            console.log('Range settings saved via Capacitor');
        } else {
            // Fallback to localStorage for web
            localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
            console.log('Range settings saved via localStorage');
        }
    }
    
    const totalSelected = end - start + 1;
    
    // Update display values
    document.getElementById('startValue').textContent = start;
    document.getElementById('endValue').textContent = end;
    document.getElementById('totalWords').textContent = maxWords;
    
    // Update progress bar
    const progressFill = document.getElementById('rangeProgressFill');
    const progressText = document.getElementById('rangeProgressText');
    
    if (progressFill && progressText) {
        const percentage = (totalSelected / maxWords) * 100;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${totalSelected} / ${maxWords} words`;
    }
}


// Game Start System
function startGame() {
    // Check if words are loaded
    if (hskWords.length === 0) {
        alert('Please wait for the wordlist to load, then try again.');
        return;
    }
    
    // Clear saved game state when starting new game
    savedGameState = null;
    const resumeButton = document.getElementById('resumeButton');
    if (resumeButton) {
        resumeButton.style.display = 'none';
    }
    
    // Always use custom range (no more allWords vs custom logic)
    const startIndex = parseInt(document.getElementById('startInput').value);
    const endIndex = parseInt(document.getElementById('endInput').value);
    
    // Get tier requirement from landing page
    gameState.tierRequirement = parseInt(document.getElementById('landingTierRequirement').value);
    gameSettings.ui.tierRequirement = gameState.tierRequirement;
    
    // Select words for the game
    // Persist landing selections
    gameSettings.ui.band = currentBand;
    gameSettings.ui.rangeStart = startIndex;
    gameSettings.ui.rangeEnd = endIndex;
    if (typeof window.saveSettings === 'function') {
        window.saveSettings(gameSettings);
    }

    let selectedWords = hskWords.slice(startIndex - 1, endIndex);
    
    // Randomize if option is selected
    if (randomizeWords) {
        selectedWords = shuffleArray([...selectedWords]);
    }
    
    gameState.selectedWords = selectedWords;
    gameState.currentWords = gameState.selectedWords.slice(0, Math.min(10, gameState.selectedWords.length));
    gameState.nextWordIndex = gameState.currentWords.length;
    
    // Initialize word progress
    gameState.wordProgress = {};
    gameState.selectedWords.forEach(word => {
        gameState.wordProgress[word.chinese] = { count: 0, tier: 'bronze' };
    });
    
    // Initialize game state
    gameState.starsEarned = 0;
    gameState.completedWords = 0;
    gameState.activeWordIndex = 0;
    gameState.charactersOnScreen = [];
    gameState.streakCount = 0;
    gameState.lastAnswerTime = 0;
    gameState.alreadyPenalized = false;
    gameState.sadAnimationActive = false;
    gameState.shakeInProgress = false;
    gameState.pendingCharacterAdvance = false;
    
    // Update UI
    document.getElementById('totalStarsCount').textContent = gameState.selectedWords.length;
    document.getElementById('starsCount').textContent = gameState.starsEarned;
    
    // Switch to game page
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'flex';
    
    // Save page state
    savePageState('game');
    
    // Reset per-game Hanzi quiz completions (checkmarks)
    if (typeof hanziQuizState !== 'undefined') {
        hanziQuizState.completedCharacters = new Set();
    }
    
    // Initialize game
    initializeGame();
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Save current game state for resume functionality
async function saveCurrentGameState() {
    // Save current game state for resume functionality
    try {
        const stateToSave = {
            selectedWords: gameState.selectedWords,
            currentWords: gameState.currentWords,
            wordProgress: gameState.wordProgress,
            starsEarned: gameState.starsEarned,
            completedWords: gameState.completedWords,
            activeWordIndex: gameState.activeWordIndex,
            tierRequirement: gameState.tierRequirement,
            band: currentBand,
            randomize: randomizeWords
        };
        
        console.log('Attempting to save game state:', stateToSave);
        if (typeof window.saveGameState === 'function') {
            console.log('Using Capacitor saveGameState function');
            await window.saveGameState(stateToSave);
        } else {
            console.log('Capacitor not available, using localStorage fallback');
            localStorage.setItem('savedGameState', JSON.stringify(stateToSave));
        }
        console.log('Game state saved successfully');
    } catch (error) {
        console.error('Failed to save game state:', error);
        // Additional fallback
        try {
            localStorage.setItem('savedGameState', JSON.stringify(stateToSave));
            console.log('Used localStorage as final fallback');
        } catch (fallbackError) {
            console.error('All save methods failed:', fallbackError);
        }
    }
}

// Resume game from saved state
async function resumeGame() {
    // Resume game from saved state
    try {
        console.log('Resume game called');
        let savedState = null;
        
        if (typeof window.loadGameState === 'function') {
            console.log('Using Capacitor loadGameState function');
            savedState = await window.loadGameState();
            console.log('Loaded state from Capacitor:', savedState);
        } else {
            console.log('Capacitor not available, using localStorage');
            const saved = localStorage.getItem('savedGameState');
            if (saved) {
                savedState = JSON.parse(saved);
                console.log('Loaded state from localStorage:', savedState);
            } else {
                console.log('No saved state in localStorage');
            }
        }
        
        if (savedState && savedState.selectedWords && savedState.selectedWords.length > 0) {
            console.log('Restoring game state...');
            // Restore game state
            gameState.selectedWords = savedState.selectedWords;
            gameState.currentWords = savedState.currentWords || [];
            gameState.wordProgress = savedState.wordProgress || {};
            gameState.starsEarned = savedState.starsEarned || 0;
            gameState.completedWords = savedState.completedWords || 0;
            gameState.activeWordIndex = savedState.activeWordIndex || 0;
            gameState.tierRequirement = savedState.tierRequirement || 3;
            currentBand = savedState.band || 1;
            randomizeWords = savedState.randomize || false;
            
            // Update UI
            document.getElementById('totalStarsCount').textContent = gameState.selectedWords.length;
            document.getElementById('starsCount').textContent = gameState.starsEarned;
            
            // Switch to game page
            document.getElementById('landingPage').style.display = 'none';
            document.getElementById('gamePage').style.display = 'flex';
            
            // Save page state
            savePageState('game');
            
            // Initialize game
            initializeGame();
            
            // Clear the saved state after successful resume
            savedGameState = null;
            const resumeButton = document.getElementById('resumeButton');
            if (resumeButton) {
                resumeButton.style.display = 'none';
            }
            
            return true;
        } else {
            console.log('No valid saved state found');
            alert('No saved game found to resume.');
        }
    } catch (error) {
        console.error('Failed to resume game:', error);
        alert('Failed to resume game. Please try starting a new game.');
    }
    return false;
}

// Check for saved game and show resume button
async function checkForSavedGame() {
    try {
        let savedState = null;
        
        // Wait for Capacitor functions to be available
        let attempts = 0;
        while (attempts < 20) {
            if (window.loadGameState && window.saveGameState) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (typeof window.loadGameState === 'function') {
            console.log('Using Capacitor loadGameState function');
            savedState = await window.loadGameState();
            console.log('Loaded state from Capacitor:', savedState);
        } else {
            console.log('Capacitor not available, using localStorage');
            const saved = localStorage.getItem('savedGameState');
            if (saved) {
                savedState = JSON.parse(saved);
                console.log('Loaded state from localStorage:', savedState);
            } else {
                console.log('No saved state in localStorage');
            }
        }
        
        const resumeButton = document.getElementById('resumeButton');
        if (resumeButton) {
            if (savedState && savedState.selectedWords && savedState.selectedWords.length > 0) {
                console.log('Showing resume button - valid saved state found');
                resumeButton.style.display = 'inline-block';
                savedGameState = savedState;
            } else {
                console.log('Hiding resume button - no valid saved state');
                resumeButton.style.display = 'none';
                savedGameState = null;
            }
        } else {
            console.log('Resume button element not found');
        }
    } catch (error) {
        console.error('Failed to check for saved game:', error);
    }
}

// Enhanced Return to Menu with Complete Cleanup
async function returnToMenu() {
    // DEBUG: '=== RETURNING TO MENU WITH GAME STATE PRESERVATION ===');
    
    // Save current game state for potential resume
    if (gameState.selectedWords.length > 0) {
        console.log('Saving game state with words:', gameState.selectedWords.length);
        await saveCurrentGameState();
        console.log('Game state saved, checking for resume button visibility...');
    } else {
        console.log('No words to save, skipping game state save');
    }
    
    // Stop all audio and animations FIRST
    try {
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            if (audio.id !== 'backgroundMusic') {
                audio.pause();
                audio.src = '';
                audio.load();
            }
        });
        
        const ttsAudio = document.getElementById('tts-audio-element');
        if (ttsAudio) {
            ttsAudio.pause();
            ttsAudio.remove();
        }
        
        // COMPLETELY clear all animation states
        gameState.mascotAnimationQueue = [];
        gameState.mascotAnimationPlaying = false;
        gameState.sadAnimationActive = false;
        gameState.shakeInProgress = false;
        gameState.pendingCharacterAdvance = false;
    } catch (error) {
        // DEBUG: 'Audio cleanup error:', error);
    }

    try {
        // Reset TTS system for mobile
        resetTTSSystem();
        
        // Clear any TTS-related timeouts
        for (let i = 1; i < 10000; i++) {
            clearTimeout(i);
        }
    } catch (error) {
        // DEBUG: 'TTS cleanup error:', error);
    }
    
    // THOROUGH DOM cleanup
    try {
        const optionsGrid = document.getElementById('optionsGrid');
        if (optionsGrid) {
            // Preserve the control buttons before cleanup
            // const voiceButton = document.getElementById('voiceReplayBtn');
            // const hanziButton = document.getElementById('hanziQuizBtn');
            
            const buttons = optionsGrid.querySelectorAll('.option-btn');
            buttons.forEach(button => {
                // Remove ALL animation classes and inline styles
                button.classList.remove('shake-animation', 'correct-animation', 'tier-up', 'new-word-entry', 'slide-left', 'float-up');
                button.style.border = '';
                button.style.boxShadow = '';
                button.style.transform = '';
                button.style.opacity = '';
                button.style.animation = '';
                // IMPORTANT: Remove onclick handlers to prevent ghost references
                button.onclick = null;
            });
            optionsGrid.innerHTML = '';
            

        }
        
        const charactersRow = document.getElementById('charactersRow');
        if (charactersRow) {
            const characterContainers = charactersRow.querySelectorAll('.character-container:not(.mascot-container)');
            characterContainers.forEach(container => {
                container.classList.remove('active', 'next', 'upcoming', 'slide-left', 'new-word-entry');
                container.style.left = '';
                container.style.transform = '';
                container.style.zIndex = '';
                container.style.animation = '';
                container.remove();
            });
        }
        
        // Set mascot to walk animation
        setMascotAnimation('walk');
        gameSettings.mascot.lastInteraction = Date.now();
    } catch (error) {
        // DEBUG: 'DOM cleanup error:', error);
    }
    
    // COMPLETE game state reset - preserve only settings
    const preservedSettings = {
        hotkeys: [...gameState.hotkeys],
        easyMode: gameState.easyMode,
        mascotAnimations: { ...gameState.mascotAnimations },
        mascotAnimationDurations: { ...gameState.mascotAnimationDurations }
    };
    
    // Create completely fresh game state with EXPLICIT resets
    gameState = {
        selectedWords: [], 
        currentWords: [], 
        activeWordIndex: 0,  // EXPLICITLY reset to 0
        wordProgress: {},
        starsEarned: 0, 
        completedWords: 0, 
        charactersOnScreen: [],  // EXPLICITLY empty array
        optionButtons: [],       // EXPLICITLY empty array
        currentOptions: [],      // EXPLICITLY empty array
        streakCount: 0, 
        lastAnswerTime: 0, 
        alreadyPenalized: false,
        tierRequirement: 5, 
        shakeInProgress: false,  // EXPLICITLY reset
        pendingCharacterAdvance: false,
        lastOuchTime: 0,
        hotkeys: preservedSettings.hotkeys, 
        easyMode: preservedSettings.easyMode,
        mascotAnimations: preservedSettings.mascotAnimations,
        mascotAnimationDurations: preservedSettings.mascotAnimationDurations,
        mascotAnimationQueue: [], 
        currentMascotAnimation: 'walk',
        mascotAnimationPlaying: false, 
        sadAnimationActive: false
    };
    
    // Clear ALL timeouts/intervals more aggressively
    let id = window.setTimeout(function() {}, 0);
    while (id--) {
        window.clearTimeout(id);
    }
    
    // Properly remove keyboard listeners
    removeKeyboardListeners();
    
    // Update settings toggles
    updateSettingsToggles();
    
    // Close mobile menu
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.remove('active');
    }
    
    // DEBUG: '=== STATE CLEANUP COMPLETE ===');
    
    // Switch to landing page
    document.getElementById('gamePage').style.display = 'none';
    document.getElementById('landingPage').style.display = 'flex';
    
    // Save page state
    savePageState('landing');
    
    // Check for saved game and show resume button if available
    await checkForSavedGame();
    
    // DEBUG: '=== RETURNED TO MENU SUCCESSFULLY ===');
}

// Band Selection
async function changeBand() {
    const bandSelector = document.getElementById('bandSelector');
    const selectedBand = parseInt(bandSelector.value);
    
    // Show loading message
    const startButtons = document.querySelectorAll('.start-button');
    startButtons.forEach(btn => {
        btn.disabled = true;
        // Don't change text if this is the resume button
        if (btn.id !== 'resumeButton') {
            btn.textContent = 'Loading...';
        }
    });
    
    // Load the selected band
    const success = await loadHSKWords(selectedBand);
    
    // Re-enable buttons
    startButtons.forEach((btn, index) => {
        btn.disabled = false;
        // Don't change text if this is the resume button
        if (btn.id !== 'resumeButton') {
            btn.textContent = 'Start Game'; // All buttons should say "Start Game"
        }
    });
    
    if (success) {
        currentBand = selectedBand;
        // Persist band selection
        gameSettings.ui.band = currentBand;
        if (typeof window.saveSettings === 'function') {
            window.saveSettings(gameSettings);
        } else {
            // Fallback to localStorage for web
            localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
        }
    } else {
        // Reset selector if loading failed
        bandSelector.value = currentBand;
        alert(`Failed to load Band ${selectedBand} wordlist. Using Band ${currentBand}.`);
    }
    
    // Ensure resume button visibility is preserved after band change
    const resumeButton = document.getElementById('resumeButton');
    if (savedGameState && resumeButton) {
        resumeButton.style.display = 'inline-block';
    }
}
// App Initialization
async function initializeApp() {
    // Wait for TTS helper to initialize first (it loads settings)
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        if (window.loadSettings && window.saveSettings) {
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    
    // Load saved settings first
    try {
        let savedSettings = null;
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            if (typeof window.loadSettings === 'function') {
                savedSettings = await window.loadSettings();
            }
        } else {
            const saved = localStorage.getItem('gameSettings');
            if (saved) {
                savedSettings = JSON.parse(saved);
            }
        }
        
        if (savedSettings) {
            Object.assign(gameSettings, savedSettings);
            console.log('Loaded settings:', savedSettings);
            
            // Sync gameState with loaded settings
            gameState.easyMode = gameSettings.ui.easyMode;
            useTraditional = gameSettings.ui.traditional;
            
            // Ensure app state exists
            if (!gameSettings.app) {
                gameSettings.app = { currentPage: 'landing', hasPlayedBefore: false };
            }
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
    
    // Initialize StatusBar for edge-to-edge display
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        try {
            const { StatusBar } = await import('@capacitor/status-bar');
            await StatusBar.setOverlaysWebView({ overlay: true });
            await StatusBar.setBackgroundColor({ color: '#797d62' });
            await StatusBar.setStyle({ style: 'light' });
        } catch (error) {
            console.log('StatusBar not available:', error);
        }
    }
    
    // Wait a bit for DOM to be fully ready, then initialize UI
    setTimeout(async () => {
        // Load band from settings if available
        const savedBand = Number.isFinite(gameSettings.ui.band) ? gameSettings.ui.band : 1;
        await loadHSKWords(savedBand);
        currentBand = savedBand;
        
        // Initialize landing controls from saved settings
        const bandSelector = document.getElementById('bandSelector');
        if (bandSelector) bandSelector.value = String(savedBand);
        if (Number.isFinite(gameSettings.ui.rangeStart)) {
            const startInput = document.getElementById('startInput');
            if (startInput) {
                startInput.value = String(gameSettings.ui.rangeStart);
                console.log('Set startInput to:', gameSettings.ui.rangeStart);
            }
        }
        if (Number.isFinite(gameSettings.ui.rangeEnd)) {
            const endInput = document.getElementById('endInput');
            if (endInput) {
                endInput.value = String(gameSettings.ui.rangeEnd);
                console.log('Set endInput to:', gameSettings.ui.rangeEnd);
            }
        }
        // Sync all UI toggles/sliders/dropdowns
        updateSettingsToggles();
        // Recompute range visuals (don't save during initialization)
        updateRange(false);
        
        // Initialize app completely behind native loading overlay
        console.log('Starting native app initialization...');
        // Add delay to ensure Capacitor functions are fully loaded  
        setTimeout(async () => {
            await initializeAppCompletely();
        }, 500);
    }, 100);
    
    // Initialize audio systems
    initializeBackgroundMusic();
    setupIdleDetection();
    
    // Preload click audio
    try {
        clickAudio = new Audio('Sounds/click.mp3');
        clickAudio.preload = 'auto';
    } catch (error) {
        // DEBUG: 'Failed to preload click audio:', error);
    }
    // Periodic TTS system refresh for mobile stability
    setInterval(() => {
        if (document.getElementById('gamePage').style.display === 'flex') {
            // More aggressive cleanup on mobile
            const isMobile = window.innerWidth <= 768;
            const resetInterval = isMobile ? 60000 : 120000; // 1 min mobile, 2 min desktop
            const timeSinceInteraction = Date.now() - gameSettings.mascot.lastInteraction;
            
            if (timeSinceInteraction > resetInterval) {
                resetTTSSystem();
            }
        }
    }, 30000); // Check every 30 seconds
    
    // Add window resize listener for responsive character and mascot positioning
    window.addEventListener('resize', handleWindowResize);
    
    // Initialize hanzi quiz system
    loadCompletedQuizzes();

    // DEBUG: 'App initialized with enhanced audio and UI support');
}

// Throttle resize events to prevent excessive repositioning
let resizeTimeout = null;

// Handle window resize to maintain proper character positioning
function handleWindowResize() {
    // Only reposition if we're in game and have characters on screen
    if (document.getElementById('gamePage').style.display === 'flex' && 
        gameState.charactersOnScreen.length > 0) {
        
        // Clear existing timeout to throttle resize events
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = setTimeout(() => {
            // DEBUG: 'Window resized, repositioning characters and mascot');
            positionCharacterContainers();
            setupActiveCharacterClickHandler(); // Ensure click handlers are still working
            
            // Reapply adaptive text sizing to all option buttons after resize
            const optionButtons = document.querySelectorAll('.option-btn');
            optionButtons.forEach(button => {
                applyAdaptiveTextSize(button);
            });
            
            resizeTimeout = null;
        }, 150); // 150ms throttle for smooth performance
    }
}

// Initialize range values on page load (don't save during initial load)
updateRange(false);

// Load default wordlist when page loads
window.addEventListener('DOMContentLoaded', initializeApp);

// Hanzi Quiz System
let hanziQuizState = {
    writer: null,
    currentCharacter: null,
    quizCompleted: false,
    completedCharacters: new Set(), // Track completed character quizzes
    autoPopupPending: false,
    currentQuizWord: null,
    remainingChars: [],
    currentCharIndex: 0
};

function openHanziQuiz() {
    // Get the currently active character
    const activeCharacter = getCurrentActiveCharacter();
    if (!activeCharacter) {
        return;
    }
    
    hanziQuizState.currentQuizWord = activeCharacter;
    hanziQuizState.autoPopupPending = false;
    
    showHanziQuizModal(activeCharacter);
}

function getCurrentActiveCharacter() {
    // Find the active character from the characters on screen
    const activeContainer = document.querySelector('.character-container.active');
    if (!activeContainer) return null;
    
    const chineseChar = activeContainer.querySelector('.chinese-char');
    if (!chineseChar) return null;
    
    const currentCharacterText = chineseChar.textContent.trim();
    
    // Find the word object that matches this character
    for (const word of gameState.currentWords) {
        const displayChar = gameSettings.ui.traditional ? word.traditional : word.chinese;
        if (displayChar === currentCharacterText) {
            return word;
        }
    }
    
    return null;
}

function showHanziQuizModal(word) {
    const modal = document.getElementById('hanziQuizModal');
    const characterInfo = document.getElementById('hanziQuizCharacter');
    const writingArea = document.getElementById('hanziWritingArea');
    
    // Display character information
    const displayChar = gameSettings.ui.traditional ? word.traditional : word.chinese;
    characterInfo.innerHTML = `
        <div style="font-size: 2rem; margin-bottom: 10px;">${displayChar}</div>
        <div style="font-size: 1rem; color: var(--beaver);">${word.pinyin}</div>
        <div style="font-size: 0.9rem; color: var(--reseda-green);">${word.english}</div>
    `;
    
    // Clear and setup writing area
    writingArea.innerHTML = '';
    
    // Prepare multi-character sequencing
    hanziQuizState.remainingChars = Array.from(displayChar).filter(ch => ch.trim().length > 0);
    hanziQuizState.currentCharIndex = 0;
    const firstChar = hanziQuizState.remainingChars[0];
    hanziQuizState.currentCharacter = firstChar;
    
    // Create HanziWriter instance
    try {
        hanziQuizState.writer = HanziWriter.create('hanziWritingArea', firstChar, {
            width: 280,
            height: 280,
            padding: 20,
            renderer: 'canvas', // Use canvas renderer for better mobile touch support
            strokeAnimationSpeed: 1,
            strokeHighlightSpeed: 2,
            delayBetweenStrokes: 100,
            // Always draw on top of outline, never cover strokes
            showOutline: true,
            showCharacter: false, // keep character hidden to avoid obscuring strokes
            drawingColor: '#2c3e50',
            strokeColor: '#34495e',
            radicalColor: '#da5b30',
            highlightColor: '#e74c3c',
            drawingWidth: 3
        });
        
        // Initialize Toggle button to match current outline state (outline is shown by default)
        const toggleBtn = document.getElementById('characterToggleBtn');
        if (toggleBtn) {
            toggleBtn.classList.add('showing');
            toggleBtn.textContent = 'Hide Outline';
        }

        // Start the quiz with proper callbacks and mobile-friendly settings
        hanziQuizState.writer.quiz({
            showHintAfterMisses: 1, // Show hint after 1 mistake
            acceptBackwardsStrokes: false,
            leniency: 2.0,
            onComplete: function() {
                // Mark this character completed, then move to next if any
                if (hanziQuizState.currentCharacter) {
                    markCharacterQuizCompleted(hanziQuizState.currentCharacter);
                }
                hanziQuizState.currentCharIndex++;
                if (hanziQuizState.currentCharIndex < hanziQuizState.remainingChars.length) {
                    const nextChar = hanziQuizState.remainingChars[hanziQuizState.currentCharIndex];
                    startSequentialCharQuiz(nextChar, word);
                } else {
                    hanziQuizState.quizCompleted = true;
                    showQuizSuccessMessage();
                    setTimeout(async () => { await closeHanziQuiz(); }, 1200);
                }
            },
            onCorrectStroke: function(strokeData) {
                console.log('Correct stroke!', strokeData);
            },
            onMistake: function(strokeData) {
                // Visual feedback for mistakes
                const writingArea = document.getElementById('hanziWritingArea');
                if (writingArea) {
                    writingArea.style.backgroundColor = '#ffeeee';
                    setTimeout(() => {
                        writingArea.style.backgroundColor = 'white';
                    }, 300);
                }
                console.log('Mistake on stroke', strokeData);
            }
        });
        
        // Additional mobile touch event fix - delay to allow HanziWriter to create canvas
        setTimeout(() => {
            const canvas = writingArea.querySelector('canvas');
            if (canvas) {
                // Prevent default touch behavior that might interfere with drawing
                canvas.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                }, { passive: false });
                
                canvas.addEventListener('touchmove', function(e) {
                    e.preventDefault();
                }, { passive: false });
                
                canvas.addEventListener('touchend', function(e) {
                    e.preventDefault();
                }, { passive: false });
                
                console.log('Added touch event handlers to canvas');
            } else {
                console.log('Canvas not found for touch event setup');
            }
        }, 100);
        
        // Show the modal
        modal.classList.add('active');
        
    } catch (error) {
        console.error('Failed to create HanziWriter:', error);
        alert('Unable to load character data. Please try again.');
    }
}

// Start quiz for the next character in a multi-character word sequence
function startSequentialCharQuiz(char, word) {
    try {
        const writingArea = document.getElementById('hanziWritingArea');
        const characterInfo = document.getElementById('hanziQuizCharacter');
        if (!writingArea) return;
        writingArea.innerHTML = '';
        hanziQuizState.currentCharacter = char;

        if (characterInfo && word) {
            characterInfo.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 10px;">${char}</div>
                <div style="font-size: 1rem; color: var(--beaver);">${word.pinyin}</div>
                <div style="font-size: 0.9rem; color: var(--reseda-green);">${word.english}</div>
            `;
        }

        hanziQuizState.writer = HanziWriter.create('hanziWritingArea', char, {
            width: 280,
            height: 280,
            padding: 20,
            renderer: 'canvas',
            strokeAnimationSpeed: 1,
            strokeHighlightSpeed: 2,
            delayBetweenStrokes: 100,
            showOutline: true,
            showCharacter: false,
            drawingColor: '#2c3e50',
            strokeColor: '#34495e',
            radicalColor: '#da5b30',
            highlightColor: '#e74c3c',
            drawingWidth: 3
        });

        const toggleBtn = document.getElementById('characterToggleBtn');
        if (toggleBtn) { toggleBtn.classList.add('showing'); toggleBtn.textContent = 'Hide Outline'; }

        hanziQuizState.writer.quiz({
            showHintAfterMisses: 1,
            acceptBackwardsStrokes: false,
            leniency: 2.0,
            onComplete: function() {
                if (hanziQuizState.currentCharacter) {
                    markCharacterQuizCompleted(hanziQuizState.currentCharacter);
                }
                hanziQuizState.currentCharIndex++;
                if (hanziQuizState.currentCharIndex < hanziQuizState.remainingChars.length) {
                    const nextChar = hanziQuizState.remainingChars[hanziQuizState.currentCharIndex];
                    startSequentialCharQuiz(nextChar, word);
                } else {
                    hanziQuizState.quizCompleted = true;
                    showQuizSuccessMessage();
                    setTimeout(async () => { await closeHanziQuiz(); }, 1200);
                }
            },
            onCorrectStroke: function(strokeData) { console.log('Correct stroke!', strokeData); },
            onMistake: function(strokeData) {
                const wa = document.getElementById('hanziWritingArea');
                if (wa) { wa.style.backgroundColor = '#ffeeee'; setTimeout(() => { wa.style.backgroundColor = 'white'; }, 300); }
                console.log('Mistake on stroke', strokeData);
            }
        });
    } catch (e) {
        console.error('Failed to start sequential quiz:', e);
    }
}

function showQuizSuccessMessage() {
    // Add a small corner badge inside the writing area; do not replace controls
    try {
        const writingArea = document.getElementById('hanziWritingArea');
        if (writingArea) {
            const existing = writingArea.querySelector('.quiz-success-badge');
            if (existing) existing.remove();
            const badge = document.createElement('div');
            badge.className = 'quiz-success-badge';
            badge.textContent = '✓';
            badge.style.position = 'absolute';
            badge.style.right = '8px';
            badge.style.top = '8px';
            badge.style.width = '22px';
            badge.style.height = '22px';
            badge.style.borderRadius = '50%';
            badge.style.background = 'linear-gradient(145deg, #4CAF50, #45a049)';
            badge.style.color = '#fff';
            badge.style.fontWeight = 'bold';
            badge.style.display = 'flex';
            badge.style.alignItems = 'center';
            badge.style.justifyContent = 'center';
            writingArea.appendChild(badge);
        }
    } catch (_) {}
    playSound('complete');
}

async function closeHanziQuiz() {
    // If writing is required and this quiz was auto-prompted for star, but not completed,
    // confirm with the user whether to award the star anyway or continue writing.
    if (gameSettings.ui.writingRequired && hanziQuizState.autoPopupPending && !hanziQuizState.quizCompleted && hanziQuizState.currentQuizWord) {
        const confirmExit = confirm('You have not finished the writing practice. Exit and award the star anyway?');
        if (!confirmExit) {
            // Stay in the quiz
            return;
        }
        // Award star without completing the quiz
        hanziQuizState.quizCompleted = true;
    }

    const modal = document.getElementById('hanziQuizModal');
    modal.classList.remove('active');
    
    // Clean up HanziWriter instance
    if (hanziQuizState.writer) {
        hanziQuizState.writer = null;
    }
    
    // Update checkmarks on option buttons
    updateAllCheckmarks();
    
    // Handle auto-popup case - continue with star progression
    if (hanziQuizState.autoPopupPending && hanziQuizState.quizCompleted && hanziQuizState.currentQuizWord) {
        const word = hanziQuizState.currentQuizWord;
        
        // Find the button for this word and trigger star progression
        const optionIndex = gameState.currentOptions.findIndex(opt => opt && opt.chinese === word.chinese);
        if (optionIndex !== -1) {
            const button = gameState.optionButtons[optionIndex];
            
            // Award star now that quiz is completed
            createStarAnimation(button);
            playStarShootAnimation();
            playSound('starShoot');
            queueMascotAnimation('celebrate');
            
            gameState.starsEarned++;
            gameState.completedWords++;
            updateUI();
            
            if (gameState.completedWords === gameState.selectedWords.length) {
                setTimeout(() => {
                    alert('Congratulations! You completed all words!');
                    // Clear the saved game state since game is completed
                    clearSavedGameState();
                    // Return to landing page
                    returnToMenu();
                }, 1000);
            } else {
                // Continue with normal game flow
                removeActiveCharacterOnly();
                addNewWordToRotation(word, optionIndex);
                
                // Save game state after character advancement
                await saveCurrentGameState();
            }
        }
    }
    
    // Reset quiz state
    hanziQuizState.quizCompleted = false;
    hanziQuizState.currentCharacter = null;
    hanziQuizState.currentQuizWord = null;
    hanziQuizState.autoPopupPending = false;
}

function showHanziHint() {
    if (hanziQuizState.writer) {
        hanziQuizState.writer.showCharacter();
        setTimeout(() => {
            hanziQuizState.writer.hideCharacter();
        }, 2000);
    }
}

function restartHanziQuiz() {
    if (hanziQuizState.writer) {
        // Cancel current quiz if running
        try { hanziQuizState.writer.cancelQuiz && hanziQuizState.writer.cancelQuiz(); } catch(_) {}
        
        // Reset quiz state
        hanziQuizState.quizCompleted = false;

        // Safer re-init: recreate the writer to avoid API differences
        const writingArea = document.getElementById('hanziWritingArea');
        if (writingArea) {
            writingArea.innerHTML = '';
            try {
                hanziQuizState.writer = HanziWriter.create('hanziWritingArea', hanziQuizState.currentCharacter, {
                    width: 280,
                    height: 280,
                    padding: 20,
                    renderer: 'canvas',
                    strokeAnimationSpeed: 1,
                    strokeHighlightSpeed: 2,
                    delayBetweenStrokes: 100,
                    showOutline: true,
                    showCharacter: false,
                    drawingColor: '#2c3e50',
                    strokeColor: '#34495e',
                    radicalColor: '#da5b30',
                    highlightColor: '#e74c3c',
                    drawingWidth: 3
                });
            } catch (_) {}
        }

        // Ensure toggle reflects outline shown
        const toggleBtn = document.getElementById('characterToggleBtn');
        if (toggleBtn) { toggleBtn.classList.add('showing'); toggleBtn.textContent = 'Hide Outline'; }

        // Start a new quiz
        hanziQuizState.writer.quiz({
            showHintAfterMisses: 1,
            acceptBackwardsStrokes: false,
            leniency: 2.0,
            onComplete: function() {
                hanziQuizState.quizCompleted = true;
                markCharacterQuizCompleted(hanziQuizState.currentQuizWord.chinese);
                
                showQuizSuccessMessage();
                
                setTimeout(async () => {
                    await closeHanziQuiz();
                }, 2000);
            },
            onCorrectStroke: function(strokeData) {
                console.log('Correct stroke!', strokeData);
            },
            onMistake: function(strokeData) {
                const writingArea = document.getElementById('hanziWritingArea');
                if (writingArea) {
                    writingArea.style.backgroundColor = '#ffeeee';
                    setTimeout(() => {
                        writingArea.style.backgroundColor = 'white';
                    }, 300);
                }
                console.log('Mistake on stroke', strokeData);
            }
        });
        
        console.log('Hanzi quiz restarted');
    }
}

function toggleCharacterDisplay() {
    if (hanziQuizState.writer) {
        const toggleBtn = document.getElementById('characterToggleBtn');
        const isShowing = toggleBtn.classList.contains('showing');
        
        if (isShowing) {
            // Hide outline only; never show full character bitmap over strokes
            hanziQuizState.writer.hideOutline();
            toggleBtn.classList.remove('showing');
            toggleBtn.textContent = 'Show Outline';
        } else {
            hanziQuizState.writer.showOutline();
            toggleBtn.classList.add('showing');
            toggleBtn.textContent = 'Hide Outline';
        }
    }
}

function markCharacterQuizCompleted(chineseText) {
    // Only store in session (not persistent) — for multi-char, add single characters
    if (!chineseText) return;
    if (chineseText.length === 1) {
        hanziQuizState.completedCharacters.add(chineseText);
    } else {
        Array.from(chineseText).forEach(ch => { if (ch.trim()) hanziQuizState.completedCharacters.add(ch); });
    }
    
    // Update checkmarks for all current buttons that contain this character
    const optionsGrid = document.getElementById('optionsGrid');
    if (optionsGrid) {
        const buttons = optionsGrid.querySelectorAll('.option-btn');
        buttons.forEach((button, index) => {
            const word = gameState.currentOptions[index];
            if (word && word.chinese === chineseText) {
                updateCheckmarkForButton(button, word);
            }
        });
    }
}

function loadCompletedQuizzes() {
    // Reset completions for each game session
    hanziQuizState.completedCharacters = new Set();
}

function isCharacterQuizCompleted(chineseText) {
    if (!chineseText) return false;
    const chars = Array.from(chineseText).filter(ch => ch.trim().length > 0);
    if (chars.length === 0) return false;
    if (chars.length === 1) return hanziQuizState.completedCharacters.has(chars[0]);
    return chars.every(ch => hanziQuizState.completedCharacters.has(ch));
}

function updateAllCheckmarks() {
    // Update checkmarks on all option buttons
    gameState.optionButtons.forEach((button, index) => {
        const word = gameState.currentOptions[index];
        if (word) {
            updateCheckmarkForButton(button, word);
        }
    });
}

function updateCheckmarkForButton(button, word) {
    // Remove existing checkmark
    const existingCheckmark = button.querySelector('.hanzi-checkmark');
    if (existingCheckmark) {
        existingCheckmark.remove();
    }
    
    // Hide checkmarks if writing is not required
    if (!gameSettings.ui.writingRequired) {
        return;
    }

    // Add new checkmark
    const checkmark = document.createElement('div');
    checkmark.className = 'hanzi-checkmark';
    
    if (isCharacterQuizCompleted(word.chinese)) {
        checkmark.classList.add('completed');
        checkmark.textContent = '✓';
    } else {
        checkmark.classList.add('incomplete');
        checkmark.textContent = '';
    }
    
    // Align checkmark to the end of the progress bar fill
    try {
        const bar = button.querySelector('.progress-bar');
        if (bar) {
            const fill = button.querySelector('.progress-fill');
            const barRect = bar.getBoundingClientRect();
            const btnRect = button.getBoundingClientRect();
            // Progress percent from inline style or width
            let widthPercent = 0;
            if (fill && fill.style.width.endsWith('%')) {
                widthPercent = parseFloat(fill.style.width);
            }
            const barWidth = barRect.width;
            const endXWithinBar = (widthPercent / 100) * barWidth; // px from bar left
            // Convert to button-relative left coordinate and nudge left by half checkmark width
            const leftPx = (barRect.left - btnRect.left) + endXWithinBar - 9; // 18px check size / 2
            checkmark.style.left = `${Math.max(10, Math.min(leftPx, btnRect.width - 28))}px`;
            checkmark.style.right = 'auto';
            // Attach to bottom region near progress bar
            checkmark.style.top = 'auto';
            checkmark.style.bottom = '2px';
        }
    } catch (_) {}
    
    button.appendChild(checkmark);
}

// Modified option button creation to include checkmarks
function createOptionButtonWithCheckmark(word, index) {
    const button = document.createElement('button');
    button.className = 'option-btn tier-bronze';
    
    if (word) {
        const progress = gameState.wordProgress[word.chinese];
        if (!progress) {
            gameState.wordProgress[word.chinese] = { count: 0, tier: 'bronze' };
        }
        
        const currentProgress = gameState.wordProgress[word.chinese];
        button.className = `option-btn tier-${currentProgress.tier}`;
        
        const displayText = gameSettings.ui.pinyinMode ? word.pinyin : word.english;
        
        button.innerHTML = `
            <span>${displayText}</span>
            <div class="progress-count">${currentProgress.count}/${gameState.tierRequirement}</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${(currentProgress.count % gameState.tierRequirement) * (100/gameState.tierRequirement)}%"></div>
            </div>
            <div class="hotkey">${gameState.hotkeys[index]}</div>
        `;
        
        // Apply adaptive text sizing
        applyAdaptiveTextSize(button);
        
        // Add checkmark
        updateCheckmarkForButton(button, word);
        // Fit text
        const span = button.querySelector('span');
        if (span) { fitTextToButton(button, span); }
        
        button.onclick = async () => await selectOption(index);
        gameState.currentOptions[index] = word;
    } else {
        button.innerHTML = `
            <span>---</span>
            <div class="hotkey">${gameState.hotkeys[index]}</div>
        `;
        button.style.opacity = '0.5';
        gameState.currentOptions[index] = null;
    }
    
    return button;
}