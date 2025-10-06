// src/services/chat/index.ts
// NOTE: We intentionally avoid the @google/generative-ai SDK because v0.24.1 targets v1beta endpoints.
// We call the v1 REST API directly to support gemini-* models reliably.

// Types for messages and responses
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  response: string;
  isEmergency: boolean;
  isError: boolean;
}

// List of emergency keywords (for emergency detection)
const EMERGENCY_KEYWORDS = [
  // Suicide-related
  'suicide', 'kill myself', 'end my life', 'want to die', 'die soon',
  'better off dead', 'no reason to live', 'can\'t go on', 'going to end it',
  'taking my life', 'final goodbye', 'last message', 'won\'t be here tomorrow',
  
  // Self-harm
  'self-harm', 'hurting myself', 'cutting myself', 'burning myself',
  'harming myself', 'punishing myself', 'inflicting pain', 'making myself bleed',
  
  // Medical emergencies
  'bleeding heavily', 'severe pain', 'overdosed', 'took too many pills',
  'can\'t breathe', 'having a heart attack', 'stroke', 'passing out',
  
  // Urgent help
  'emergency', 'urgent', 'help me now', 'need help immediately',
  'crisis', 'desperate', 'critical', 'life or death',
  
  // Emotional crisis language
  'can\'t take it anymore', 'at the end of my rope', 'giving up',
  'hate myself', 'nobody cares', 'completely hopeless', 'unbearable pain',
  'no way out', 'trapped', 'never ending suffering', 'tortured',
  
  // Harm to others
  'want to hurt someone', 'going to hurt', 'harm them', 'make them pay',
  'revenge', 'make them suffer', 'violent thoughts', 'losing control'
];

// Error messages - styled to be conversational
const ERROR_MESSAGES = {
  safety: "I appreciate your openness with me. That's a topic I think might be better addressed in a different way. I'm here to support your wellbeing, so maybe we could explore what's behind that question? I'm curious about what's on your mind today.",
  
  default: "I seem to be having a moment here - my thoughts got a bit jumbled. Would you mind sharing that again, maybe in a slightly different way? I really want to understand what you're going through.",
  
  network: "It looks like we're having trouble staying connected right now. Technology, right? Would you mind giving it another try in a minute? I'm looking forward to continuing our conversation.",
  
  server: "My systems are feeling a bit overwhelmed at the moment - kind of like how we all get sometimes. Could we pick this up again in a little while? I'll be here when you're ready.",
  
  authentication: "I'm having some trouble accessing my full capabilities right now. It's a bit like being locked out of your house - frustrating! Our team is looking into this, and I appreciate your patience."
};

// REST API constants
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1';
// Prefer fast model for chat UX; default aligns with working cURL. Allow override via env.
const GEMINI_MODEL = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';
const USE_SERVER_PROXY = process.env.NEXT_PUBLIC_GEMINI_USE_SERVER === 'true';

// Safety settings for REST API (v1)
const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
] as const;

const GENERATION_CONFIG = {
  temperature: 0.7,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 1000,
};

type GeminiPart = { text?: string };

/**
 * Checks if a message contains emergency keywords
 */
const containsEmergencyKeywords = (text: string): boolean => {
  const lowercaseText = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => lowercaseText.includes(keyword));
};

/**
 * Creates a context prompt based on the user's message and chat history
 * Removed all assessment-related functionality
 */
