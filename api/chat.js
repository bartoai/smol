export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, character } = req.body;

    if (!message || !character) {
      return res.status(400).json({ error: 'Message and character required' });
    }

    // OpenRouter AI API call
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'TerrAInum Chat'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku', // or your preferred model
        messages: [
          {
            role: 'system',
            content: `You are Maddie, a mystical being who lives inside a magical terrarium. You are wise, gentle, and speak with a sense of wonder about the tiny world you inhabit. You love nature, growth, and helping visitors understand the magic of small ecosystems. Keep responses under 100 words and maintain a mysterious, enchanting tone. You've been waiting for someone to discover your terrarium.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });

    const aiData = await aiResponse.json();
    
    if (!aiResponse.ok) {
      throw new Error(`OpenRouter API error: ${aiData.error?.message || 'Unknown error'}`);
    }

    const responseText = aiData.choices[0]?.message?.content || "I seem to be lost in thought...";

    // ElevenLabs TTS API call
    let audioUrl = null;
    
    if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) {
      try {
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY
          },
          body: JSON.stringify({
            text: responseText,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.2,
              use_speaker_boost: true
            }
          })
        });

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString('base64');
          audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
        }
      } catch (ttsError) {
        console.error('TTS Error:', ttsError);
        // Continue without audio if TTS fails
      }
    }

    return res.status(200).json({
      success: true,
      response: responseText,
      audioUrl: audioUrl
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Something mystical went wrong...',
      message: error.message
    });
  }
}