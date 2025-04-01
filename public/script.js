// DOM Elements
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
const downloadBtnContainer = document.getElementById("download_btn_container");

// Audio control
let currentAudio = null;

// Languages supported by AWS Translate and Polly
const languages = [
    { code: 'en', name: 'English (US)', voiceCode: 'en-US' },
    { code: 'en', name: 'English (UK)', voiceCode: 'en-GB' },
    { code: 'fr', name: 'French', voiceCode: 'fr-FR' },
    { code: 'es', name: 'Spanish', voiceCode: 'es-ES' },
    { code: 'de', name: 'German', voiceCode: 'de-DE' },
    { code: 'it', name: 'Italian', voiceCode: 'it-IT' },
    { code: 'pt', name: 'Portuguese (Brazil)', voiceCode: 'pt-BR' },
    { code: 'ar', name: 'Arabic', voiceCode: 'arb' },
    { code: 'ja', name: 'Japanese', voiceCode: 'ja-JP' },
    { code: 'hi', name: 'Hindi', voiceCode: 'hi-IN' },
    { code: 'ko', name: 'Korean', voiceCode: 'ko-KR' },
    { code: 'zh', name: 'Chinese (Mandarin)', voiceCode: 'cmn-CN' },
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
            <span class="opacity-0">Processing...</span>
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
    // Create a set of unique language codes for selection
    const uniqueLanguages = [];
    const seenCodes = new Set();
    
    languages.forEach(lang => {
        // Only add the first occurrence of each language code
        if (!seenCodes.has(lang.code)) {
            uniqueLanguages.push(lang);
            seenCodes.add(lang.code);
        }
    });
    
    languageSelect.innerHTML = uniqueLanguages
        .map((language) =>
            `<option value="${language.code}">${language.name}</option>`
        )
        .join('');
}

// Translate text using AWS Translate API
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
        return data.data?.translations?.[0]?.translatedText || text;
    } catch (error) {
        console.error('Translation Error:', error);
        alert("Failed to translate text! Using original text instead.");
        return text;
    } finally {
        showLoading(false);
    }
}

// Function to handle audio playback and download
async function showDownloadButton(text, lang, speed = 1, pitch = 1) {
    try {
        // Match the language format to your speech.js
        const languageCode = languages.find(l => l.code === lang)?.voiceCode || lang;
        
        // For debugging
        console.log("Calling speech API with:", {
            text,
            lang: languageCode,
            speed,
            pitch
        });
        
        // Show playing animation
        showPlaying(true);
        
        // Fetch the speech from the AWS Polly API
        const response = await fetch('/api/speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                lang: languageCode, // Use the language code that matches speech.js
                speed,
                pitch
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Speech API error:", errorText);
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        
        // Get the audio blob
        const audioBlob = await response.blob();
        
        // Create URL for the blob
        const audioURL = URL.createObjectURL(audioBlob);
        
        // Create audio element and play it
        const audio = new Audio(audioURL);
        currentAudio = audio;
        
        // Set up event listeners
        audio.onended = () => {
            showPlaying(false);
        };
        
        audio.onerror = (error) => {
            console.error('Audio playback error:', error);
            showPlaying(false);
        };
        
        // Play the audio
        await audio.play();
        
        // Create the download button
        downloadBtnContainer.innerHTML = `
            <a href="${audioURL}" 
               class="mt-6 w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 
                     text-white font-medium py-4 px-4 rounded-xl focus:outline-none focus:ring-2 
                     focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 
                     btn-transition shadow-lg shadow-green-500/20 dark:shadow-green-700/20 
                     flex items-center justify-center" 
               download="TTS-${languageCode}-${Math.random().toString(36).substring(2, 8)}.mp3">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               Download Audio
            </a>
        `;
        
        // Clean up the URL when the download is complete
        downloadBtnContainer.querySelector('a').addEventListener('click', () => {
            setTimeout(() => {
                URL.revokeObjectURL(audioURL);
            }, 100);
        });
        
    } catch (error) {
        console.error('TTS Error:', error);
        showPlaying(false);
        alert("Failed to generate audio! Please check console for details.");
    }
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
    
    // Play button event listener
    playButton.addEventListener('click', async () => {
        const text = textInput.value.trim();
        const targetLang = languageSelect.value;
        const speed = speedControl.value;
        const pitch = pitchControl.value;
        
        if (!text) {
            showEmptyTextError();
            return;
        }
        
        try {
            // If audio is already playing, stop it
            if (currentAudio && !currentAudio.paused) {
                currentAudio.pause();
                currentAudio.src = '';
                currentAudio = null;
                showPlaying(false);
                return;
            }
            
            // Clear the download button container
            downloadBtnContainer.innerHTML = '';
            
            // Translate text
            const translatedText = await translateText(text, targetLang);
            
            // Get the speech and show download button
            await showDownloadButton(translatedText, targetLang, speed, pitch);
            
        } catch (error) {
            console.error('Error during processing:', error);
            alert("An error occurred!");
        }
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);