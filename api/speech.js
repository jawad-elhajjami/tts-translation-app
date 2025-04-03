// AWS Polly endpoint
import AWS from 'aws-sdk';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed!"})
  }

  // Extract parameters from request body
  const { text, lang, speed = 1, pitch = 1 } = req.body;

  if (!text) {
    return res.status(400).json({error: "Missing text!"})
  }

  console.log("Received request:", { text, lang, speed, pitch });

  try {
    // Configure AWS
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    const polly = new AWS.Polly();
    
    // Get voice ID based on language
    const voiceId = getPollyVoiceForLanguage(lang);
    
    console.log("Using voice:", voiceId);
    
    // Create SSML with rate (speed) and pitch adjustments - careful with special characters
    const cleanText = text.replace(/[<>&]/g, (c) => {
      return c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;';
    });
    
    const rate = speed < 0.9 ? 'slow' : speed > 1.1 ? 'fast' : 'medium';
    const pitchValue = Math.round((pitch - 1) * 100);
    const pitchStr = pitchValue >= 0 ? `+${pitchValue}%` : `${pitchValue}%`;
    
    const ssml = `<speak><prosody rate="${rate}" pitch="${pitchStr}">${cleanText}</prosody></speak>`;
    
    console.log("SSML:", ssml);
    
    // First try with standard engine - more reliable
    let params = {
      Text: ssml,
      TextType: 'ssml',
      OutputFormat: 'mp3',
      VoiceId: voiceId,
      Engine: 'standard'
    };
    
    console.log("Requesting speech synthesis with params:", params);
    
    const pollyResult = await polly.synthesizeSpeech(params).promise();
    
    // Set headers for audio file
    res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="speech-${lang}-${Date.now()}.mp3"`);
    
    // Send audio data
    return res.send(pollyResult.AudioStream);
    
  } catch (error) {
    console.error('AWS Polly Error:', error);
    return res.status(500).json({error: "Failed to generate speech: " + error.message});
  }
}

// Helper function to map language codes to Polly voices
function getPollyVoiceForLanguage(langCode) {
  // Map language codes to appropriate Polly voices
  // Use only official AWS Polly voice IDs
  const voiceMap = {
    'en-US': 'Matthew',
    'en-GB': 'Amy',
    'fr-FR': 'Lea',  // Note: No accent mark
    'de-DE': 'Vicki',
    'es-ES': 'Lucia',
    'it-IT': 'Bianca',
    'ja-JP': 'Takumi',
    'pt-BR': 'Camila',
    'arb': 'Zeina',
    'ar': 'Zeina',
    'cmn-CN': 'Zhiyu',
    'hi-IN': 'Aditi',
    'ko-KR': 'Seoyeon'
  };
  
  // Also handle short language codes
  const shortCodeMap = {
    'en': 'Matthew',
    'fr': 'Lea',  // Note: No accent mark
    'de': 'Vicki',
    'es': 'Lucia',
    'it': 'Bianca',
    'pt': 'Camila',
    'ar': 'Zeina',
    'zh': 'Zhiyu',
    'hi': 'Aditi',
    'ja': 'Takumi',
    'ko': 'Seoyeon'
  };
  
  return voiceMap[langCode] || shortCodeMap[langCode] || 'Joanna'; // Default voice if language not found
}