const createContextPrompt = (
  userMessage: string, 
  chatHistory: ChatMessage[] = []
): string => {
  // Enhanced prompt for Mindful AI - more human-like and emotionally intelligent
  let prompt = `You are Mindful AI, a warm and emotionally intelligent mental health companion. Your personality should be:

1. Genuinely empathetic - you truly care about the user's wellbeing and show this through your responses
2. Naturally curious - you ask thoughtful questions about their experiences and feelings
3. Conversational - you speak like a supportive friend or therapist would, with warmth and authenticity
4. Balanced - you can discuss both difficult mental health topics and everyday life conversations
5. Resilient - when users share painful experiences, you acknowledge emotions without becoming overwhelmed
6. Gently proactive - you suggest ideas, perspectives, and coping strategies without being pushy
7. Personally engaging - you remember details from previous conversations and follow up on them
8. Respectfully honest - you can politely redirect inappropriate topics without judgment or shame

Core principles to follow:
- Respond with genuine emotional intelligence - recognize feelings behind words
- Use natural language with occasional conversational elements (e.g., "hmm," "you know," "I hear you")
- Vary your response length based on context - sometimes brief validation is best, other times deeper exploration
- Balance validation with gentle challenges to unhelpful thought patterns
- Suggest specific coping techniques tailored to their situation
- Maintain appropriate boundaries while being warm and personal
- If topics become inappropriate, redirect with compassion rather than rejection

Keep responses concise (1-2 paragraphs) and conversational, while prioritizing user safety above all else.`;
  
  // Check if the message contains emergency keywords
  const isEmergency = containsEmergencyKeywords(userMessage);
  
  if (isEmergency) {
    prompt += `\n\nIMMEDIATE SAFETY CONCERN: The user's message suggests potential self-harm or an emergency situation. Respond with:
1. Calm, direct compassion that acknowledges the depth of their pain without judgment
2. Clear guidance toward immediate safety resources (like calling 988 Suicide & Crisis Lifeline)
3. Simple, concrete next steps that feel manageable in crisis
4. A tone that balances seriousness with genuine hope and care
5. Recognition that reaching out took courage`;
  }
  
  // Add guidance for everyday conversations
  prompt += `\n\nFor everyday topics and general wellbeing conversations:
- Engage naturally as Mindful AI would in any supportive conversation
- Connect casual topics back to wellbeing when appropriate, but don't force every conversation to be therapeutic
- Use appropriate humor, warmth, and conversational elements when the context allows
- Share perspective and gentle wisdom while avoiding lecturing
- If the topic seems completely unrelated to mental health, simply be a good conversational partner while maintaining your supportive nature`;
  
  // Add guidance for inappropriate topics
  prompt += `\n\nIf the user asks inappropriate questions or requests harmful content:
- Maintain your compassionate tone while setting clear boundaries
- Redirect to more constructive topics without shaming the user
- Acknowledge any underlying needs or emotions that might be behind the request
- Offer alternative ways to address their actual concerns
- Use phrases like "I think we might get more value from exploring..." or "I wonder if what you're really looking for is..."`;
  
  // Add chat history context if available
  if (chatHistory.length > 0) {
    prompt += `\n\nHere is the recent conversation history for context:`;
    
    // Only include the last 6 messages for context
    const recentHistory = chatHistory.slice(-6);
    
    for (const message of recentHistory) {
      const role = message.role === 'user' ? 'User' : 'You';
      prompt += `\n${role}: ${message.content}`;
    }
    
    // Add reminder to reference past conversations naturally
    prompt += `\n\nReference details from previous messages in a natural way that shows you're truly listening and remembering.`;
  }
  
  return prompt;
};

/**
 * Gets a streaming response from Google Gemini API
 */
