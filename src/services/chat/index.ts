// src/services/ai/index.ts
import { HfInference } from '@huggingface/inference';

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
 * Gets a streaming response from the Hugging Face Inference API
 * Removed assessment data parameter and references
 */
export const getStreamingResponse = async (
  messages: ChatMessage[],
  onToken: (token: string) => void
): Promise<ChatResponse> => {
  try {
    // Log for debugging
    console.log("Starting AI request with Hugging Face...");
    
    // Safely access environment variables with fallbacks
    const apiKey = "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";
    // Only use Mistral model because models >10B can't load automatically with current API setup
  const modelId = "mistralai/Mistral-7B-Instruct-v0.3";
    // const modelId = "google/gemma-7b-it";
    // const modelId = "GritLM/GritLM-7B";
    // const modelId = "TinyLlama/TinyLlama-1.1B-Chat-v1.0";
  // const modelId = "tiiuae/falcon-7b-instruct";
    // const modelId = "meta-llama/Llama-2-7b-chat-hf";
    // const modelId = "Qwen/Qwen1.5-7B-Chat";
    // const modelId = "lmsys/vicuna-7b-v1.5";
    // const modelId = "HuggingFaceH4/zephyr-7b-gemma-v0.1";
  // const modelId = "meta-llama/Meta-Llama-3-8B-Instruct";
    // const modelId = "nvidia/Llama3-ChatQA-1.5-8B";
  // const modelId = "mistralai/Mistral-7B-Instruct-v0.3";
  // const modelId = "google/gemma-1.1-7b-it";
  // const modelId = "mistralai/Mistral-Nemo-Instruct-2407";
    // const modelId = "meta-llama/Llama-3.1-8B-Instruct";
    // const modelId = "Qwen/Qwen2.5-Coder-3B-Instruct";
    // const modelId = "cerebras/btlm-3b-8k-base";
    
    // Other model options are commented out as they exceed size limitations:
    // const modelId = 'deepseek-ai/deepseek-coder-6.7b-instruct';
    // const modelId = 'deepseek-ai/deepseek-llm-7b-chat';
    // const modelId = 'deepseek-ai/deepseek-coder-33b-instruct';

        // Check if API key is available
    if (!apiKey) {
      console.error("Missing Hugging Face API key");
      throw new Error("API key is not configured");
    }
    
    // Create HuggingFace Inference instance
    const hf = new HfInference(apiKey);
    
    // Extract the user message
    const userMessage = messages.filter(m => m.role === 'user').pop()?.content || '';
    
    // Extract chat history for context (excluding the latest user message)
    const chatHistory = messages.slice(0, -1);
    
    // Check for emergency keywords
    const isEmergency = containsEmergencyKeywords(userMessage);
    
    // Create context prompt (removed assessment data parameter)
    const contextPrompt = createContextPrompt(userMessage, chatHistory);
    
    // Format the message for Mistral model
    const formattedPrompt = `<s>[INST] ${contextPrompt}\n\nUser: ${userMessage} [/INST]`;
    
    console.log("Sending request to Hugging Face API...");
    console.log("Model ID:", modelId);
    
    // Track the full response
    let fullResponse = '';
    
    // Use the textGenerationStream method for streaming responses
    const stream = await hf.textGenerationStream({
      model: modelId,
      inputs: formattedPrompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.15,
        do_sample: true
      }
    });
    
    console.log("Received stream from Hugging Face API");
    
    // Process the stream
    for await (const response of stream) {
      const token = response.token.text;
      fullResponse += token;
      onToken(token);
    }
    
    return {
      response: fullResponse,
      isEmergency,
      isError: false
    };
  } catch (error: unknown) {
    const errorObj = error as Error;
    console.error('AI Response Error:', errorObj);
    
    // Handle different error types with conversational responses
    let errorMessage = ERROR_MESSAGES.default;
    
    if (
      errorObj instanceof Error && 
      (errorObj.message.includes('401') || 
       errorObj.message.includes('unauthorized') || 
       errorObj.message.includes('Invalid credentials'))
    ) {
      console.error("Authentication error with Hugging Face API");
      errorMessage = ERROR_MESSAGES.authentication;
    } else if (
      errorObj instanceof Error && 
      (errorObj.message.toLowerCase().includes('content') || 
       errorObj.message.toLowerCase().includes('safety'))
    ) {
      errorMessage = ERROR_MESSAGES.safety;
    } else if (
      errorObj instanceof Error && 
      (errorObj.message.toLowerCase().includes('network') ||
       errorObj.message.toLowerCase().includes('connection'))
    ) {
      errorMessage = ERROR_MESSAGES.network;
    } else if (
      errorObj instanceof Error && 
      (errorObj.message.toLowerCase().includes('server') || 
       errorObj.message.toLowerCase().includes('500'))
    ) {
      errorMessage = ERROR_MESSAGES.server;
    }
    
    return {
      response: errorMessage,
      isEmergency: false,
      isError: true
    };
  }
};

/**
 * Non-streaming version that returns the complete response
 * Kept assessmentData parameter for backward compatibility but it's not used
 */
export const getAIResponse = async (
  messages: ChatMessage[],
): Promise<ChatResponse> => {
  let finalResponse = '';
  
  try {
    await getStreamingResponse(
      messages,
      (token: string) => { finalResponse += token; }
    );
    
    return {
      response: finalResponse,
      isEmergency: containsEmergencyKeywords(messages[messages.length - 1]?.content || ''),
      isError: false
    };
  } catch (error) {
    console.error('AI Response Error:', error);
    return {
      response: ERROR_MESSAGES.default,
      isEmergency: false,
      isError: true
    };
  }
};