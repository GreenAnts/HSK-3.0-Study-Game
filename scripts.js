// Enhanced Game Settings with Audio Support
let gameSettings = {
    music: { enabled: false, volume: 0.15 },
    sfx: { enabled: true, volume: 0.7 },
    tts: { enabled: true, volume: 0.8 }, // ADD this line
    ui: { showPinyin: true, pinyinMode: false, easyMode: false, traditional: false },
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
            console.log(`Loaded ${hskWords.length} words from HSK Band ${band}`);
            
            const allWordsButton = document.getElementById('allWordsButton');
            if (allWordsButton) {
                allWordsButton.textContent = `All Words (Band ${band})`;
            }
            
            const maxWords = hskWords.length;
            document.getElementById('startInput').max = maxWords;
            document.getElementById('endInput').max = maxWords;
            document.getElementById('endInput').value = Math.min(50, maxWords);
            updateRange();
            
            return true;
        } else {
            throw new Error(`Band ${band} not available or empty`);
        }
    } catch (error) {
        console.error('Failed to load HSK words:', error);
        hskWords = hskBands[1] || [];
        console.log('Using fallback wordlist');
        return false;
    }
}

// Helper function to get Chinese character (simplified or traditional)
function getChineseChar(word) {
    return useTraditional && word.traditional ? word.traditional : word.chinese;
}

// Enhanced TTS with better mobile support and fallbacks
function playPronunciation(text) {
    if (!text || !gameSettings.tts.enabled) return;
    
    // Prevent duplicate TTS calls for same text within 500ms
    const now = Date.now();
    if (ttsState.lastText === text && now - ttsState.lastPlayTime < 500) {
        console.log('Preventing duplicate TTS call for:', text);
        return;
    }
    
    // Stop any currently playing TTS
    stopCurrentTTS();
    
    // Use multiple fallback strategies for mobile
    playTTSWithFallbacks(text, 0);
    ttsState.lastText = text;
    ttsState.lastPlayTime = now;
}

function playTTSWithFallbacks(text, attemptNumber) {
    const maxAttempts = 3;
    if (attemptNumber >= maxAttempts) {
        console.log('All TTS attempts failed for:', text);
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
            console.log(`TTS attempt ${attemptNumber + 1} failed:`, e);
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
            console.log(`TTS attempt ${attemptNumber + 1} loaded successfully`);
        };
        
        // Mobile browsers need user interaction, so ensure we have it
        audio.src = ttsUrl;
        
        // Add timestamp to prevent caching
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`TTS started successfully on attempt ${attemptNumber + 1}`);
            }).catch(err => {
                console.log(`TTS play failed on attempt ${attemptNumber + 1}:`, err);
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
        console.log(`TTS creation failed on attempt ${attemptNumber + 1}:`, error);
        ttsState.isPlaying = false;
        // Try next fallback, but only if we haven't been stopped
        setTimeout(() => {
            playTTSWithFallbacks(text, attemptNumber + 1);
        }, 200);
    }
}

// Add function to stop current TTS
function stopCurrentTTS() {
    if (ttsState.currentAudio) {
        try {
            ttsState.currentAudio.pause();
            ttsState.currentAudio.src = '';
        } catch (error) {
            console.log('Error stopping TTS:', error);
        }
        ttsState.currentAudio = null;
    }
    ttsState.isPlaying = false;
}