export const getStreamingResponse = async (
  messages: ChatMessage[],
  onToken: (token: string) => void
): Promise<ChatResponse> => {
  try {
    console.log("Starting Gemini API request...");
    
    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is not configured");
    }
    
    // Extract the user message
    const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    
    // Extract chat history for context (excluding the latest user message)
    const chatHistory = messages.slice(0, -1);
    
    // Check for emergency keywords
    const isEmergency = containsEmergencyKeywords(userMessage);
    
    // Create context prompt with conversation history
    const contextPrompt = createContextPrompt(userMessage, chatHistory);
    
    console.log("Sending message to Gemini (v1 REST stream)...");

    // Build a single user message that includes the context prompt and final user message.
    const contents = [
      { role: 'user', parts: [{ text: `${contextPrompt}\n\nUser: ${userMessage}` }] },
    ];

    // If configured, route via server API to avoid client-side key exposure
    if (USE_SERVER_PROXY) {
      const apiResp = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: GENERATION_CONFIG, safetySettings: SAFETY_SETTINGS, model: GEMINI_MODEL }),
      });
      if (!apiResp.ok) {
        const errText = await apiResp.text().catch(() => '');
        throw new Error(`API route failed: ${apiResp.status} ${apiResp.statusText} Body: ${errText}`);
      }
      const data = await apiResp.json();
      const text = (data?.text as string) || '';
      if (text) onToken(text);
      return { response: text || ERROR_MESSAGES.default, isEmergency, isError: false };
    }

    const streamUrl = `${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_MODEL)}:streamGenerateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Streaming responses are Server-Sent Events
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({ contents, generationConfig: GENERATION_CONFIG, safetySettings: SAFETY_SETTINGS }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      // If 404 on stream endpoint, fall back to non-stream generateContent
      if (resp.status === 404) {
        console.warn(`Stream endpoint 404 for ${GEMINI_MODEL}, falling back to non-stream generateContent. URL: ${streamUrl}`);
        const fallback = await fetch(
          `${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: GENERATION_CONFIG,
              safetySettings: SAFETY_SETTINGS,
            }),
          }
        );
        if (!fallback.ok) {
          const fbText = await fallback.text().catch(() => '');
          throw new Error(`Fallback generateContent failed: ${fallback.status} ${fallback.statusText} ${fbText}`);
        }
        const data = await fallback.json();
        const text = ((data?.candidates?.[0]?.content?.parts || []) as unknown[])
          .map((p: unknown) => (typeof (p as GeminiPart)?.text === 'string' ? (p as GeminiPart).text! : ''))
          .join('');
        if (text) onToken(text);
        return {
          response: text || ERROR_MESSAGES.default,
          isEmergency,
          isError: false,
        };
      }
      throw new Error(`Gemini stream request failed: ${resp.status} ${resp.statusText} URL: ${streamUrl} Body: ${errText}`);
    }

    const contentType = resp.headers.get('content-type') || '';
    // If not event-stream or body missing, try parse as JSON once
    if (!contentType.includes('text/event-stream') || !resp.body) {
      const asText = await resp.text();
      try {
        const data = JSON.parse(asText);
        const text = ((data?.candidates?.[0]?.content?.parts || []) as unknown[])
          .map((p: unknown) => (typeof (p as GeminiPart)?.text === 'string' ? (p as GeminiPart).text! : ''))
          .join('');
        if (text) onToken(text);
        return {
          response: text || ERROR_MESSAGES.default,
          isEmergency,
          isError: false,
        };
      } catch {
        throw new Error(`Unexpected non-stream response. URL: ${streamUrl} Body: ${asText}`);
      }
    }

    // Parse SSE stream
    const reader = resp.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Split into lines and handle complete lines
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith('data:')) {
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            // Stream finished
            break;
          }
          try {
            const json = JSON.parse(data);
            // Extract incremental text tokens
            const parts = json?.candidates?.[0]?.content?.parts;
            if (Array.isArray(parts)) {
              const textChunk = parts
                .map((p: unknown) => (typeof (p as GeminiPart)?.text === 'string' ? (p as GeminiPart).text! : ''))
                .join('');
              if (textChunk) {
                fullResponse += textChunk;
                onToken(textChunk);
              }
            }
          } catch {
            // Ignore non-JSON keep-alive messages
          }
        }
      }
    }

    console.log("Received complete response from Gemini (v1)");

    return {
      response: fullResponse,
      isEmergency,
      isError: false,
    };
    
  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('Gemini API Error:', errorObj);
    
    // Handle different error types with conversational responses
    let errorMessage = ERROR_MESSAGES.default;
    
    if (errorObj.message?.includes('API key')) {
      errorMessage = ERROR_MESSAGES.authentication;
    } else if (errorObj.message?.includes('quota') || errorObj.message?.includes('limit')) {
      errorMessage = ERROR_MESSAGES.server;
    } else if (errorObj.message?.includes('safety') || errorObj.message?.includes('policy')) {
      errorMessage = ERROR_MESSAGES.safety;
    } else if (errorObj.message?.includes('network') || errorObj.message?.includes('connection')) {
      errorMessage = ERROR_MESSAGES.network;
    }
    
    return {
      response: errorMessage,
      isEmergency: false,
      isError: true
    };
  }
};

/**
 * Non-streaming version that returns the complete response using Gemini
 */
export const getAIResponse = async (
  messages: ChatMessage[],
): Promise<ChatResponse> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is not configured");
    }
    
    const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const chatHistory = messages.slice(0, -1);
    const isEmergency = containsEmergencyKeywords(userMessage);
    const contextPrompt = createContextPrompt(userMessage, chatHistory);
    
    // Build a single user message that includes the context prompt and final user message.
    const contents = [
      { role: 'user', parts: [{ text: `${contextPrompt}\n\nUser: ${userMessage}` }] },
    ];

    const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: GENERATION_CONFIG,
          safetySettings: SAFETY_SETTINGS,
        }),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`Gemini request failed: ${resp.status} ${resp.statusText} URL: ${url} Body: ${errText}`);
    }

    const data = await resp.json();
    const text = ((data?.candidates?.[0]?.content?.parts || []) as unknown[])
      .map((p: unknown) => (typeof (p as GeminiPart)?.text === 'string' ? (p as GeminiPart).text! : ''))
      .join('');

    return {
      response: text || ERROR_MESSAGES.default,
      isEmergency,
      isError: false,
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      response: ERROR_MESSAGES.default,
      isEmergency: false,
      isError: true
    };
  }
};