import express from 'express';
import { storage } from '../storage-minimal.ts';

const router = express.Router();

// Store quiz questions in memory since they're standardized clinical content
const standardQuizQuestions = [
  {
    id: 1,
    category: 'communication',
    question: "How do you prefer to receive feedback or guidance?",
    options: [
      { value: 'direct', label: 'Direct and straightforward', weight: 1 },
      { value: 'gentle', label: 'Gentle and encouraging', weight: 2 },
      { value: 'detailed', label: 'Detailed explanations with examples', weight: 3 },
      { value: 'supportive', label: 'Warm and emotionally supportive', weight: 4 }
    ]
  },
  {
    id: 2,
    category: 'emotional',
    question: "When you're feeling overwhelmed, what helps you most?",
    options: [
      { value: 'practical', label: 'Practical steps to solve the problem', weight: 1 },
      { value: 'validation', label: 'Someone to listen and validate my feelings', weight: 2 },
      { value: 'distraction', label: 'Activities to distract and reset my mind', weight: 3 },
      { value: 'reflection', label: 'Quiet time for self-reflection', weight: 4 }
    ]
  },
  {
    id: 3,
    category: 'goals',
    question: "What's your primary wellness goal?",
    options: [
      { value: 'stress', label: 'Managing stress and anxiety', weight: 1 },
      { value: 'mood', label: 'Improving overall mood and happiness', weight: 2 },
      { value: 'relationships', label: 'Better relationships and communication', weight: 3 },
      { value: 'growth', label: 'Personal growth and self-understanding', weight: 4 }
    ]
  }
];

// Get quiz questions (server-side for clinical validity)
router.get('/questions', async (req, res) => {
  try {
    console.log('📋 Fetching personality quiz questions');
    res.json(standardQuizQuestions);
  } catch (error) {
    console.error('❌ Error fetching quiz questions:', error);
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

// Save quiz results and generate user profile
router.post('/complete', async (req, res) => {
  try {
    const { userId, answers } = req.body;
    
    if (!userId || !answers) {
      return res.status(400).json({ error: 'User ID and answers are required' });
    }

    console.log(`📊 Processing personality quiz for user ${userId}`);

    // Analyze answers to generate profile
    const profile = analyzeAnswers(answers);
    
    // Store in semantic memory for therapeutic reference
    await storage.createSemanticMemory({
      userId: parseInt(userId),
      memoryType: 'personality_profile',
      content: JSON.stringify(profile),
      emotionalWeight: 5,
      tags: ['personality', 'quiz', 'profile', 'therapeutic'],
      context: 'Initial personality assessment via structured questionnaire'
    });

    console.log(`✅ Personality profile saved for user ${userId}`);
    res.json({ profile, message: 'Personality assessment completed successfully' });

  } catch (error) {
    console.error('❌ Error processing quiz results:', error);
    res.status(500).json({ error: 'Failed to process quiz results' });
  }
});

function analyzeAnswers(answers) {
  // Analyze communication preferences
  const communicationScores = { direct: 0, gentle: 0, detailed: 0, supportive: 0 };
  const emotionalScores = { practical: 0, validation: 0, distraction: 0, reflection: 0 };
  const goalScores = { stress: 0, mood: 0, relationships: 0, growth: 0 };

  answers.forEach(answer => {
    const question = standardQuizQuestions.find(q => q.id === answer.questionId);
    if (!question) return;

    const option = question.options.find(opt => opt.value === answer.selectedValue);
    if (!option) return;

    switch (question.category) {
      case 'communication':
        communicationScores[answer.selectedValue] = (communicationScores[answer.selectedValue] || 0) + option.weight;
        break;
      case 'emotional':
        emotionalScores[answer.selectedValue] = (emotionalScores[answer.selectedValue] || 0) + option.weight;
        break;
      case 'goals':
        goalScores[answer.selectedValue] = (goalScores[answer.selectedValue] || 0) + option.weight;
        break;
    }
  });

  // Determine primary characteristics
  const primaryCommunication = Object.keys(communicationScores).reduce((a, b) => 
    communicationScores[a] > communicationScores[b] ? a : b
  );
  
  const primaryEmotional = Object.keys(emotionalScores).reduce((a, b) => 
    emotionalScores[a] > emotionalScores[b] ? a : b
  );
  
  const primaryGoal = Object.keys(goalScores).reduce((a, b) => 
    goalScores[a] > goalScores[b] ? a : b
  );

  return {
    communicationStyle: primaryCommunication,
    emotionalSupport: primaryEmotional === 'validation' ? 'high' : 'moderate',
    preferredTone: primaryCommunication === 'supportive' ? 'warm' : 'professional',
    primaryGoals: [primaryGoal],
    stressResponses: [primaryEmotional],
    motivationFactors: [primaryCommunication],
    sessionPreference: 'medium',
    personalityTraits: [primaryCommunication, primaryEmotional, primaryGoal],
    completedAt: new Date().toISOString()
  };
}

export default router;