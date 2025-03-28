if(process.env.NODE_ENV !== "production"){
    (async () => {
        const dotenv = await import('dotenv');
        dotenv.config();
    })()
}

export default async function handler(req, res){
    if(req.method !== "POST"){
        return res.status(405).json({error:"Method not allowed!"})
    }

    const { text, lang, speed = 1, pitch = 1 } = req.body;

    if(!text || !lang){
        return res.status(405).json({error:"Missing text or target language !"})
    }

    const apiKey = process.env.GOOGLE_TEXT2SPEECH_API_KEY;
    const apiUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

    try {
        const response = await fetch(apiUrl, {
            method:'POST',
            headers:{
                'Content-Type':'application/json',
            },
            body:JSON.stringify({
                input: { text },
                voice: { languageCode: lang },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: parseFloat(speed),
                    pitch: parseFloat(pitch)
                }
            })
        });
        
        if(!response.ok){
            const errorText = await response.text();
            console.error('Google API error:', errorText);
            return res.status(response.status).json({error: errorText});
        }
        
        // Parse the JSON response
        const data = await response.json();
        
        // Extract the base64 audio content
        const audioContent = data.audioContent;
        
        if (!audioContent) {
            return res.status(500).json({error: "No audio content returned from Google API"});
        }
        
        // Convert base64 to buffer
        const audioBuffer = Buffer.from(audioContent, 'base64');
        
        // Set headers for binary audio response
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="speech-${lang}-${Date.now()}.mp3"`);
        
        // Send the binary audio data
        res.send(audioBuffer);
    } catch (error) {
        console.error('Error generating speech with Google Cloud TTS:', error);
        res.status(500).send(error);
    }
}