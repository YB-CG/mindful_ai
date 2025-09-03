// src/services/chat/index.ts
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

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
    
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
    
    // Extract the user message
    const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    
    // Extract chat history for context (excluding the latest user message)
    const chatHistory = messages.slice(0, -1);
    
    // Check for emergency keywords
    const isEmergency = containsEmergencyKeywords(userMessage);
    
    // Create context prompt with conversation history
    const contextPrompt = createContextPrompt(userMessage, chatHistory);
    
    // Format conversation history for Gemini - must start with user message
    const conversationHistory = chatHistory
      .filter((_, index, array) => {
        // Remove the initial welcome message if it's the first message and from assistant
        if (index === 0 && array[0].role === 'assistant') {
          return false;
        }
        return true;
      })
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));
    
    // Start chat session with history
    const chat = model.startChat({
      history: conversationHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000,
      },
    });
    
    console.log("Sending message to Gemini...");
    
    // Send message and get streaming response
    const result = await chat.sendMessageStream(`${contextPrompt}\n\nUser: ${userMessage}`);
    
    let fullResponse = '';
    
    // Process the stream
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullResponse += chunkText;
        onToken(chunkText);
      }
    }
    
    console.log("Received complete response from Gemini");
    
    return {
      response: fullResponse,
      isEmergency,
      isError: false
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
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1000,
      },
    });
    
    const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    const chatHistory = messages.slice(0, -1);
    const isEmergency = containsEmergencyKeywords(userMessage);
    const contextPrompt = createContextPrompt(userMessage, chatHistory);
    
    const conversationHistory = chatHistory
      .filter((_, index, array) => {
        // Remove the initial welcome message if it's the first message and from assistant
        if (index === 0 && array[0].role === 'assistant') {
          return false;
        }
        return true;
      })
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));
    
    const chat = model.startChat({
      history: conversationHistory,
    });
    
    const result = await chat.sendMessage(`${contextPrompt}\n\nUser: ${userMessage}`);
    const response = await result.response;
    
    return {
      response: response.text(),
      isEmergency,
      isError: false
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