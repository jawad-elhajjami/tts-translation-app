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

// Audio control
let currentAudio = null;

// Array for supported languages with their ISO codes
const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'ar-XA', name: 'Arabic' },
    { code: 'fr-FR', name: 'French' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'cmn-TW', name: 'Chinese (Traditional)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'hi-IN', name: 'Hindi' }
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
            `<option value="${language.code}">${language.name}</option>`
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
                target: targetLang.split('-')[0] // Extract the language code without region
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

// Get audio from Google TTS API and play it
async function playGoogleTTS(text, lang, speed = 1, pitch = 1) {
    try {
        // Show playing animation
        showPlaying(true);
        
        // Stop any currently playing audio
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        
        // Fetch audio from the Google TTS API
        const response = await fetch('/api/speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text,
                lang,
                speed,
                pitch
            })
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }
        
        // Get the audio blob
        const audioBlob = await response.blob();
        
        // Create object URL for the audio
        const audioURL = URL.createObjectURL(audioBlob);
        
        // Create audio element and play
        const audio = new Audio(audioURL);
        currentAudio = audio;
        
        // Set up event listeners
        audio.onended = () => {
            showPlaying(false);
            URL.revokeObjectURL(audioURL);
            
            // Show download button after playback
            showDownloadButton(audioBlob, lang);
        };
        
        audio.onerror = () => {
            console.error('Audio playback error');
            showPlaying(false);
            URL.revokeObjectURL(audioURL);
        };
        
        // Play the audio
        audio.play();
        
    } catch (error) {
        console.error('TTS Error: ', error);
        showPlaying(false);
        alert("Failed to play audio!");
    }
}

// Show download button for audio
function showDownloadButton(audioBlob, lang) {
    // Create a container for the download button if it doesn't exist
    let downloadContainer = document.getElementById('downloadContainer');
    if (!downloadContainer) {
        downloadContainer = document.createElement('div');
        downloadContainer.id = 'downloadContainer';
        downloadContainer.className = 'mt-4';
        playButton.parentNode.insertBefore(downloadContainer, playButton.nextSibling);
    }
    
    // Create URL for download
    const downloadURL = URL.createObjectURL(audioBlob);
    
    // Prepare filename with date for uniqueness
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `speech-${lang}-${date}.mp3`;
    
    // Set the HTML content for the download container
    downloadContainer.innerHTML = `
        <a href="${downloadURL}" download="${filename}" 
           class="w-full bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 
                  text-white font-medium py-3 px-4 rounded-xl focus:outline-none focus:ring-2 
                  focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 
                  btn-transition shadow-lg shadow-green-500/20 dark:shadow-green-700/20 
                  flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Download Audio</span>
        </a>
    `;
    
    // Add event listener to clean up URL after download
    downloadContainer.querySelector('a').addEventListener('click', () => {
        setTimeout(() => {
            URL.revokeObjectURL(downloadURL);
        }, 100);
    });
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
                currentAudio = null;
                showPlaying(false);
                return;
            }
            
            // Remove download button if it exists
            const downloadContainer = document.getElementById('downloadContainer');
            if (downloadContainer) {
                downloadContainer.remove();
            }
            
            // Translate text
            const translatedText = await translateText(text, targetLang);
            
            // Play text using Google TTS API
            await playGoogleTTS(translatedText, targetLang, speed, pitch);
            
        } catch (error) {
            console.error('Error during processing: ', error);
            alert("An error occurred!");
        }
    });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);