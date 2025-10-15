import { registerPlugin } from '@capacitor/core';
const TextToSpeech = registerPlugin('TextToSpeech', {
    web: () => import('./web').then((m) => new m.TextToSpeechWeb()),
});
// Warm up
if ('speechSynthesis' in window) {
    window.speechSynthesis;
}
export * from './definitions';
export { TextToSpeech };
//# sourceMappingURL=index.js.map