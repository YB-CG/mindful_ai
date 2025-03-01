// src/app/assessment/page.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  LineChart,
  BrainCircuit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  assessmentQuestions,
  calculateAssessmentResult,
  AssessmentResult
} from '@/services/assessment';

export default function AssessmentPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [transitionDirection, setTransitionDirection] = useState('right');
  
  const router = useRouter();
  
  const currentQuestion = assessmentQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessmentQuestions.length) * 100;
  
  const handleNext = () => {
    setTransitionDirection('right');
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 300);
    } else {
      const assessmentResult = calculateAssessmentResult(answers);
      setResult(assessmentResult);
      
      // Store assessment data in session storage
      sessionStorage.setItem('assessmentResult', JSON.stringify(assessmentResult));
      sessionStorage.setItem('assessmentAnswers', JSON.stringify(answers));
      
      setShowResults(true);
    }
  };
  
  const handlePrevious = () => {
    setTransitionDirection('left');
    if (currentQuestionIndex > 0) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      }, 300);
    }
  };
  
  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value
    });
  };
  
  const goToChat = () => {
    router.push('/chat');
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minimal': return 'bg-green-600';
      case 'mild': return 'bg-yellow-500';
      case 'moderate': return 'bg-orange-500';
      case 'severe': return 'bg-red-600';
      default: return 'bg-blue-600';
    }
  };
  
  const getCategoryScore = (category: string) => {
    if (!result) return 0;
    return result.categoryScores[category] || 0;
  };
  
  const getCategoryScorePercentage = (category: string) => {
    if (!result) return 0;
    // Each category is scored from 0-3, so convert to percentage
    return (getCategoryScore(category) / 3) * 100;
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
        Mental Health Assessment
      </h1>
      <p className="text-gray-600 max-w-2xl mx-auto text-center mb-8">
        Answer these 10 questions honestly to help us understand your current mental state. 
        Your responses will help personalize our chat support for you.
      </p>
      
      <div className="max-w-2xl mx-auto">
        {!showResults ? (
          <Card className="shadow-lg overflow-hidden">
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <span>Question {currentQuestionIndex + 1} of {assessmentQuestions.length}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ 
                    x: transitionDirection === 'right' ? 50 : -50, 
                    opacity: 0 
                  }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ 
                    x: transitionDirection === 'right' ? -50 : 50, 
                    opacity: 0 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold mb-6 text-gray-800">
                    {currentQuestion.question}
                  </h2>
                  
                  <div className="mb-8">
                    <Select 
                      value={answers[currentQuestion.id] || ''}
                      onValueChange={handleAnswerChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentQuestion.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              </AnimatePresence>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                
                <Button 
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center"
                >
                  {currentQuestionIndex < assessmentQuestions.length - 1 ? 'Next' : 'Complete Assessment'}
                  {currentQuestionIndex < assessmentQuestions.length - 1 ? (
                    <ArrowRight className="ml-2 h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-6 text-indigo-600">
                  <BrainCircuit className="h-16 w-16" />
                </div>
                
                <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">
                  Assessment Complete
                </h2>
                
                {result && (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div className="bg-gray-50 p-5 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2 text-gray-800 flex items-center">
                        <LineChart className="w-5 h-5 mr-2 text-indigo-600" />
                        Summary
                      </h3>
                      <p className="text-gray-700 mb-4">{result.suggestedApproach}</p>
                      
                      {/* Overall Severity */}
                      <div className="mb-4">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">Overall Severity</span>
                          <span className="text-sm font-medium text-gray-700 capitalize">{result.severity}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className={`h-2 rounded-full ${getSeverityColor(result.severity)}`}
                            style={{ width: `${(result.overallScore / 32) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Primary Concern */}
                      <div className="flex items-start">
                        <div className="mr-2 mt-1">
                          {result.severity === 'moderate' || result.severity === 'severe' ? (
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            Primary area of concern: {result.primaryConcern}
                          </p>
                          {result.riskFactors.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              Key factors: {result.riskFactors.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Category Breakdown */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">Category Breakdown</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Mood</span>
                            <span className="text-sm font-medium text-gray-700">{getCategoryScore('mood')}/3</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-blue-600 rounded-full"
                              style={{ width: `${getCategoryScorePercentage('mood')}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Anxiety</span>
                            <span className="text-sm font-medium text-gray-700">{getCategoryScore('anxiety')}/3</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-purple-600 rounded-full"
                              style={{ width: `${getCategoryScorePercentage('anxiety')}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Energy</span>
                            <span className="text-sm font-medium text-gray-700">{getCategoryScore('energy')}/3</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-amber-500 rounded-full"
                              style={{ width: `${getCategoryScorePercentage('energy')}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Social Connection</span>
                            <span className="text-sm font-medium text-gray-700">{getCategoryScore('social')}/3</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-green-600 rounded-full"
                              style={{ width: `${getCategoryScorePercentage('social')}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Troubling Thoughts</span>
                            <span className="text-sm font-medium text-gray-700">{getCategoryScore('thoughts')}/3</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-rose-600 rounded-full"
                              style={{ width: `${getCategoryScorePercentage('thoughts')}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Next Steps */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">What is Next?</h3>
                      <p className="text-gray-600 mb-4">
                        Your assessment results will help our AI chat system provide more personalized support.
                        Continue to the chat to discuss your thoughts and feelings.
                      </p>
                      
                      <div className="flex justify-center">
                        <Button 
                          onClick={goToChat}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2"
                        >
                          Continue to Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 text-center">
                    Note: This assessment is not a diagnostic tool. If you are experiencing severe symptoms,
                    please consult with a mental health professional.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}