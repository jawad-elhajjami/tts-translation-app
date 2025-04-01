// AWS Translate endpoint (replace your /api/translate endpoint)
import AWS from 'aws-sdk';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({error: "Method not allowed!"})
  }

  const { text, target } = req.body;

  if (!text || !target) {
    return res.status(405).json({error: "Missing text or target language!"})
  }

  // Configure AWS
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  });

  const translate = new AWS.Translate();

  try {
    const params = {
      Text: text,
      SourceLanguageCode: 'auto', // Auto-detect source language
      TargetLanguageCode: target
    };

    const translateResult = await translate.translateText(params).promise();
    
    // Format response to match your existing format
    res.status(200).json({
      data: {
        translations: [{
          translatedText: translateResult.TranslatedText
        }]
      }
    });
  } catch (error) {
    console.error('AWS Translation Error:', error);
    res.status(500).json({error: "Failed to translate text"});
  }
}