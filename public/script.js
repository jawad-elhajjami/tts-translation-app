// DOM Elements
const voiceSelect = document.getElementById("voiceSelect");
const languageSelect = document.getElementById("languageSelect");
const playButton = document.getElementById("playButton");
const textInput = document.getElementById("textInput");
const clearButton = document.getElementById("clearButton");
const copyButton = document.getElementById("copyButton");
const darkModeToggle = document.getElementById("darkModeToggle");
const speedControl = document.getElementById("speedControl");
const pitchControl = document.getElementById("pitchControl");
let soundWave = document.getElementById("soundWave");
const htmlElement = document.documentElement;

// Array for supported languages with their ISO codes
const languages = [
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'Arabic' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh-TW', name: 'Traditional Chinese' }, 
];

// Dark mode functionality
function initDarkMode() {
    // Check for user preference
    if (localStorage.getItem('darkMode') === 'enabled' || 
        (localStorage.getItem('darkMode') !== 'disabled' && 
         window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
    }
    
    darkModeToggle.addEventListener('click', () => {
        if (htmlElement.classList.contains('dark')) {
            htmlElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'disabled');
        } else {
            htmlElement.classList.add('dark');
            localStorage.setItem('darkMode', 'enabled');
        }
    });
}

// Text area utility buttons functionality
function initTextareaButtons() {
    clearButton.addEventListener('click', () => {
        textInput.value = '';
        textInput.focus();
    });
    
    copyButton.addEventListener('click', () => {
        if (textInput.value) {
            navigator.clipboard.writeText(textInput.value)
                .then(() => {
                    // Show a quick notification or change the icon briefly
                    copyButton.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    `;
                    setTimeout(() => {
                        copyButton.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                        `;
                    }, 2000);
                });
        }
    });
}

// Show loading state with animation
function showLoading(bool) {
    if (bool) {
        playButton.disabled = true;
        playButton.classList.add('relative');
        playButton.innerHTML = `
            <div class="spinner"></div>
            <span class="opacity-0">Translating...</span>
        `;
    } else {
        playButton.disabled = false;
        playButton.classList.remove('relative');
        playButton.innerHTML = `
            <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Play Text</span>
                <div class="sound-wave ml-2" id="soundWave">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        soundWave = document.getElementById("soundWave"); // Re-assign after re-creating element
    }
}

// Show playing state with animation
function showPlaying(bool) {
    if (bool) {
        playButton.classList.add('playing');
        playButton.innerHTML = `
            <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                <span>Stop</span>
                <div class="sound-wave ml-2" id="soundWave">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        soundWave = document.getElementById("soundWave"); // Re-assign after re-creating element
    } else {
        playButton.classList.remove('playing');
        showLoading(false); // Reset to default state
    }
}

// Populate languages select box
function populateLanguages() {
    languageSelect.innerHTML = languages
        .map((language) =>
            `<option value=${language.code}>${language.name}</option>`
        )
        .join('');
}

// Load Available voices
let voices = [];
function load_voices() {
    voices = speechSynthesis.getVoices();
    voiceSelect.innerHTML = voices
        .map((voice, index) =>
            `<option value=${index}>${voice.name} (${voice.lang})</option>`
        )
        .join('');
}

// Translate text with serverless function
async function translateText(text, targetLang) {
    showLoading(true);
    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                target: targetLang
            })
        });
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        return data.data.translations[0].translatedText;
    } catch (error) {
        console.error('Translation Error: ', error);
        alert("Failed to translate text!");
        return text;
    } finally {
        showLoading(false);
    }
}

// TTS
function playText(text, voiceIndex, speed, pitch) {
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (voices[voiceIndex]) {
        utterance.voice = voices[voiceIndex];
    }
    
    utterance.rate = speed || 1;
    utterance.pitch = pitch || 1;
    
    // Show playing animation
    showPlaying(true);
    
    // Listen for the end of speech to reset button
    utterance.onend = () => {
        showPlaying(false);
    };
    
    // Listen for errors
    utterance.onerror = () => {
        showPlaying(false);
    };
    
    speechSynthesis.speak(utterance);
}

// Empty text error visual feedback
function showEmptyTextError() {
    playButton.classList.add('animate-pulse-slow');
    textInput.classList.add('ring-2', 'ring-red-400');
    setTimeout(() => {
        playButton.classList.remove('animate-pulse-slow');
        textInput.classList.remove('ring-2', 'ring-red-400');
    }, 1000);
}

// Initialize the application
function init() {
    // Initialize dark mode
    initDarkMode();
    
    // Initialize textarea buttons
    initTextareaButtons();
    
    // Populate languages
    populateLanguages();
    
    // Trigger loading voices when they become available
    speechSynthesis.onvoiceschanged = load_voices;
    load_voices();
    
    // Play button event listener
    playButton.addEventListener('click', async () => {
        const text = textInput.value.trim();
        const targetLang = languageSelect.value;
        const selectedVoiceIndex = voiceSelect.value;
        const speed = speedControl.value;
        const pitch = pitchControl.value;
        
        if (!text) {
            showEmptyTextError();
            return;
        }
        
        try {
            // Stop any currently playing speech
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
                showPlaying(false);
                return;
            }
            
            // Translate text
            const translatedText = await translateText(text, targetLang);
            
            // Play text with selected speed and pitch
            playText(translatedText, selectedVoiceIndex, speed, pitch);
        } catch (error) {
            console.error('Error during processing: ', error);
            alert("An error occurred!");
        }
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);