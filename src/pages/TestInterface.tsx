import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Modal } from '../components/UI/Modal';
import { testApi } from '../services/api';
import { TestSession, Question, TestAnswer } from '../types';
import { Clock, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, Flag, Eye, RotateCcw, Wifi, WifiOff, Save, Pause } from 'lucide-react';
import { formatTime } from '../utils';

export function TestInterface() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [session, setSession] = useState<TestSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTimeRemaining, setPausedTimeRemaining] = useState<number | null>(null);
  const [sectionInfo, setSectionInfo] = useState<Record<string, { title: string; order: number }>>({});

  // Auto-save interval
  const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sync any pending data when connection is restored
      testApi.syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      // Auto-pause the test when connection is lost and save current time
      if (session && !isPaused && timeRemaining > 0) {
        setIsPaused(true);
        setPausedTimeRemaining(timeRemaining);
        console.log('Test auto-paused due to network loss. Time remaining:', timeRemaining);
      }
    };

    const handleOnlineResume = () => {
      setIsOnline(true);
      // Auto-resume the test when connection is restored
      if (session && isPaused && pausedTimeRemaining !== null) {
        setIsPaused(false);
        setTimeRemaining(pausedTimeRemaining);
        setPausedTimeRemaining(null);
        console.log('Test auto-resumed. Continuing from time:', pausedTimeRemaining);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [session, isPaused, timeRemaining, pausedTimeRemaining]);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!session || isPaused) return;

    try {
      setAutoSaveStatus('saving');
      
      // Save current progress
      await testApi.updateSession(session.id, {
        currentQuestionIndex,
        timeRemaining,
        answers: Object.keys(answers).map(questionId => ({
          questionId,
          selectedOptions: answers[questionId],
          isCorrect: false,
          timeSpent: 0,
          answered: true
        }))
      });

      setLastSaved(new Date());
      setAutoSaveStatus('saved');
      
      // Clear status after 2 seconds
      setTimeout(() => setAutoSaveStatus(null), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus(null), 3000);
    }
  }, [session, currentQuestionIndex, timeRemaining, answers, isPaused]);

  // Auto-save timer
  useEffect(() => {
    if (!session || isPaused) return;

    const interval = setInterval(autoSave, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [autoSave, session, isPaused]);

  // Save on answer change
  useEffect(() => {
    if (session && Object.keys(answers).length > 0 && !isPaused) {
      const saveTimeout = setTimeout(autoSave, 2000); // Save 2 seconds after answer change
      return () => clearTimeout(saveTimeout);
    }
  }, [answers, autoSave, session, isPaused]);

  useEffect(() => {
    if (sessionId) {
      console.log('Loading test session with ID:', sessionId);
      // Check if we have session data from navigation state
      if (location.state?.sessionData) {
        console.log('Using session data from navigation state');
        const sessionData = location.state.sessionData;
        setSession(sessionData);
        setTimeRemaining(sessionData.timeRemaining);
        loadQuestionsForSurvey(sessionData.surveyId);
      } else {
        console.log('Loading session from API');
        loadTestSession();
      }
    }
  }, [sessionId]);

  useEffect(() => {
    if (timeRemaining > 0 && !isPaused && isOnline) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          
          if (newTime <= 0) {
            handleAutoSubmit();
            return 0;
          }
          
          if (newTime === 300 && !showTimeWarning) { // 5 minutes warning
            setShowTimeWarning(true);
          }
          
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, showTimeWarning, isPaused, isOnline]);

  const loadQuestionsForSurvey = async (surveyId: string) => {
    try {
      setIsLoading(true);
      console.log('Loading questions for survey:', surveyId);
      
      if (!surveyId) {
        throw new Error('Survey ID not provided');
      }
      
      console.log('Loading questions for survey:', surveyId);
      
      const questionsResponse = await testApi.getQuestionsForSurvey(surveyId);
      if (questionsResponse.success && questionsResponse.data && questionsResponse.data.length > 0) {
        console.log('Questions loaded successfully:', questionsResponse.data.length);
        setQuestions(questionsResponse.data);
        
        // Extract section information from the loaded questions
        const sections: Record<string, { title: string; order: number }> = {};
        questionsResponse.data.forEach(question => {
          const sectionOrder = Math.floor(question.order / 1000);
          sections[question.sectionId] = {
            title: `Section ${sectionOrder}`,
            order: sectionOrder
          };
        });
        setSectionInfo(sections);
      } else {
        const errorMessage = questionsResponse.message || 'Failed to load questions';
        console.error('Failed to load questions:', errorMessage);
        alert(`Error loading test questions:\n\n${errorMessage}\n\nPossible solutions:\n1. Check your internet connection\n2. Verify Supabase configuration in .env file\n3. Ensure questions exist for this survey\n4. Contact your administrator if the problem persists`);
        navigate('/available-tests');
        return;
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      alert(`Network error loading test questions:\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nThis usually indicates:\n• Internet connection issues\n• Supabase configuration problems\n• Server connectivity issues\n\nPlease check your connection and try again.`);
      navigate('/available-tests');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTestSession = async () => {
    try {
      setIsLoading(true);
      console.log('Loading test session for ID:', sessionId);
      
      // If no session data in navigation state, try to load from API
      if (location.state?.surveyId) {
        // Use session data from navigation state
        const surveyId = location.state.surveyId;
        const startTime = location.state.startTime || new Date().toISOString();
        
        const newSession: TestSession = {
          id: sessionId!,
          userId: '5',
          surveyId: surveyId,
          startTime: new Date(startTime),
          timeRemaining: 35 * 60, // 35 minutes
          currentQuestionIndex: 0,
          answers: [],
          status: 'in_progress',
          attemptNumber: 1
        };
        
        setSession(newSession);
        setTimeRemaining(newSession.timeRemaining);
        
        // Load questions after session is set
        loadQuestionsForSurvey(surveyId);
      } else {
        // Try to load session from API
        console.log('Loading session from API');
        const sessionResponse = await testApi.getSession(sessionId!);
        if (sessionResponse.success && sessionResponse.data) {
          setSession(sessionResponse.data);
          setTimeRemaining(sessionResponse.data.timeRemaining);
          loadQuestionsForSurvey(sessionResponse.data.surveyId);
        } else {
          throw new Error('No session data available');
        }
      }
    } catch (error) {
      console.error('Failed to load test session:', error);
      alert('Failed to load test session. Redirecting to available tests.');
      navigate('/available-tests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = async (questionId: string, optionId: string, isMultiple: boolean) => {
    if (isPaused) return; // Don't allow changes when paused
    
    const newAnswers = { ...answers };
    
    if (isMultiple) {
      const currentAnswers = newAnswers[questionId] || [];
      newAnswers[questionId] = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId)
        : [...currentAnswers, optionId];
    } else {
      newAnswers[questionId] = [optionId];
    }
    
    setAnswers(newAnswers);
    
    // Save answer immediately
    try {
      await testApi.saveAnswer(session!.id, questionId, newAnswers[questionId]);
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleNextQuestion = () => {
    if (isPaused) return; // Don't allow navigation when paused
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (isPaused) return; // Don't allow navigation when paused
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuestionNavigation = (index: number) => {
    if (isPaused) return; // Don't allow navigation when paused
    
    setCurrentQuestionIndex(index);
  };

  const toggleFlag = (index: number) => {
    if (isPaused) return; // Don't allow flagging when paused
    
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleSubmitTest = async () => {
    try {
      setIsSubmitting(true);
      const response = await testApi.submitTest(sessionId!);
      if (response.success) {
        navigate('/my-results', { 
          state: { 
            message: 'Test submitted successfully!',
            result: response.data,
            showCertificate: response.data?.isPassed && response.data?.certificateId
          }
        });
      }
    } catch (error) {
      console.error('Failed to submit test:', error);
      alert('Failed to submit test. Please try again.');
    } finally {
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleAutoSubmit = async () => {
    try {
      await testApi.submitTest(sessionId!);
      navigate('/my-results', { 
        state: { 
          message: 'Test auto-submitted due to time expiry.',
          autoSubmitted: true,
          showCertificate: false
        }
      });
    } catch (error) {
      console.error('Failed to auto-submit test:', error);
    }
  };

  const handleResumeSession = () => {
    setShowResumeModal(false);
    setIsPaused(false);
  };

  const handleStartFresh = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setFlaggedQuestions(new Set());
    setTimeRemaining(35 * 60); // Reset to full time
    setShowResumeModal(false);
    setIsPaused(false);
  };

  const getQuestionStatus = (index: number) => {
    const question = questions[index];
    if (!question) return 'unanswered';
    
    const hasAnswer = answers[question.id] && answers[question.id].length > 0;
    const isFlagged = flaggedQuestions.has(index);
    
    if (isFlagged && hasAnswer) return 'flagged-answered';
    if (isFlagged) return 'flagged';
    if (hasAnswer) return 'answered';
    return 'unanswered';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return 'bg-green-500 text-white';
      case 'flagged':
        return 'bg-yellow-500 text-white';
      case 'flagged-answered':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const answeredCount = questions.filter(q => answers[q.id] && answers[q.id].length > 0).length;
  const unansweredCount = questions.length - answeredCount;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!session || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Test Not Found</h2>
          <p className="text-gray-600 mb-4">The test session could not be loaded.</p>
          <Button onClick={() => navigate('/available-tests')}>
            Back to Available Tests
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Digital Literacy Assessment</h1>
              <p className="text-sm text-gray-600">Attempt {session.attemptNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Network status indicator */}
            <div className="flex items-center">
              {isOnline ? (
                <div className="flex items-center text-green-600">
                  <Wifi className="w-4 h-4 mr-1" />
                  <span className="text-xs">Online</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <WifiOff className="w-4 h-4 mr-1" />
                  <span className="text-xs">Offline</span>
                </div>
              )}
            </div>
            
            {/* Auto-save status */}
            <div className="flex items-center">
              {autoSaveStatus === 'saving' && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                  <span className="text-xs">Saving...</span>
                </div>
              )}
              {autoSaveStatus === 'saved' && (
                <div className="flex items-center text-green-600">
                  <Save className="w-3 h-3 mr-1" />
                  <span className="text-xs">Saved</span>
                </div>
              )}
              {autoSaveStatus === 'error' && (
                <div className="flex items-center text-red-600">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  <span className="text-xs">Save failed</span>
                </div>
              )}
              {lastSaved && !autoSaveStatus && (
                <div className="text-xs text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${timeRemaining <= 300 ? 'text-red-600' : 'text-gray-900'}`}>
                {formatTime(timeRemaining)}
                {isPaused && (
                  <span className="text-sm text-orange-600 block">PAUSED</span>
                )}
              </div>
              <p className="text-xs text-gray-500">Time Remaining</p>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {currentQuestionIndex + 1} / {questions.length}
              </div>
              <p className="text-xs text-gray-500">Question</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Question Navigation Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Question Navigator</h3>
          
          <div className="mb-4 text-sm">
            <div className="flex justify-between mb-2">
              <span>Answered:</span>
              <span className="font-medium text-green-600">{answeredCount}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Unanswered:</span>
              <span className="font-medium text-red-600">{unansweredCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Flagged:</span>
              <span className="font-medium text-yellow-600">{flaggedQuestions.size}</span>
            </div>
          </div>
          
          {/* Section-wise question navigation */}
          <div className="space-y-4">
            {Object.entries(
              questions.reduce((acc, question, index) => {
                const sectionOrder = Math.floor(question.order / 1000);
                const sectionTitle = `Section ${sectionOrder}`;
                if (!acc[sectionTitle]) {
                  acc[sectionTitle] = [];
                }
                acc[sectionTitle].push({ question, index });
                return acc;
              }, {} as Record<string, Array<{ question: Question; index: number }>>)
            )
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([sectionTitle, sectionQuestions]) => (
                <div key={sectionTitle} className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">{sectionTitle}</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {sectionQuestions.map(({ question, index }) => {
                      const status = getQuestionStatus(index);
                      return (
                        <button
                          key={index}
                          onClick={() => handleQuestionNavigation(index)}
                          disabled={isPaused}
                          className={`w-10 h-10 rounded text-sm font-medium transition-colors ${
                            index === currentQuestionIndex
                              ? 'ring-2 ring-blue-500 ring-offset-2'
                              : ''
                          } ${getStatusColor(status)} ${isPaused ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {index + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
          
          <div className="mt-6 space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Flagged</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>Flagged & Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span>Unanswered</span>
            </div>
          </div>
          
          {/* Manual save button for offline mode */}
          <div className="mt-6">
            <Button 
              variant="secondary" 
              size="sm" 
              className="w-full flex items-center justify-center space-x-2"
              onClick={autoSave}
              disabled={isPaused}
            >
              <Save className="w-4 h-4" />
              <span>Save Progress</span>
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Progress is auto-saved every 30 seconds
            </p>
          </div>
          
          {/* Test status */}
          {isPaused && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 text-center">
                Test is paused due to network connectivity
              </p>
              <p className="text-xs text-yellow-700 text-center mt-1">
                Test will resume automatically when connection is restored
              </p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <Card className="max-w-4xl mx-auto">
            {isPaused ? (
              <div className="text-center py-12">
                <Pause className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Automatically Paused</h2>
                <p className="text-gray-600 mb-6">
                  Your test has been paused due to network connectivity issues. 
                  The timer has been stopped and will resume automatically when your connection is restored.
                </p>
                <div className="flex items-center justify-center space-x-2 text-orange-600">
                  <WifiOff className="w-5 h-5" />
                  <span className="text-sm font-medium">Waiting for network connection...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      Section {Math.floor(currentQuestion.order / 1000)}
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                      Question {currentQuestionIndex + 1}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      currentQuestion.complexity === 'easy' ? 'bg-green-100 text-green-800' :
                      currentQuestion.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {currentQuestion.complexity.charAt(0).toUpperCase() + currentQuestion.complexity.slice(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleFlag(currentQuestionIndex)}
                    className={`flex items-center space-x-2 ${
                      flaggedQuestions.has(currentQuestionIndex) ? 'bg-yellow-100 text-yellow-800' : ''
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    <span>{flaggedQuestions.has(currentQuestionIndex) ? 'Unflag' : 'Flag'}</span>
                  </Button>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {currentQuestion.text}
                  </h2>
                  
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type={currentQuestion.type === 'multiple_choice' ? 'checkbox' : 'radio'}
                          name={`question-${currentQuestion.id}`}
                          value={option.id}
                          checked={answers[currentQuestion.id]?.includes(option.id) || false}
                          onChange={() => handleAnswerChange(
                            currentQuestion.id, 
                            option.id, 
                            currentQuestion.type === 'multiple_choice'
                          )}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={isPaused}
                        />
                        <span className="text-gray-900">{option.text}</span>
                      </label>
                    ))}
                  </div>
                  
                  {currentQuestion.type === 'multiple_choice' && (
                    <p className="text-sm text-gray-500 mt-3">
                      <strong>Note:</strong> This is a multiple choice question. You can select more than one answer.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0 || isPaused}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </Button>
                  
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="secondary"
                      onClick={() => setShowSubmitModal(true)}
                      disabled={isPaused}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Submit Test</span>
                    </Button>
                    
                    {currentQuestionIndex < questions.length - 1 ? (
                      <Button
                        onClick={handleNextQuestion}
                        disabled={isPaused}
                        className="flex items-center space-x-2"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowSubmitModal(true)}
                        disabled={isPaused}
                        className="flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Finish Test</span>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Network Status Alert */}
      {!isOnline && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <WifiOff className="w-5 h-5" />
          <div>
            <p className="font-bold">You are offline</p>
            <p className="text-sm">Test is paused. Progress saved locally and will sync when you're back online.</p>
          </div>
        </div>
      )}

      {/* Resume Session Modal */}
      <Modal
        isOpen={showResumeModal}
        onClose={handleResumeSession}
        title="Resume Test Session"
      >
        <div className="text-center">
          <RotateCcw className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Resume Previous Session?</h3>
          <p className="text-gray-600 mb-4">
            We found a saved test session. Would you like to resume from where you left off?
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="secondary"
              onClick={handleStartFresh}
            >
              Start Fresh
            </Button>
            <Button
              onClick={handleResumeSession}
            >
              Resume Session
            </Button>
          </div>
        </div>
      </Modal>

      {/* Time Warning Modal */}
      <Modal
        isOpen={showTimeWarning}
        onClose={() => setShowTimeWarning(false)}
        title="Time Warning"
      >
        <div className="text-center">
          <Clock className="w-12 h-12 text-orange-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">5 Minutes Remaining!</h3>
          <p className="text-gray-600 mb-4">
            You have only 5 minutes left to complete the test. Please review your answers and submit soon.
          </p>
          <Button onClick={() => setShowTimeWarning(false)}>
            Continue Test
          </Button>
        </div>
      </Modal>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Test"
      >
        <div className="space-y-4">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Submit Test?</h3>
            <p className="text-gray-600">
              Are you sure you want to submit your test? This action cannot be undone.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Test Summary:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Questions:</span>
                <span className="ml-2 font-medium">{questions.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Answered:</span>
                <span className="ml-2 font-medium text-green-600">{answeredCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Unanswered:</span>
                <span className="ml-2 font-medium text-red-600">{unansweredCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Flagged:</span>
                <span className="ml-2 font-medium text-yellow-600">{flaggedQuestions.size}</span>
              </div>
            </div>
          </div>
          
          {unansweredCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                <strong>Warning:</strong> You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}. 
                These will be marked as incorrect.
              </p>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => setShowSubmitModal(false)}
            >
              Continue Test
            </Button>
            <Button
              onClick={handleSubmitTest}
              loading={isSubmitting}
              className="flex items-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Submit Test</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}