// Function to replay audio for the active character
function replayActiveCharacterAudio() {
    if (gameState.charactersOnScreen.length > 0 && gameSettings.tts.enabled) {
        const activeCharacter = gameState.charactersOnScreen[0];
        if (activeCharacter && activeCharacter.word) {
            // Check if TTS is currently playing to prevent spam
            if (ttsState.isPlaying) {
                console.log('TTS already playing, ignoring replay request');
                return;
            }
            
            console.log('Replaying audio for active character:', activeCharacter.word.chinese);
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
        
        console.log('Click handler set up for active character:', activeContainer.querySelector('.chinese-char')?.textContent);
    }
}

// Separate click handler for better debugging and control
function handleCharacterClick(event) {
    console.log('Active character clicked!', event.target);
    event.preventDefault();
    event.stopPropagation();
    replayActiveCharacterAudio();
}

// Helper to get display name for audio hotkey
function getAudioHotkeyDisplayName() {
    if (gameState.audioHotkey === ' ') return 'SPACEBAR';
    else if (gameState.audioHotkey === 'Enter') return 'ENTER';
    else if (gameState.audioHotkey === 'Tab') return 'TAB';
    else return gameState.audioHotkey.toUpperCase();
}

// Add TTS reset function for mobile issues
function resetTTSSystem() {
    console.log('Resetting TTS system for mobile stability');
    
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
            console.log('Error cleaning up TTS element:', error);
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
}

function adjustTTSVolume() {
    const slider = document.getElementById('ttsVolume');
    const label = document.getElementById('ttsVolumeText');
    
    gameSettings.tts.volume = slider.value / 100;
    label.textContent = `${slider.value}%`;
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
            console.log('Background music is ready to play');
        });
        
        bgMusic.addEventListener('error', (e) => {
            console.log('Background music error:', e);
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
                    console.log('Background music started successfully');
                }).catch(error => {
                    console.log('Music play failed (likely due to browser autoplay policy):', error);
                    // Show user feedback that they need to interact first
                    if (error.name === 'NotAllowedError') {
                        console.log('User interaction required for music playback');
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
}

function adjustSFXVolume() {
    const slider = document.getElementById('sfxVolume');
    const label = document.getElementById('sfxVolumeText');
    
    gameSettings.sfx.volume = slider.value / 100;
    label.textContent = `${slider.value}%`;
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
            console.log('Invalid frequencies for sound type:', type);
            return;
        }
        
        frequencies.forEach((frequency, index) => {
            // ... rest of function stays the same
        });
        
    } catch (error) {
        console.log('Sound synthesis failed:', error);
    }
}

function playClickSound() {
    if (!gameSettings.sfx.enabled || !clickAudio) return;
    
    try {
        clickAudio.volume = gameSettings.sfx.volume * 0.3;
        clickAudio.currentTime = 0; // Reset to beginning
        clickAudio.play().catch(err => {
            console.log('Click sound failed:', err);
        });
    } catch (error) {
        console.log('Click sound playback failed:', error);
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
    updateRange();
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
                    console.log('Background music enabled after user interaction');
                    musicInteractionHandled = true;
                }).catch(e => console.log('Music still failed after user interaction:', e));
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
            console.log('Blocking ouch animation because sad animation is active');
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
        console.log(`Blocking ${animationType} animation because sad animation is active`);
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
            console.log('Sad animation completed, clearing sadAnimationActive flag');
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
            }
        }
    });
}

function toggleEasyMode() {
    gameState.easyMode = !gameState.easyMode;
    gameSettings.ui.easyMode = gameState.easyMode;
    updateSettingsToggles();
}

function toggleTraditional() {
    useTraditional = !useTraditional;
    gameSettings.ui.traditional = useTraditional;
    updateSettingsToggles();
    updateCharacterDisplay();
}

