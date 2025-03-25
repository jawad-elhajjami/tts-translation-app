        const voiceSelect = document.getElementById("voiceSelect");
        const languageSelect = document.getElementById("languageSelect");
        const playButton = document.getElementById("playButton");
        const textInput = document.querySelector("textarea");

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

        // Populate languages select box
        languageSelect.innerHTML = languages
            .map((language) =>
                `<option value=${language.code}>${language.name}</option>`
            )
            .join('');

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

        // Trigger loading voices when they become available
        speechSynthesis.onvoiceschanged = load_voices;
        load_voices();

        // Translate text with serverless function
        async function translateText(text, targetLang){
            try {
                const response = await fetch('/api/translate',{
                    method:'POST',
                    headers:{
                        'Content-Type':'application/json'
                    },
                    body: JSON.stringify({
                        text,
                        target: targetLang
                    })
                })
                if(!response.ok){
                    throw new Error(`Error ${response.status}: ${await response.text()}`);
                }
                const data = await response.json();
                return data.data.translations[0].translatedText
            } catch (error) {
                console.error('Translation Error: ', error)
                alert("Failed to translate text !");
                return text;
            }
        }
        
        // TTS
        function playText(text, voiceIndex){
            const utterance = new SpeechSynthesisUtterance(text);
            if(voices[voiceIndex]){
                utterance.voice = voices[voiceIndex]
            }
            speechSynthesis.speak(utterance)
        }

        // Play TTS
        playButton.addEventListener('click', async () => {
            const text = textInput.value.trim()
            const targetLang = languageSelect.value;
            const selectedVoiceIndex = voiceSelect.value;

            if(!text){
                alert('Please enter some text !')
                return;
            }

            try {
                // Translate text
                const translatedText = await translateText(text, targetLang)
                //Play text
                playText(translatedText, selectedVoiceIndex)
            } catch (error) {
                console.error('Error during processing : ', error)
                alert("An error occured !")
            }
        });