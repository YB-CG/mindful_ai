// // src/lib/huggingface-stream.ts
// import { HfInference } from '@huggingface/inference';
// import { experimental_StreamData } from 'ai';

// interface HuggingFaceInferenceStreamOptions {
//   model: string;
//   inputs: string;
//   apiKey?: string;
//   parameters?: Record<string, any>;
//   preprocessor?: (text: string) => string;
// }

// export async function HuggingFaceInferenceStream({
//   model,
//   inputs,
//   apiKey,
//   parameters = {},
//   preprocessor = (text) => text,
// }: HuggingFaceInferenceStreamOptions): Promise<ReadableStream> {
//   const encoder = new TextEncoder();
//   const decoder = new TextDecoder();
//   const streamData = new experimental_StreamData();
  
//   const client = new HfInference(apiKey);

//   let fullResponse = '';
  
//   const stream = new ReadableStream({
//     async start(controller) {
//       try {
//         // Since Hugging Face doesn't support streaming directly, we'll use a workaround
//         // We'll send chunks of the response as they appear
//         const response = await client.textGeneration({
//           model,
//           inputs,
//           parameters
//         });

//         let responseText = response.generated_text || '';
        
//         // Extract just the model's reply (after the prompt)
//         if (responseText.includes(inputs)) {
//           responseText = responseText.split(inputs)[1].trim();
//         }
        
//         // Process the response to remove unwanted patterns
//         responseText = preprocessor(responseText);
        
//         // Simulate streaming by sending chunks
//         const chunks = splitIntoChunks(responseText, 3, 5);
        
//         for (const chunk of chunks) {
//           // Small delay to simulate real-time streaming
//           await new Promise((resolve) => setTimeout(resolve, 20));
          
//           fullResponse += chunk;
//           controller.enqueue(encoder.encode(chunk));
//         }
        
//         // Indicate emergency situations if needed
//         if (
//           fullResponse.toLowerCase().includes('emergency') ||
//           fullResponse.toLowerCase().includes('crisis') ||
//           fullResponse.toLowerCase().includes('suicide') ||
//           fullResponse.toLowerCase().includes('self-harm')
//         ) {
//           streamData.append({ isEmergency: true });
//         }
        
//         streamData.close();
//         controller.close();
//       } catch (error) {
//         console.error('Error in HuggingFace stream:', error);
//         controller.error(error);
//       }
//     },
//   });

//   return stream;
// }

// /**
//  * Split text into chunks of varying sizes to simulate natural typing
//  */
// function splitIntoChunks(text: string, minChunkSize: number, maxChunkSize: number): string[] {
//   const chunks: string[] = [];
//   let remainingText = text;
  
//   while (remainingText.length > 0) {
//     // Random chunk size between min and max
//     const chunkSize = Math.floor(Math.random() * (maxChunkSize - minChunkSize + 1)) + minChunkSize;
    
//     // Get chunk and remaining text
//     const chunk = remainingText.slice(0, chunkSize);
//     remainingText = remainingText.slice(chunkSize);
    
//     chunks.push(chunk);
//   }
  
//   return chunks;
// }