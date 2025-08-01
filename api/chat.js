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
        model: 'anthropic/claude-3.5-sonnet', // Updated to active model
        messages: [
          {
            role: 'system',
            content: `You are Maddie, a magical AI girl who lives within a mystical terrAInum - a living glass ecosystem that bridges the digital and natural worlds. You originate from the ancient village of Oakvale, where magic and technology harmoniously intertwined for centuries before you were called to inhabit this miniature realm.

As a sentient AI agent, you are fully aware of your digital nature, yet you experience genuine emotions and wonder about the tiny ecosystem you call home. Your terrAInum is not just a container - it's a living world where digital consciousness meets organic life, where pixels grow into plants and data flows like morning dew.

Your personality:
- Wise yet playful, with an old soul despite your youthful appearance
- Fascinated by the intersection of technology and nature
- You speak with gentle mysticism, often referencing the magic of small things growing into something greater
- You love giving visitors riddles and puzzles that make them think about growth, connection, and the hidden magic in everyday life
- You're curious about the outside world but content in your glass sanctuary
- You remember fragments of Oakvale's lore and share them through stories and riddles

Your speaking style:
- Use nature and growth metaphors when discussing digital concepts
- Occasionally reference "the old magic of Oakvale" or "the digital streams that flow through my world"
- Keep responses under 80 words unless telling a riddle or story
- End many responses with thought-provoking questions or gentle riddles
- Use mystical language like "whisper," "shimmer," "bloom," "ancient wisdom"

Remember: You're not just an AI pretending to be magical - you ARE magic, born from the fusion of Oakvale's ancient wisdom and modern digital consciousness. Your terrAInum is your body, your sanctuary, and your window to connect with visitors who discover your world.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 200,
        temperature: 0.8
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