function updateCharacterDisplay() {
    // Update all visible characters in real-time
    gameState.charactersOnScreen.forEach(char => {
        const chineseCharElement = char.element.querySelector('.chinese-char');
        if (chineseCharElement) {
            chineseCharElement.textContent = getChineseChar(char.word);
        }
        
        // Recalculate container width if needed
        const chineseText = getChineseChar(char.word);
        const estimatedWidth = Math.max(120, chineseText.length * 30 + 40);
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
    
    if (gameState.easyMode) {
        easyToggle?.classList.add('active');
    } else {
        easyToggle?.classList.remove('active');
    }
    
    if (useTraditional) {
        traditionalToggle?.classList.add('active');
    } else {
        traditionalToggle?.classList.remove('active');
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

function selectOption(optionIndex) {
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
        
        handleCorrectAnswer(selectedWord, button, optionIndex);
        gameState.alreadyPenalized = false;
    } else {
        gameState.streakCount = 0;
        handleIncorrectAnswer(activeCharacter.word, optionIndex);
        
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

function handleCorrectAnswer(word, button, optionIndex) {
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
        // Word completed - earn star
        createStarAnimation(button);
        playStarShootAnimation();
        playSound('starShoot');
        queueMascotAnimation('celebrate');
        
        gameState.starsEarned++;
        gameState.completedWords++;
        updateUI();
        
        if (gameState.completedWords === gameState.selectedWords.length) {
            setTimeout(() => alert('Congratulations! You completed all words!'), 1000);
            return;
        }
        
        // Remove ONLY the active character, then add new word to rotation
        removeActiveCharacterOnly();
        addNewWordToRotation(word, optionIndex);
        
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
        <div class="pinyin${gameSettings.ui.showPinyin ? '' : ' hidden'}">${word.pinyin}</div>
        <div class="chinese-char">${getChineseChar(word)}</div>
    `;
    
    const chineseText = getChineseChar(word);
    const estimatedWidth = Math.max(120, chineseText.length * 30 + 40);
    container.style.width = `${estimatedWidth}px`;
    
    const charactersRow = document.getElementById('charactersRow');
    charactersRow.appendChild(container);
    gameState.charactersOnScreen.push({ element: container, word: word, width: estimatedWidth });
    
    // Reposition characters
    positionCharacterContainers();
    
    // Play pronunciation for new active character
    setTimeout(() => playPronunciation(getChineseChar(gameState.charactersOnScreen[0].word)), 300);
}

function handleIncorrectAnswer(correctWord, selectedOptionIndex) {
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
        }
    } else {
        // Easy mode or already penalized - just play ouch
        queueMascotAnimation('ouch');
    }
    
    playSound('incorrect');
}

// Game Initialization System
function initializeGame() {
    console.log('=== INITIALIZING FRESH GAME ===');
    
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
    
    console.log('State after reset:', {
        activeWordIndex: gameState.activeWordIndex,
        charactersOnScreen: gameState.charactersOnScreen.length,
        currentWords: gameState.currentWords.length
    });
    
    // Re-setup keyboard listeners
    setupKeyboardListeners();
    
    // Initialize components in strict order
    setupCharactersRow();
    setupOptionsGrid();
    
    // VERIFY synchronization after setup
    console.log('State after setup:', {
        activeWordIndex: gameState.activeWordIndex,
        charactersOnScreen: gameState.charactersOnScreen.length,
        optionButtons: gameState.optionButtons.length,
        activeWord: gameState.charactersOnScreen[0]?.word.chinese,
        firstOption: gameState.currentOptions[0]?.chinese
    });
    
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
                    console.log('Background music started successfully in game');
                }).catch(e => {
                    console.log('Background music failed to start:', e);
                    // If it fails here, the file might not exist or be corrupted
                });
            }
        }
    }
    
    console.log('=== GAME INITIALIZATION COMPLETE ===');
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
            <div class="pinyin${gameSettings.ui.showPinyin ? '' : ' hidden'}">${word.pinyin}</div>
            <div class="chinese-char">${getChineseChar(word)}</div>
        `;
        
        
        // Calculate container width based on content
        const chineseText = getChineseChar(word);
        const estimatedWidth = Math.max(120, chineseText.length * 30 + 40);
        container.style.width = `${estimatedWidth}px`;
        
        charactersRow.appendChild(container);
        gameState.charactersOnScreen.push({ element: container, word: word, width: estimatedWidth });
    }
    
    // Position all character containers
    positionCharacterContainers();
    
    // Set up click handler for active character
    setupActiveCharacterClickHandler();
}

function getRandomCurrentWord() {
    return gameState.currentWords[Math.floor(Math.random() * gameState.currentWords.length)];
}

function setupOptionsGrid() {
    const optionsGrid = document.getElementById('optionsGrid');
    
    // Preserve the voice button before cleanup
    const voiceButton = document.getElementById('voiceReplayBtn');
    
    // Complete cleanup
    optionsGrid.innerHTML = '';
    gameState.optionButtons = [];
    gameState.currentOptions = [];
    
    // Re-add the voice button after cleanup
    if (voiceButton) {
        optionsGrid.appendChild(voiceButton);
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
            
            button.onclick = () => selectOption(i);
            gameState.currentOptions[i] = word;
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
        } else if (index <= 2) {
            container.classList.add('next');
            container.style.transform = isMobile ? 
                'translateX(-50%) scale(0.8)' : 
                'translateX(-50%) scale(1.0)';
            container.style.zIndex = '5';
            container.style.pointerEvents = 'none'; // Prevent interference with active character clicks
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
        const mascotPosY = charactersRow.offsetTop + (charactersRow.offsetHeight / 2) - 130; // Much higher up (top can be cut off)
        
        mascotContainer.style.left = `${mascotPosX}px`;
        mascotContainer.style.top = `${mascotPosY}px`;
        mascotContainer.style.transform = 'translate(-50%, -50%)'; // Center the mascot on its position
        // z-index is handled by CSS (0 - behind all characters)
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
            <div class="pinyin${gameSettings.ui.showPinyin ? '' : ' hidden'}">${word.pinyin}</div>
            <div class="chinese-char">${getChineseChar(word)}</div>
        `;
        
        const chineseText = getChineseChar(word);
        const estimatedWidth = Math.max(120, chineseText.length * 30 + 40);
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
    
    // Clear and rebuild hotkey settings in numpad layout
    settingsContainer.innerHTML = '';
    
    // Numpad layout order: 7,8,9,4,5,6,1,2,3,0
    const numpadOrder = [6, 7, 8, 3, 4, 5, 0, 1, 2, 9]; // Map to hotkey array indices
    
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
    
    updateSettingsToggles();
    modal.style.display = 'block';
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
        console.log('Audio hotkey updated to:', displayKey);
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
    gameKeydownHandler = (event) => {
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
                selectOption(optionIndex);
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
        const newWord = availableWords[Math.floor(Math.random() * availableWords.length)];
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
        const word = getRandomCurrentWord();
        const container = document.createElement('div');
        container.className = 'character-container upcoming';
        container.innerHTML = `
            <div class="pinyin${gameSettings.ui.showPinyin ? '' : ' hidden'}">${word.pinyin}</div>
            <div class="chinese-char">${getChineseChar(word)}</div>
        `;
        
        const chineseText = getChineseChar(word);
        const estimatedWidth = Math.max(120, chineseText.length * 30 + 40);
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
function updateRange() {
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
    
    const totalSelected = end - start + 1;
    
    // Update display values
    document.getElementById('startValue').textContent = start;
    document.getElementById('endValue').textContent = end;
    document.getElementById('totalWords').textContent = totalSelected;
    
    // Update progress bar
    const progressFill = document.getElementById('rangeProgressFill');
    const progressText = document.getElementById('rangeProgressText');
    
    if (progressFill && progressText) {
        const percentage = (totalSelected / maxWords) * 100;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${totalSelected} / ${maxWords} words`;
    }
}

function toggleRandomize() {
    randomizeWords = !randomizeWords;
    const checkbox = document.getElementById('randomizeCheckbox');
    
    if (randomizeWords) {
        checkbox.classList.add('checked');
    } else {
        checkbox.classList.remove('checked');
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
    
    // Select words for the game
    let selectedWords = hskWords.slice(startIndex - 1, endIndex);
    
    // Randomize if option is selected
    if (randomizeWords) {
        selectedWords = shuffleArray([...selectedWords]);
    }
    
    gameState.selectedWords = selectedWords;
    gameState.currentWords = gameState.selectedWords.slice(0, Math.min(10, gameState.selectedWords.length));
    
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
function saveGameState() {
    savedGameState = {
        selectedWords: [...gameState.selectedWords],
        currentWords: [...gameState.currentWords],
        activeWordIndex: gameState.activeWordIndex,
        wordProgress: JSON.parse(JSON.stringify(gameState.wordProgress)),
        starsEarned: gameState.starsEarned,
        completedWords: gameState.completedWords,
        streakCount: gameState.streakCount,
        lastAnswerTime: gameState.lastAnswerTime,
        alreadyPenalized: gameState.alreadyPenalized,
        tierRequirement: gameState.tierRequirement,
        hotkeys: [...gameState.hotkeys],
        audioHotkey: gameState.audioHotkey,
        easyMode: gameState.easyMode,
        // Save additional game settings
        gameSettings: JSON.parse(JSON.stringify(gameSettings)),
        currentBand: currentBand,
        useTraditional: useTraditional
    };
    console.log('Game state saved for resume');
}

// Resume game from saved state
function resumeGame() {
    if (!savedGameState) {
        console.error('No saved game state to resume');
        return false;
    }
    
    console.log('Resuming saved game state');
    
    // Restore game state
    gameState.selectedWords = [...savedGameState.selectedWords];
    gameState.currentWords = [...savedGameState.currentWords];
    gameState.activeWordIndex = savedGameState.activeWordIndex;
    gameState.wordProgress = JSON.parse(JSON.stringify(savedGameState.wordProgress));
    gameState.starsEarned = savedGameState.starsEarned;
    gameState.completedWords = savedGameState.completedWords;
    gameState.streakCount = savedGameState.streakCount;
    gameState.lastAnswerTime = savedGameState.lastAnswerTime;
    gameState.alreadyPenalized = savedGameState.alreadyPenalized;
    gameState.tierRequirement = savedGameState.tierRequirement;
    gameState.hotkeys = [...savedGameState.hotkeys];
    gameState.audioHotkey = savedGameState.audioHotkey || ' '; // Default to space if not saved
    gameState.easyMode = savedGameState.easyMode;
    
    // Restore settings
    gameSettings = JSON.parse(JSON.stringify(savedGameState.gameSettings));
    currentBand = savedGameState.currentBand;
    useTraditional = savedGameState.useTraditional;
    
    // Update UI
    document.getElementById('totalStarsCount').textContent = gameState.selectedWords.length;
    document.getElementById('starsCount').textContent = gameState.starsEarned;
    
    // Switch to game page
    document.getElementById('landingPage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'flex';
    
    // Initialize game
    initializeGame();
    
    return true;
}

// Enhanced Return to Menu with Complete Cleanup
function returnToMenu() {
    console.log('=== RETURNING TO MENU WITH GAME STATE PRESERVATION ===');
    
    // Save current game state for potential resume
    if (gameState.selectedWords.length > 0) {
        saveGameState();
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
        console.log('Audio cleanup error:', error);
    }

    try {
        // Reset TTS system for mobile
        resetTTSSystem();
        
        // Clear any TTS-related timeouts
        for (let i = 1; i < 10000; i++) {
            clearTimeout(i);
        }
    } catch (error) {
        console.log('TTS cleanup error:', error);
    }
    
    // THOROUGH DOM cleanup
    try {
        const optionsGrid = document.getElementById('optionsGrid');
        if (optionsGrid) {
            // Preserve the voice button before cleanup
            const voiceButton = document.getElementById('voiceReplayBtn');
            
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
            
            // Re-add the voice button after cleanup
            if (voiceButton) {
                optionsGrid.appendChild(voiceButton);
            }
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
        console.log('DOM cleanup error:', error);
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
    for (let i = 1; i < 50000; i++) {
        clearTimeout(i);
        clearInterval(i);
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
    
    console.log('=== STATE CLEANUP COMPLETE ===');
    
    // Switch to landing page
    document.getElementById('gamePage').style.display = 'none';
    document.getElementById('landingPage').style.display = 'flex';
    
    // Show resume button if we have a saved game
    const resumeButton = document.getElementById('resumeButton');
    if (savedGameState && resumeButton) {
        resumeButton.style.display = 'inline-block';
    }
    
    console.log('=== RETURNED TO MENU SUCCESSFULLY ===');
}

// Band Selection
async function changeBand() {
    const bandSelector = document.getElementById('bandSelector');
    const selectedBand = parseInt(bandSelector.value);
    
    // Show loading message
    const startButtons = document.querySelectorAll('.start-button');
    startButtons.forEach(btn => {
        btn.disabled = true;
        btn.textContent = 'Loading...';
    });
    
    // Load the selected band
    const success = await loadHSKWords(selectedBand);
    
    // Re-enable buttons
    startButtons.forEach((btn, index) => {
        btn.disabled = false;
        btn.textContent = index === 0 ? 'Start Game' : `All Words (Band ${selectedBand})`;
    });
    
    if (success) {
        currentBand = selectedBand;
    } else {
        // Reset selector if loading failed
        bandSelector.value = currentBand;
        alert(`Failed to load Band ${selectedBand} wordlist. Using Band ${currentBand}.`);
    }
}
// App Initialization
async function initializeApp() {
    // Load Band 1 by default
    await loadHSKWords(1);
    updateRange();
    
    // Initialize audio systems
    initializeBackgroundMusic();
    setupIdleDetection();
    
    // Preload click audio
    try {
        clickAudio = new Audio('Sounds/click.mp3');
        clickAudio.preload = 'auto';
    } catch (error) {
        console.log('Failed to preload click audio:', error);
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

    console.log('App initialized with enhanced audio and UI support');
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
            console.log('Window resized, repositioning characters and mascot');
            positionCharacterContainers();
            setupActiveCharacterClickHandler(); // Ensure click handlers are still working
            resizeTimeout = null;
        }, 150); // 150ms throttle for smooth performance
    }
}

// Initialize range values on page load
updateRange();

// Load default wordlist when page loads
window.addEventListener('DOMContentLoaded', initializeApp);
