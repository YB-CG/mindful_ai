// src/app/chat/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChatMessage, getStreamingResponse } from '@/services/chat';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  AlertTriangle, 
  Info, 
  Heart, 
  RefreshCw,
  Trash2,
  Sparkles
} from 'lucide-react';

// Types
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isEmergency?: boolean;
  isStreaming?: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [selectedResourceType, setSelectedResourceType] = useState<string | null>(null);
  const [inputRows, setInputRows] = useState(1);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Emergency keywords
  const EMERGENCY_KEYWORDS = [
    'suicide', 'kill myself', 'end my life', 'want to die', 
    'self-harm', 'hurting myself', 'bleeding heavily',
    'severe pain', 'emergency', 'urgent', 'help me now',
    'can\'t go on', 'better off dead', 'no reason to live'
  ];
  
  useEffect(() => {
    // Add welcome message - removed assessment storage dependency
    const welcomeMessage: Message = {
      id: '1',
      content: "Hi there! I'm your mental health support assistant. I'm here to listen and offer support. How are you feeling today?",
      role: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  }, []);
  
  useEffect(() => {
    // Scroll to bottom whenever messages change
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Adjust textarea rows based on content
    const lineCount = e.target.value.split('\n').length;
    const newRows = Math.min(5, Math.max(1, lineCount));
    setInputRows(newRows);
  };
  
  const checkForEmergencyKeywords = (text: string): boolean => {
    const lowercaseText = text.toLowerCase();
    return EMERGENCY_KEYWORDS.some(keyword => lowercaseText.includes(keyword));
  };
  
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Check for emergency keywords
    const isEmergency = checkForEmergencyKeywords(input);
    if (isEmergency) {
      setShowEmergencyAlert(true);
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setInputRows(1);
    setLoading(true);
    
    try {
      // Create a placeholder for the streaming message
      const streamingMessageId = `streaming-${Date.now().toString()}`;
      const streamingMessage: Message = {
        id: streamingMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isEmergency,
        isStreaming: true
      };
      
      setMessages(prev => [...prev, streamingMessage]);
      
      // Format messages for the AI service - include ALL non-streaming messages for full context
      const allMessages = [...messages, userMessage];
      const formattedMessages: ChatMessage[] = allMessages
        .filter(msg => !msg.isStreaming) // Don't include previous streaming messages
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Get streaming response from AI
      await getStreamingResponse(
        formattedMessages,
        (token) => {
          // Update the streaming message with each new token
          setMessages(prev => 
            prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        }
      );
      
      // Mark the message as no longer streaming
      setMessages(prev => 
        prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => prev.filter(msg => !msg.isStreaming).concat([errorMessage]));
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const clearConversation = () => {
    // Add welcome message (simplified, no assessment dependency)
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: "Hi there! I'm your mental health support assistant. I'm here to listen and offer support. How are you feeling today?",
      role: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
  };
  
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getResourcesByType = (type: string) => {
    switch (type) {
      case 'anxiety':
        return [
          { name: 'Anxiety and Depression Association of America', url: 'https://adaa.org' },
          { name: 'Calm App', url: 'https://www.calm.com' },
          { name: 'Healthline: Anxiety Exercises', url: 'https://www.healthline.com/health/mental-health/anxiety-exercises' }
        ];
      case 'depression':
        return [
          { name: 'Depression and Bipolar Support Alliance', url: 'https://www.dbsalliance.org' },
          { name: 'National Institute of Mental Health', url: 'https://www.nimh.nih.gov/health/topics/depression' },
          { name: 'Mental Health America', url: 'https://www.mhanational.org/depression' }
        ];
      case 'crisis':
        return [
          { name: '988 Suicide & Crisis Lifeline', url: 'https://988lifeline.org' },
          { name: 'Crisis Text Line', url: 'https://www.crisistextline.org' },
          { name: 'International Association for Suicide Prevention', url: 'https://www.iasp.info/resources/Crisis_Centres' }
        ];
      case 'stress':
        return [
          { name: 'American Psychological Association: Stress', url: 'https://www.apa.org/topics/stress' },
          { name: 'Headspace', url: 'https://www.headspace.com' },
          { name: 'Mayo Clinic: Stress Management', url: 'https://www.mayoclinic.org/healthy-lifestyle/stress-management/basics/stress-basics/hlv-20049495' }
        ];
      default:
        return [];
    }
  };
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-3/4">
          <Card className="shadow-lg h-[75vh] flex flex-col overflow-hidden">
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center">
                <Heart className="h-5 w-5 text-rose-500 mr-2" />
                <h2 className="font-semibold text-gray-900">Mental Health Support</h2>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setShowInfoPanel(!showInfoPanel)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Resources & Information</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={clearConversation}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clear conversation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            {/* Message area - Improved scrolling */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {messages.map((message) => (
                      <motion.div 
                        key={message.id} 
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div 
                          className={`max-w-[80%] px-4 py-3 rounded-lg ${
                            message.role === 'user' 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-gray-100 text-gray-800'
                          } ${message.isEmergency ? 'border-l-4 border-red-500' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm">
                              {message.role === 'user' ? 'You' : 'Mindful AI'}
                            </span>
                            <span className="text-xs opacity-70 ml-2">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                            {message.isStreaming && (
                              <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse"></span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>
            
            {/* Input area */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-end">
                <div className="flex-1 mr-2">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={inputRows}
                    className="resize-none min-h-[40px] max-h-[120px]"
                    disabled={loading}
                  />
                </div>
                <Button 
                  onClick={sendMessage} 
                  disabled={loading || !input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-10"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                This is a supportive space, but not a substitute for professional help.
                All conversations are private and not stored after you leave.
              </p>
            </div>
          </Card>
        </div>
        
        {/* Resources panel (optional) */}
        {showInfoPanel && (
          <motion.div 
            className="lg:w-1/4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-lg h-[75vh] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900 flex items-center">
                  <Sparkles className="h-4 w-4 text-amber-500 mr-2" />
                  Resources & Info
                </h2>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  {/* Assessment section removed */}
                  
                  {/* Resource categories */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Resource Categories</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant={selectedResourceType === 'anxiety' ? 'default' : 'outline'} 
                        className={`text-xs ${selectedResourceType === 'anxiety' ? 'bg-indigo-600 text-white' : ''}`}
                        onClick={() => setSelectedResourceType('anxiety')}
                      >
                        Anxiety
                      </Button>
                      <Button 
                        variant={selectedResourceType === 'depression' ? 'default' : 'outline'} 
                        className={`text-xs ${selectedResourceType === 'depression' ? 'bg-indigo-600 text-white' : ''}`}
                        onClick={() => setSelectedResourceType('depression')}
                      >
                        Depression
                      </Button>
                      <Button 
                        variant={selectedResourceType === 'stress' ? 'default' : 'outline'} 
                        className={`text-xs ${selectedResourceType === 'stress' ? 'bg-indigo-600 text-white' : ''}`}
                        onClick={() => setSelectedResourceType('stress')}
                      >
                        Stress
                      </Button>
                      <Button 
                        variant={selectedResourceType === 'crisis' ? 'default' : 'outline'} 
                        className={`text-xs ${selectedResourceType === 'crisis' ? 'bg-indigo-600 text-white' : ''}`}
                        onClick={() => setSelectedResourceType('crisis')}
                      >
                        Crisis
                      </Button>
                    </div>
                  </div>
                  
                  {/* Resource links */}
                  {selectedResourceType && (
                    <div>
                      <h3 className="font-medium text-gray-800 mb-2">Helpful Resources</h3>
                      <ul className="space-y-2">
                        {getResourcesByType(selectedResourceType).map((resource, index) => (
                          <li key={index}>
                            <a 
                              href={resource.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
                            >
                              <span className="mr-1">•</span>
                              {resource.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Emergency info */}
                  <div className="bg-red-50 p-3 rounded-md border-l-4 border-red-500">
                    <h3 className="font-medium text-red-800 mb-1 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Emergency Support
                    </h3>
                    <ul className="space-y-1 text-sm text-red-700">
                      <li>• Call 988 Suicide & Crisis Lifeline</li>
                      <li>• Text HOME to 741741</li>
                      <li>• Call 911 for immediate danger</li>
                    </ul>
                  </div>
                  
                  {/* General guidance */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">About This Chat</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      This chat provides supportive listening and general mental health information.
                    </p>
                    <p className="text-sm text-gray-600">
                      It is not a substitute for professional mental health care. If you are experiencing severe symptoms,
                      please contact a professional.
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </Card>
          </motion.div>
        )}
      </div>
      
      {/* Emergency Alert Dialog - Fixed to avoid nested <p> tags */}
      <AlertDialog open={showEmergencyAlert} onOpenChange={setShowEmergencyAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Important Support Information
            </AlertDialogTitle>
          </AlertDialogHeader>
          
          <div className="mb-4">
            I notice your message includes content that suggests you might need immediate support.
          </div>
          
          <div className="mb-4">
            If you are experiencing a mental health emergency or having thoughts of harming yourself,
            please contact a crisis helpline immediately:
          </div>
          
          <ul className="list-disc pl-5 mb-4">
            <li>National Suicide Prevention Lifeline: 988 or 1-800-273-8255</li>
            <li>Crisis Text Line: Text HOME to 741741</li>
            <li>Or go to your nearest emergency room</li>
          </ul>
          
          <div className="mb-4">
            These services are available 24/7 and provide immediate support from trained counselors.
          </div>
          
          <AlertDialogFooter>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white">
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}