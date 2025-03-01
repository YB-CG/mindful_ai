// src/services/assessment/index.ts

export interface Question {
    id: string;
    question: string;
    options: {
      value: string;
      label: string;
      score: number;
    }[];
    category: 'mood' | 'anxiety' | 'energy' | 'social' | 'thoughts';
  }
  
  export interface AssessmentResult {
    overallScore: number;
    categoryScores: Record<string, number>;
    severity: 'minimal' | 'mild' | 'moderate' | 'severe';
    primaryConcern: string;
    suggestedApproach: string;
    riskFactors: string[];
  }
  
  // Assessment questions with scoring weights
  export const assessmentQuestions: Question[] = [
    {
      id: 'feeling',
      question: 'How have you been feeling lately?',
      category: 'mood',
      options: [
        { value: 'normal', label: 'Normal', score: 0 },
        { value: 'good', label: 'Good', score: 0 },
        { value: 'bad', label: 'Bad', score: 2 },
        { value: 'very_bad', label: 'Very Bad', score: 3 }
      ]
    },
    {
      id: 'sleep',
      question: 'How often have you had trouble sleeping in the past month?',
      category: 'energy',
      options: [
        { value: 'never', label: 'Never', score: 0 },
        { value: 'rarely', label: 'Rarely', score: 1 },
        { value: 'sometimes', label: 'Sometimes', score: 2 },
        { value: 'often', label: 'Often', score: 3 }
      ]
    },
    {
      id: 'appetite',
      question: 'How has your appetite been recently?',
      category: 'energy',
      options: [
        { value: 'much_more', label: 'Much more than usual', score: 2 },
        { value: 'more', label: 'More than usual', score: 1 },
        { value: 'same', label: 'About the same', score: 0 },
        { value: 'less', label: 'Less than usual', score: 3 }
      ]
    },
    {
      id: 'concentration',
      question: 'How often do you find it hard to concentrate on tasks?',
      category: 'thoughts',
      options: [
        { value: 'never', label: 'Never', score: 0 },
        { value: 'rarely', label: 'Rarely', score: 1 },
        { value: 'sometimes', label: 'Sometimes', score: 2 },
        { value: 'often', label: 'Often', score: 3 }
      ]
    },
    {
      id: 'interest',
      question: 'How interested are you in activities you used to enjoy?',
      category: 'mood',
      options: [
        { value: 'very_interested', label: 'Very interested', score: 0 },
        { value: 'interested', label: 'Interested', score: 1 },
        { value: 'neutral', label: 'Neutral', score: 2 },
        { value: 'less_interested', label: 'Less interested', score: 3 }
      ]
    },
    {
      id: 'anger',
      question: 'How often do you feel irritable or angry?',
      category: 'mood',
      options: [
        { value: 'never', label: 'Never', score: 0 },
        { value: 'rarely', label: 'Rarely', score: 1 },
        { value: 'neutral', label: 'Sometimes', score: 2 },
        { value: 'often', label: 'Often', score: 3 }
      ]
    },
    {
      id: 'anxiety',
      question: 'How frequently do you feel anxious, worried, or on edge?',
      category: 'anxiety',
      options: [
        { value: 'never', label: 'Never', score: 0 },
        { value: 'rarely', label: 'Rarely', score: 1 },
        { value: 'sometimes', label: 'Sometimes', score: 2 },
        { value: 'often', label: 'Often', score: 3 }
      ]
    },
    {
      id: 'suicidal',
      question: 'Have you had thoughts of self-harm or suicide in the past month?',
      category: 'thoughts',
      options: [
        { value: 'never', label: 'Never', score: 0 },
        { value: 'once_twice', label: 'Once or twice', score: 2 },
        { value: 'sometimes', label: 'Sometimes', score: 3 },
        { value: 'often', label: 'Often', score: 5 }
      ]
    },
    {
      id: 'disconnected',
      question: 'Do you feel disconnected from yourself or the world around you?',
      category: 'social',
      options: [
        { value: 'never', label: 'Never', score: 0 },
        { value: 'rarely', label: 'Rarely', score: 1 },
        { value: 'sometimes', label: 'Sometimes', score: 2 },
        { value: 'often', label: 'Often', score: 3 }
      ]
    },
    {
      id: 'coping',
      question: 'How effective are your coping strategies when dealing with stress?',
      category: 'anxiety',
      options: [
        { value: 'very_effective', label: 'Very effective', score: 0 },
        { value: 'effective', label: 'Effective', score: 1 },
        { value: 'neutral', label: 'Neutral', score: 2 },
        { value: 'ineffective', label: 'Ineffective', score: 3 }
      ]
    }
  ];
  
  /**
   * Calculate assessment result with detailed analysis
   */
  export const calculateAssessmentResult = (answers: Record<string, string>): AssessmentResult => {
    // Initialize scores
    let overallScore = 0;
    const categoryScores: Record<string, { sum: number, count: number }> = {
      mood: { sum: 0, count: 0 },
      anxiety: { sum: 0, count: 0 },
      energy: { sum: 0, count: 0 },
      social: { sum: 0, count: 0 },
      thoughts: { sum: 0, count: 0 }
    };
    
    // Calculate scores
    assessmentQuestions.forEach(question => {
      if (answers[question.id]) {
        const selectedOption = question.options.find(opt => opt.value === answers[question.id]);
        if (selectedOption) {
          overallScore += selectedOption.score;
          categoryScores[question.category].sum += selectedOption.score;
          categoryScores[question.category].count += 1;
        }
      }
    });
    
    // Calculate average for each category
    const normalizedCategoryScores: Record<string, number> = {};
    
    for (const [category, scoreData] of Object.entries(categoryScores)) {
      if (scoreData.count > 0) {
        normalizedCategoryScores[category] = Math.round((scoreData.sum / scoreData.count) * 100) / 100;
      } else {
        normalizedCategoryScores[category] = 0;
      }
    }
    
    // Find primary concern (highest scoring category)
    let primaryConcern = '';
    let highestScore = -1;
    
    for (const [category, score] of Object.entries(normalizedCategoryScores)) {
      if (score > highestScore) {
        highestScore = score;
        primaryConcern = category;
      }
    }
    
    // Map primary concern to readable text
    const concernMap: Record<string, string> = {
      mood: 'depressive symptoms',
      anxiety: 'anxiety symptoms',
      energy: 'fatigue and energy levels',
      social: 'social disconnection',
      thoughts: 'troubling thoughts'
    };
    
    // Determine severity
    // Maximum possible score is 32 (if all questions are answered with the highest score option)
    const maxPossibleScore = 32;
    const scorePercentage = (overallScore / maxPossibleScore) * 100;
    
    let severity: 'minimal' | 'mild' | 'moderate' | 'severe';
    
    if (scorePercentage < 25) {
      severity = 'minimal';
    } else if (scorePercentage < 50) {
      severity = 'mild';
    } else if (scorePercentage < 75) {
      severity = 'moderate';
    } else {
      severity = 'severe';
    }
    
    // Override severity if suicidal ideation is present
    if (answers.suicidal === 'sometimes' || answers.suicidal === 'often') {
      severity = 'severe';
    }
    
    // Generate suggested approach based on severity and primary concern
    let suggestedApproach = '';
    
    switch (severity) {
      case 'minimal':
        suggestedApproach = 'Your responses suggest you are managing well overall. The chat support can provide wellness tips and stress management techniques if needed.';
        break;
      case 'mild':
        suggestedApproach = `Your responses suggest mild ${concernMap[primaryConcern]}. The chat support can offer coping strategies, and you might consider speaking with a wellness coach or counselor.`;
        break;
      case 'moderate':
        suggestedApproach = `Your responses indicate moderate ${concernMap[primaryConcern]}. The chat support can provide immediate strategies, but consider consulting a mental health professional for additional support.`;
        break;
      case 'severe':
        suggestedApproach = `Your responses suggest significant ${concernMap[primaryConcern]}. While our chat support is available, we strongly recommend speaking with a mental health professional as soon as possible.`;
        break;
    }
    
    // Identify risk factors
    const riskFactors: string[] = [];
    
    if (answers.suicidal !== 'never') {
      riskFactors.push('thoughts of self-harm or suicide');
    }
    
    if (answers.sleep === 'often') {
      riskFactors.push('significant sleep disturbance');
    }
    
    if (answers.interest === 'less_interested') {
      riskFactors.push('loss of interest in activities');
    }
    
    if (answers.anxiety === 'often') {
      riskFactors.push('frequent anxiety');
    }
    
    if (answers.concentration === 'often') {
      riskFactors.push('difficulty concentrating');
    }
    
    if (answers.disconnected === 'often') {
      riskFactors.push('feelings of disconnection');
    }
    
    return {
      overallScore,
      categoryScores: normalizedCategoryScores,
      severity,
      primaryConcern: concernMap[primaryConcern],
      suggestedApproach,
      riskFactors
    };
  };