import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout/Layout';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Modal } from '../components/UI/Modal';
import { surveyApi, questionApi } from '../services/api';
import { Survey, Section, Question } from '../types';
import { Plus, Search, Edit, Trash2, Download, Upload, Eye, FileText, Book, Target, Clock, CheckCircle, X } from 'lucide-react';
import { formatDate } from '../utils';

export function Questions() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);
  const [isEditQuestionModalOpen, setIsEditQuestionModalOpen] = useState(false);
  const [isQuestionDetailModalOpen, setIsQuestionDetailModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [sectionFormData, setSectionFormData] = useState({
    title: '',
    description: '',
    questionsCount: 10,
    order: 1
  });

  const [questionFormData, setQuestionFormData] = useState({
    text: '',
    type: 'single_choice' as 'single_choice' | 'multiple_choice',
    complexity: 'medium' as 'easy' | 'medium' | 'hard',
    points: 1,
    explanation: '',
    options: ['', '', '', ''],
    correctAnswers: [] as number[]
  });

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    if (selectedSurvey) {
      fetchSections(selectedSurvey.id);
    } else {
      setSections([]);
      setSelectedSection(null);
      setQuestions([]);
    }
  }, [selectedSurvey]);

  useEffect(() => {
    if (selectedSection) {
      fetchQuestions(selectedSurvey!.id, selectedSection.id);
    } else {
      setQuestions([]);
    }
  }, [selectedSection]);

  const fetchSurveys = async () => {
    try {
      setIsLoading(true);
      const response = await surveyApi.getSurveys();
      setSurveys(response.data);
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSections = async (surveyId: string) => {
    try {
      setIsLoadingSections(true);
      const response = await surveyApi.getSurveySections(surveyId);
      setSections(response.data);
    } catch (error) {
      console.error('Failed to fetch sections:', error);
    } finally {
      setIsLoadingSections(false);
    }
  };

  const fetchQuestions = async (surveyId: string, sectionId: string) => {
    try {
      setIsLoadingQuestions(true);
      const response = await questionApi.getQuestions(surveyId, sectionId);
      setQuestions(response.data);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleSurveySelect = (survey: Survey) => {
    setSelectedSurvey(survey);
    setSelectedSection(null);
    setQuestions([]);
  };

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section);
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await questionApi.downloadTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'question_template_with_survey_sections.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download template:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    try {
      setIsUploading(true);
      const response = await questionApi.uploadQuestions(selectedSurvey!.id, uploadFile);
      if (response.success) {
        const result = response.data;
        let message = `Upload completed!\n\n`;
        message += `✅ Questions added: ${result.questionsAdded}\n`;
        if (result.questionsSkipped > 0) {
          message += `⚠️ Questions skipped: ${result.questionsSkipped}\n`;
        }
        if (result.errors.length > 0) {
          message += `\nErrors encountered:\n${result.errors.slice(0, 5).join('\n')}`;
          if (result.errors.length > 5) {
            message += `\n... and ${result.errors.length - 5} more errors`;
          }
        }
        alert(message);
        setIsUploadModalOpen(false);
        setUploadFile(null);
        // Refresh sections and questions
        if (selectedSurvey) {
          fetchSections(selectedSurvey.id);
        }
        if (selectedSection) {
          fetchQuestions(selectedSurvey!.id, selectedSection.id);
        }
      }
    } catch (error) {
      console.error('Failed to upload questions:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const resetSectionForm = () => {
    setSectionFormData({
      title: '',
      description: '',
      questionsCount: 10,
      order: sections.length + 1
    });
  };

  const resetQuestionForm = () => {
    setQuestionFormData({
      text: '',
      type: 'single_choice',
      complexity: 'medium',
      points: 1,
      explanation: '',
      options: ['', '', '', ''],
      correctAnswers: []
    });
    setSelectedQuestion(null);
  };

  const handleAddSection = async () => {
    if (!selectedSurvey) return;

    try {
      const response = await surveyApi.createSection(selectedSurvey.id, sectionFormData);
      if (response.success && response.data) {
        setSections([...sections, response.data]);
        setIsAddSectionModalOpen(false);
        resetSectionForm();
      }
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  const openAddQuestionModal = () => {
    resetQuestionForm();
    setIsAddQuestionModalOpen(true);
  };

  const openEditQuestionModal = (question: Question) => {
    setSelectedQuestion(question);
    setQuestionFormData({
      text: question.text,
      type: question.type,
      complexity: question.complexity,
      points: question.points,
      explanation: question.explanation || '',
      options: question.options.map(opt => opt.text),
      correctAnswers: question.options
        .map((opt, index) => opt.isCorrect ? index : -1)
        .filter(index => index !== -1)
    });
    setIsEditQuestionModalOpen(true);
  };

  const openQuestionDetailModal = (question: Question) => {
    setSelectedQuestion(question);
    setIsQuestionDetailModalOpen(true);
  };

  const handleAddQuestion = async () => {
    if (!selectedSection) return;

    console.log('Adding question to section:', selectedSection.id);
    console.log('Question form data:', questionFormData);

    try {
      const questionData = {
        sectionId: selectedSection.id,
        text: questionFormData.text,
        type: questionFormData.type,
        complexity: questionFormData.complexity,
        points: questionFormData.points,
        explanation: questionFormData.explanation,
        options: questionFormData.options.map((text, index) => ({
          text,
          isCorrect: questionFormData.correctAnswers.includes(index),
        })),
        order: questions.length + 1
      };

      console.log('Calling API to create question:', questionData);
      const response = await questionApi.createQuestion(questionData);
      console.log('API response:', response);
      
      if (response.success && response.data) {
        setQuestions([...questions, response.data]);
        setIsAddQuestionModalOpen(false);
        resetQuestionForm();
        
        // Show success message
        alert(`Question added successfully! ${response.message}`);
      } else {
        console.error('Failed to create question:', response.message);
        alert(`Failed to create question: ${response.message}`);
      }
    } catch (error) {
      console.error('Failed to create question:', error);
      alert(`Failed to create question: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!selectedQuestion) return;

    try {
      const questionData = {
        text: questionFormData.text,
        type: questionFormData.type,
        complexity: questionFormData.complexity,
        points: questionFormData.points,
        explanation: questionFormData.explanation,
        options: questionFormData.options.map((text, index) => ({
          text,
          isCorrect: questionFormData.correctAnswers.includes(index),
          order: index + 1
        }))
      };

      // Update the question in local state (in real app, this would be an API call)
      const updatedQuestion = {
        ...selectedQuestion,
        ...questionData,
        options: questionData.options.map((opt, index) => ({
          id: selectedQuestion.options[index]?.id || `opt_${index}`,
          text: opt.text,
          isCorrect: opt.isCorrect
        }))
      };

      setQuestions(questions.map(q => q.id === selectedQuestion.id ? updatedQuestion : q));
      setIsEditQuestionModalOpen(false);
      resetQuestionForm();
    } catch (error) {
      console.error('Failed to update question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        setQuestions(questions.filter(q => q.id !== questionId));
      } catch (error) {
        console.error('Failed to delete question:', error);
      }
    }
  };

  const handleCorrectAnswerChange = (optionIndex: number) => {
    if (questionFormData.type === 'single_choice') {
      setQuestionFormData({
        ...questionFormData,
        correctAnswers: [optionIndex]
      });
    } else {
      const newCorrectAnswers = questionFormData.correctAnswers.includes(optionIndex)
        ? questionFormData.correctAnswers.filter(index => index !== optionIndex)
        : [...questionFormData.correctAnswers, optionIndex];
      
      setQuestionFormData({
        ...questionFormData,
        correctAnswers: newCorrectAnswers
      });
    }
  };

  const filteredSurveys = (surveys || []).filter(survey =>
    survey.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'single_choice': return 'bg-blue-100 text-blue-800';
      case 'multiple_choice': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Question Bank</h1>
            <p className="text-gray-600 mt-2">Manage questions for your surveys and assessments</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </Button>
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              disabled={!selectedSurvey}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Questions</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search surveys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Surveys */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Surveys</h3>
              <span className="text-sm text-gray-500">{surveys.length} surveys</span>
            </div>
            
            <div className="h-[500px] overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2 text-sm">Loading surveys...</p>
                </div>
              ) : (
                filteredSurveys.map((survey) => (
                  <div
                    key={survey.id}
                    onClick={() => handleSurveySelect(survey)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedSurvey?.id === survey.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{survey.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{survey.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{survey.totalQuestions} questions</span>
                      <span>{formatDate(survey.targetDate)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Sections */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedSurvey ? `Sections - ${selectedSurvey.title}` : 'Sections'}
              </h3>
              {selectedSurvey && (
                <Button
                  size="sm"
                  onClick={() => {
                    resetSectionForm();
                    setIsAddSectionModalOpen(true);
                  }}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Section</span>
                </Button>
              )}
            </div>
            
            <div className="h-[calc(100%-80px)] overflow-y-auto space-y-2">
              {!selectedSurvey ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Select a survey to view sections</p>
                </div>
              ) : isLoadingSections ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2 text-sm">Loading sections...</p>
                </div>
              ) : sections.length === 0 ? (
                <div className="text-center py-12">
                  <Book className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-3">No sections found</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSectionFormData({
                        title: '',
                        description: '',
                        questionsCount: 10,
                        order: 1
                      });
                      setIsAddSectionModalOpen(true);
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Section</span>
                  </Button>
                </div>
              ) : (
                sections.map((section) => (
                  <div
                    key={section.id}
                    onClick={() => handleSectionSelect(section)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedSection?.id === section.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900 mb-1">{section.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{section.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{section.questionsCount} questions</span>
                      <span>Order: {section.order}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Questions Table */}
        {selectedSection && (
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Questions - {selectedSection.title}
                </h3>
                <p className="text-sm text-gray-600">{questions.length} questions in this section</p>
              </div>
              <Button
                onClick={openAddQuestionModal}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </Button>
            </div>

            {isLoadingQuestions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Yet</h3>
                <p className="text-gray-500 mb-4">Start building your assessment by adding questions to this section.</p>
                <Button
                  onClick={openAddQuestionModal}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Question</span>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Question</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Complexity</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Points</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Options</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Order</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((question) => (
                        <tr key={question.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="max-w-xs">
                              <p className="font-medium text-gray-900 line-clamp-2">{question.text}</p>
                              {question.explanation && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  Explanation: {question.explanation}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(question.type)}`}>
                              {question.type === 'single_choice' ? 'Single' : 'Multiple'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplexityColor(question.complexity)}`}>
                              {question.complexity.charAt(0).toUpperCase() + question.complexity.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">{question.points}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="max-w-xs">
                              {question.options.slice(0, 2).map((option, index) => (
                                <div key={index} className="flex items-center space-x-1 text-sm">
                                  <span className="font-medium text-gray-600">
                                    {String.fromCharCode(65 + index)}:
                                  </span>
                                  <span className={`${option.isCorrect ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
                                    {option.text.length > 30 ? `${option.text.substring(0, 30)}...` : option.text}
                                  </span>
                                  {option.isCorrect && <CheckCircle className="w-3 h-3 text-green-600" />}
                                </div>
                              ))}
                              {question.options.length > 2 && (
                                <span className="text-xs text-gray-500">+{question.options.length - 2} more</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-900">{question.order}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openQuestionDetailModal(question)}
                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditQuestionModal(question)}
                                className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                title="Edit Question"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(question.id)}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                title="Delete Question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Upload Questions Modal */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setUploadFile(null);
          }}
          title="Upload Questions"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Upload Instructions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Download the template first to see the required format</li>
                <li>• Include Survey ID, Survey Title, Section ID, Section Title for proper mapping</li>
                <li>• Questions will be automatically assigned to the correct surveys and sections</li>
                <li>• Supported file format: CSV only</li>
              </ul>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            {uploadFile && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Selected file:</span> {uploadFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  Size: {(uploadFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadFile(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFileUpload}
                disabled={!uploadFile || isUploading}
                loading={isUploading}
              >
                Upload Questions
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add Section Modal */}
        <Modal
          isOpen={isAddSectionModalOpen}
          onClose={() => {
            setIsAddSectionModalOpen(false);
            resetSectionForm();
          }}
          title="Add New Section"
        >
          <div className="space-y-4">
            <Input
              label="Section Title"
              value={sectionFormData.title}
              onChange={(e) => setSectionFormData({ ...sectionFormData, title: e.target.value })}
              placeholder="Enter section title"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={sectionFormData.description}
                onChange={(e) => setSectionFormData({ ...sectionFormData, description: e.target.value })}
                placeholder="Enter section description"
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Questions Count"
                type="number"
                value={sectionFormData.questionsCount}
                onChange={(e) => setSectionFormData({ ...sectionFormData, questionsCount: parseInt(e.target.value) })}
                min="1"
              />
              <Input
                label="Section Order"
                type="number"
                value={sectionFormData.order}
                onChange={(e) => setSectionFormData({ ...sectionFormData, order: parseInt(e.target.value) })}
                min="1"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsAddSectionModalOpen(false);
                  resetSectionForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddSection}>
                Add Section
              </Button>
            </div>
          </div>
        </Modal>

        {/* Add Question Modal */}
        <Modal
          isOpen={isAddQuestionModalOpen}
          onClose={() => {
            setIsAddQuestionModalOpen(false);
            resetQuestionForm();
          }}
          title={`Add Question to ${selectedSection?.title}`}
          size="xl"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
              <textarea
                value={questionFormData.text}
                onChange={(e) => setQuestionFormData({ ...questionFormData, text: e.target.value })}
                placeholder="Enter your question here..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                <select
                  value={questionFormData.type}
                  onChange={(e) => setQuestionFormData({ 
                    ...questionFormData, 
                    type: e.target.value as 'single_choice' | 'multiple_choice',
                    correctAnswers: [] // Reset correct answers when type changes
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="single_choice">Single Choice</option>
                  <option value="multiple_choice">Multiple Choice</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
                <select
                  value={questionFormData.complexity}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, complexity: e.target.value as 'easy' | 'medium' | 'hard' })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <Input
                label="Points"
                type="number"
                value={questionFormData.points}
                onChange={(e) => setQuestionFormData({ ...questionFormData, points: parseInt(e.target.value) })}
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Answer Options {questionFormData.type === 'single_choice' ? '(Select one correct answer)' : '(Select multiple correct answers)'}
              </label>
              <div className="space-y-3">
                {questionFormData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {questionFormData.type === 'single_choice' ? (
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={questionFormData.correctAnswers.includes(index)}
                          onChange={() => handleCorrectAnswerChange(index)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={questionFormData.correctAnswers.includes(index)}
                          onChange={() => handleCorrectAnswerChange(index)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {String.fromCharCode(65 + index)}:
                    </span>
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...questionFormData.options];
                        newOptions[index] = e.target.value;
                        setQuestionFormData({ ...questionFormData, options: newOptions });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
              <textarea
                value={questionFormData.explanation}
                onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                placeholder="Provide an explanation for the correct answer..."
                rows={2}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsAddQuestionModalOpen(false);
                  resetQuestionForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddQuestion}
                disabled={!questionFormData.text.trim() || questionFormData.correctAnswers.length === 0}
              >
                Add Question
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Question Modal */}
        <Modal
          isOpen={isEditQuestionModalOpen}
          onClose={() => {
            setIsEditQuestionModalOpen(false);
            resetQuestionForm();
          }}
          title="Edit Question"
          size="xl"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
              <textarea
                value={questionFormData.text}
                onChange={(e) => setQuestionFormData({ ...questionFormData, text: e.target.value })}
                placeholder="Enter your question here..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                <select
                  value={questionFormData.type}
                  onChange={(e) => setQuestionFormData({ 
                    ...questionFormData, 
                    type: e.target.value as 'single_choice' | 'multiple_choice',
                    correctAnswers: [] // Reset correct answers when type changes
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="single_choice">Single Choice</option>
                  <option value="multiple_choice">Multiple Choice</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
                <select
                  value={questionFormData.complexity}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, complexity: e.target.value as 'easy' | 'medium' | 'hard' })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <Input
                label="Points"
                type="number"
                value={questionFormData.points}
                onChange={(e) => setQuestionFormData({ ...questionFormData, points: parseInt(e.target.value) })}
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Answer Options {questionFormData.type === 'single_choice' ? '(Select one correct answer)' : '(Select multiple correct answers)'}
              </label>
              <div className="space-y-3">
                {questionFormData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {questionFormData.type === 'single_choice' ? (
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={questionFormData.correctAnswers.includes(index)}
                          onChange={() => handleCorrectAnswerChange(index)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type="checkbox"
                          checked={questionFormData.correctAnswers.includes(index)}
                          onChange={() => handleCorrectAnswerChange(index)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {String.fromCharCode(65 + index)}:
                    </span>
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...questionFormData.options];
                        newOptions[index] = e.target.value;
                        setQuestionFormData({ ...questionFormData, options: newOptions });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Explanation (Optional)</label>
              <textarea
                value={questionFormData.explanation}
                onChange={(e) => setQuestionFormData({ ...questionFormData, explanation: e.target.value })}
                placeholder="Provide an explanation for the correct answer..."
                rows={2}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditQuestionModalOpen(false);
                  resetQuestionForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateQuestion}
                disabled={!questionFormData.text.trim() || questionFormData.correctAnswers.length === 0}
              >
                Update Question
              </Button>
            </div>
          </div>
        </Modal>

        {/* Question Detail Modal */}
        <Modal
          isOpen={isQuestionDetailModalOpen}
          onClose={() => {
            setIsQuestionDetailModalOpen(false);
            setSelectedQuestion(null);
          }}
          title="Question Details"
          size="lg"
        >
          {selectedQuestion && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Question</h3>
                <p className="text-gray-700">{selectedQuestion.text}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Type</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(selectedQuestion.type)}`}>
                    {selectedQuestion.type === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Complexity</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplexityColor(selectedQuestion.complexity)}`}>
                    {selectedQuestion.complexity.charAt(0).toUpperCase() + selectedQuestion.complexity.slice(1)}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Points</h4>
                  <span className="text-lg font-semibold text-blue-600">{selectedQuestion.points}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Answer Options</h4>
                <div className="space-y-2">
                  {selectedQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        option.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                      }`}
                    >
                      <span className="font-medium text-gray-700 w-8">
                        {String.fromCharCode(65 + index)}:
                      </span>
                      <span className={`flex-1 ${option.isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}`}>
                        {option.text}
                      </span>
                      {option.isCorrect && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedQuestion.explanation && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Explanation</h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{selectedQuestion.explanation}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsQuestionDetailModalOpen(false);
                    setSelectedQuestion(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsQuestionDetailModalOpen(false);
                    openEditQuestionModal(selectedQuestion);
                  }}
                  className="flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Question</span>
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
}