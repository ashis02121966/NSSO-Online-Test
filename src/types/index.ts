export interface User {
  id: string;
  email: string;
  name: string;
  roleId: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  jurisdiction?: string;
  lastLogin?: Date;
  profileImage?: string;
  parentId?: string; // For hierarchy (Supervisor -> RO -> ZO -> Admin)
  zone?: string;
  region?: string;
  district?: string;
  employeeId?: string;
  phoneNumber?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  userCount?: number;
  level: number; // 1=Admin, 2=ZO, 3=RO, 4=Supervisor, 5=Enumerator
  menuAccess?: string[]; // Array of menu paths this role can access
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
  module: string;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  duration: number; // in minutes
  totalQuestions: number;
  passingScore: number;
  maxAttempts: number;
  isActive: boolean;
  sections: Section[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  enrolledUsers?: number;
  completedAttempts?: number;
  averageScore?: number;
  assignedZones?: string[];
  assignedRegions?: string[];
}

export interface Section {
  id: string;
  surveyId: string;
  title: string;
  description: string;
  questionsCount: number;
  order: number;
  questions: Question[];
}

export interface Question {
  id: string;
  sectionId: string;
  text: string;
  type: 'multiple_choice' | 'single_choice';
  complexity: 'easy' | 'medium' | 'hard';
  options: QuestionOption[];
  correctAnswers: string[];
  explanation?: string;
  points: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TestSession {
  id: string;
  userId: string;
  surveyId: string;
  startTime: Date;
  endTime?: Date;
  timeRemaining: number; // in seconds
  currentQuestionIndex: number;
  answers: TestAnswer[];
  status: 'in_progress' | 'completed' | 'timeout' | 'paused';
  attemptNumber: number;
  score?: number;
  isPassed?: boolean;
  completedAt?: Date;
  pauseTime?: Date;
  resumeTime?: Date;
  totalPauseDuration?: number;
}

export interface TestAnswer {
  questionId: string;
  selectedOptions: string[];
  isCorrect: boolean;
  timeSpent: number; // in seconds
  answered: boolean;
}

export interface TestResult {
  id: string;
  userId: string;
  user: User;
  surveyId: string;
  survey: Survey;
  sessionId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  isPassed: boolean;
  timeSpent: number; // in seconds
  attemptNumber: number;
  sectionScores: SectionScore[];
  completedAt: Date;
  certificateId?: string;
  grade?: string;
}

export interface SectionScore {
  sectionId: string;
  sectionTitle: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
}

export interface Certificate {
  id: string;
  userId: string;
  user: User;
  surveyId: string;
  survey: Survey;
  resultId: string;
  certificateNumber: string;
  issuedAt: Date;
  validUntil?: Date;
  downloadCount: number;
  status: 'active' | 'revoked' | 'expired';
}

export interface Dashboard {
  totalUsers: number;
  totalSurveys: number;
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  recentActivity: Activity[];
  performanceByRole: PerformanceData[];
  performanceBySurvey: PerformanceData[];
  monthlyTrends: MonthlyTrend[];
}

export interface ZODashboard extends Dashboard {
  totalZones: number;
  totalRegions: number;
  zonePerformance: ZonePerformance[];
  regionalBreakdown: RegionalBreakdown[];
  topPerformingRegions: PerformanceData[];
  lowPerformingRegions: PerformanceData[];
}

export interface RODashboard extends Dashboard {
  totalDistricts: number;
  totalSupervisors: number;
  districtPerformance: DistrictPerformance[];
  supervisorPerformance: SupervisorPerformance[];
  enumeratorDistribution: EnumeratorDistribution[];
}

export interface SupervisorDashboard extends Dashboard {
  totalEnumerators: number;
  teamPerformance: TeamPerformance[];
  enumeratorStatus: EnumeratorStatus[];
  upcomingDeadlines: UpcomingDeadline[];
}

export interface EnumeratorDashboard {
  availableTests: AvailableTest[];
  completedTests: CompletedTest[];
  upcomingTests: UpcomingTest[];
  certificates: Certificate[];
  overallProgress: number;
  averageScore: number;
  totalAttempts: number;
  passedTests: number;
}

export interface ZonePerformance {
  zoneId: string;
  zoneName: string;
  totalEnumerators: number;
  completedTests: number;
  passRate: number;
  averageScore: number;
  regions: RegionalBreakdown[];
}

export interface RegionalBreakdown {
  regionId: string;
  regionName: string;
  totalEnumerators: number;
  completedTests: number;
  passRate: number;
  averageScore: number;
  supervisors: SupervisorPerformance[];
}

export interface DistrictPerformance {
  districtId: string;
  districtName: string;
  totalEnumerators: number;
  completedTests: number;
  passRate: number;
  averageScore: number;
}

export interface SupervisorPerformance {
  supervisorId: string;
  supervisorName: string;
  totalEnumerators: number;
  completedTests: number;
  passRate: number;
  averageScore: number;
  enumerators: EnumeratorStatus[];
}

export interface TeamPerformance {
  teamId: string;
  teamName: string;
  totalMembers: number;
  completedTests: number;
  passRate: number;
  averageScore: number;
  members: EnumeratorStatus[];
}

export interface EnumeratorDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface AvailableTest {
  surveyId: string;
  title: string;
  description: string;
  targetDate: Date;
  duration: number;
  totalQuestions: number;
  passingScore: number;
  attemptsLeft: number;
  maxAttempts: number;
  isEligible: boolean;
}

export interface CompletedTest {
  resultId: string;
  surveyTitle: string;
  score: number;
  isPassed: boolean;
  completedAt: Date;
  attemptNumber: number;
  certificateId?: string;
}

export interface UpcomingTest {
  surveyId: string;
  title: string;
  targetDate: Date;
  daysLeft: number;
  isOverdue: boolean;
}

export interface UpcomingDeadline {
  surveyId: string;
  surveyTitle: string;
  targetDate: Date;
  daysLeft: number;
  pendingEnumerators: number;
  totalEnumerators: number;
}

export interface Activity {
  id: string;
  type: 'test_completed' | 'user_created' | 'survey_created' | 'question_uploaded' | 'certificate_issued' | 'role_updated';
  description: string;
  userId: string;
  userName: string;
  timestamp: Date;
  metadata?: any;
}

export interface PerformanceData {
  name: string;
  value: number;
  total: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  attempts: number;
  passed: number;
  failed: number;
  passRate: number;
}

export interface EnumeratorStatus {
  id: string;
  user: User;
  surveys: EnumeratorSurveyStatus[];
  overallProgress: number;
  totalCertificates: number;
  lastActivity: Date;
}

export interface EnumeratorSurveyStatus {
  surveyId: string;
  surveyTitle: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'expired';
  attempts: number;
  maxAttempts: number;
  bestScore?: number;
  lastAttempt?: Date;
  targetDate: Date;
  isPassed: boolean;
  certificateId?: string;
}

export interface SystemSettings {
  id: string;
  category: string;
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'email' | 'url' | 'color' | 'select';
  isEditable: boolean;
  options?: string[]; // For select type settings
  updatedAt: Date;
  updatedBy: string;
}

export interface AnalyticsFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  surveyIds?: string[];
  roleIds?: string[];
  jurisdictions?: string[];
  status?: string[];
  zones?: string[];
  regions?: string[];
}

export interface AnalyticsData {
  overview: {
    totalAttempts: number;
    passRate: number;
    averageScore: number;
    averageTime: number;
  };
  performanceByRole: PerformanceData[];
  performanceBySurvey: PerformanceData[];
  performanceByJurisdiction: PerformanceData[];
  timeSeriesData: {
    date: string;
    attempts: number;
    passed: number;
    averageScore: number;
  }[];
  topPerformers: {
    userId: string;
    userName: string;
    averageScore: number;
    totalAttempts: number;
    passRate: number;
  }[];
  lowPerformers: {
    userId: string;
    userName: string;
    averageScore: number;
    totalAttempts: number;
    passRate: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FileUploadResult {
  fileName: string;
  questionsAdded: number;
  questionsSkipped: number;
  errors: string[];
  success: boolean;
}