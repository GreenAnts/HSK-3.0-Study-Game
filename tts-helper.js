// =============================
// Web Audio TTS Module (Google Translate Fallbacks)
// =============================

const TTS = {
    state: {
        currentAudio: null,
        isPlaying: false,
        lastText: null,
        lastPlayTime: 0,
    },
    maxAttempts: 3,

    play(text) {
        if (!text) return;
        // Prevent spamming the same text too quickly
        const now = Date.now();
        if (this.state.lastText === text && now - this.state.lastPlayTime < 500) {
            console.log('Preventing duplicate TTS call for:', text);
            return;
        }
        this.state.lastText = text;
        this.state.lastPlayTime = now;

        this.stop(); // stop any previous audio
        this._attemptPlay(text, 0);
    },

    _attemptPlay(text, attempt) {
        if (attempt >= this.maxAttempts) {
            console.log(`TTS: All ${this.maxAttempts} attempts failed for:`, text);
            return;
        }

        const audio = new Audio();
        this.state.currentAudio = audio;
        this.state.isPlaying = true;

        let src;
        switch (attempt) {
            case 0:
                src = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=tw-ob&ttsspeed=0.8`;
                break;
            case 1:
                src = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=gtx&ttsspeed=0.8`;
                break;
            case 2:
                src = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=webapp&ttsspeed=0.8`;
                break;
        }

        audio.volume = (typeof gameSettings !== 'undefined' && gameSettings.tts?.volume != null)
            ? gameSettings.tts.volume
            : 0.8;
        audio.preload = 'none';
        audio.src = src;

        const cleanup = () => {
            this.state.isPlaying = false;
            if (this.state.currentAudio === audio) {
                this.state.currentAudio = null;
            }
        };

        audio.onerror = () => {
            console.log(`TTS: attempt ${attempt + 1} failed for text:`, text);
            cleanup();
            setTimeout(() => this._attemptPlay(text, attempt + 1), 200);
        };

        audio.onended = cleanup;

        audio.play().then(() => {
            console.log(`TTS: attempt ${attempt + 1} playing:`, text);
        }).catch(err => {
            console.log(`TTS: playback failed on attempt ${attempt + 1}:`, err);
            cleanup();
            setTimeout(() => this._attemptPlay(text, attempt + 1), 200);
        });
    },

    stop() {
        if (this.state.currentAudio) {
            try {
                this.state.currentAudio.pause();
                this.state.currentAudio.src = '';
            } catch {}
            this.state.currentAudio = null;
        }
        this.state.isPlaying = false;
    }
};

// Expose global API
window.playPronunciation = function (text) {
    if (!text || typeof gameSettings === 'undefined' || !gameSettings.tts?.enabled) return;
    TTS.play(text);
};

window.replayActiveCharacterAudio = function () {
    const active = (window.gameState?.charactersOnScreen?.[0] ?? null);
    if (active && active.word) {
        TTS.play(getChineseChar(active.word));
    }
};

window.checkChineseTTSAvailability = async function () {
    return { available: true, needsInstallation: false };
};
