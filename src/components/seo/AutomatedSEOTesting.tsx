import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  RefreshCw,
  Download,
  Calendar,
  Shield,
  Zap,
  Target,
  Globe,
  Smartphone,
  Monitor,
  Settings,
  FileText,
  BarChart3,
  TrendingUp,
  Activity,
  Bug,
  Search,
  MapPin,
  Star,
  Award
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  category: 'technical' | 'content' | 'local' | 'performance' | 'security' | 'mobile';
  status: 'pass' | 'fail' | 'warning' | 'pending';
  score: number;
  issues: string[];
  recommendations: string[];
  lastRun: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  critical: boolean;
}

interface TestSuite {
  name: string;
  description: string;
  tests: TestResult[];
  overallScore: number;
  status: 'pass' | 'fail' | 'warning';
  lastRun: string;
  duration: number;
}

interface TestSchedule {
  id: string;
  testName: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
}

const AutomatedSEOTesting: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSuite, setSelectedSuite] = useState('all');
  const [currentTest, setCurrentTest] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testSchedules, setTestSchedules] = useState<TestSchedule[]>([]);
  const [progress, setProgress] = useState(0);

  // Comprehensive test results
  const mockTestResults: TestResult[] = [
    {
      id: 'meta-tags',
      name: 'Meta Tags Optimization',
      category: 'technical',
      status: 'pass',
      score: 95,
      issues: [],
      recommendations: ['Consider adding Open Graph image dimensions', 'Add Twitter Card meta tags'],
      lastRun: '2024-01-30 14:30',
      frequency: 'daily',
      critical: true
    },
    {
      id: 'structured-data',
      name: 'Structured Data Validation',
      category: 'technical',
      status: 'pass',
      score: 98,
      issues: [],
      recommendations: ['Add more FAQ schema markup', 'Consider adding VideoObject schema for tutorials'],
      lastRun: '2024-01-30 14:30',
      frequency: 'daily',
      critical: true
    },
    {
      id: 'core-web-vitals',
      name: 'Core Web Vitals',
      category: 'performance',
      status: 'pass',
      score: 96,
      issues: [],
      recommendations: ['Optimize Largest Contentful Paint for mobile', 'Consider lazy loading images below fold'],
      lastRun: '2024-01-30 14:25',
      frequency: 'daily',
      critical: true
    },
    {
      id: 'mobile-friendly',
      name: 'Mobile Friendliness',
      category: 'mobile',
      status: 'pass',
      score: 100,
      issues: [],
      recommendations: ['Test on more iOS devices', 'Consider AMP implementation'],
      lastRun: '2024-01-30 14:20',
      frequency: 'daily',
      critical: true
    },
    {
      id: 'page-speed',
      name: 'Page Speed Analysis',
      category: 'performance',
      status: 'warning',
      score: 85,
      issues: ['Some images not optimized', 'Render-blocking resources detected'],
      recommendations: ['Compress images using WebP format', 'Minify CSS and JavaScript', 'Implement critical CSS'],
      lastRun: '2024-01-30 14:15',
      frequency: 'daily',
      critical: false
    },
    {
      id: 'local-seo',
      name: 'Local SEO Audit',
      category: 'local',
      status: 'pass',
      score: 92,
      issues: ['Inconsistent NAP citations detected'],
      recommendations: ['Update all business directory listings', 'Add more local photos', 'Encourage customer reviews'],
      lastRun: '2024-01-30 14:10',
      frequency: 'weekly',
      critical: false
    },
    {
      id: 'content-quality',
      name: 'Content Quality Analysis',
      category: 'content',
      status: 'warning',
      score: 78,
      issues: ['Some content below 1000 words', 'Missing internal links in recent posts'],
      recommendations: ['Expand short-form content', 'Add more internal linking', 'Update old blog posts with fresh information'],
      lastRun: '2024-01-30 14:00',
      frequency: 'weekly',
      critical: false
    },
    {
      id: 'security-headers',
      name: 'Security Headers Check',
      category: 'security',
      status: 'pass',
      score: 100,
      issues: [],
      recommendations: ['Consider implementing HSTS', 'Add Content Security Policy'],
      lastRun: '2024-01-30 13:45',
      frequency: 'daily',
      critical: true
    },
    {
      id: 'sitemap-xml',
      name: 'XML Sitemap Validation',
      category: 'technical',
      status: 'pass',
      score: 100,
      issues: [],
      recommendations: ['Submit to Google Search Console', 'Add image sitemap'],
      lastRun: '2024-01-30 13:30',
      frequency: 'weekly',
      critical: false
    },
    {
      id: 'robots-txt',
      name: 'Robots.txt Analysis',
      category: 'technical',
      status: 'pass',
      score: 98,
      issues: ['Some important pages potentially blocked'],
      recommendations: ['Review and update robots.txt rules', 'Add crawl delay for aggressive crawlers'],
      lastRun: '2024-01-30 13:15',
      frequency: 'weekly',
      critical: false
    },
    {
      id: 'schema-markup',
      name: 'Schema Markup Coverage',
      category: 'content',
      status: 'warning',
      score: 82,
      issues: ['Missing HowTo schema for service pages', 'No Event schema for workshops'],
      recommendations: ['Add HowTo schema for beauty procedures', 'Implement Event schema for training sessions', 'Add Product schema for service offerings'],
      lastRun: '2024-01-30 13:00',
      frequency: 'weekly',
      critical: false
    },
    {
      id: 'voice-search',
      name: 'Voice Search Optimization',
      category: 'content',
      status: 'pass',
      score: 88,
      issues: ['FAQ pages could be more conversational'],
      recommendations: ['Add more question-based content', 'Optimize for natural language queries', 'Implement FAQ schema'],
      lastRun: '2024-01-30 12:45',
      frequency: 'monthly',
      critical: false
    }
  ];

  const testSuites: TestSuite[] = [
    {
      name: 'Technical SEO',
      description: 'Technical aspects affecting search engine crawling and indexing',
      tests: mockTestResults.filter(test => test.category === 'technical'),
      overallScore: 98,
      status: 'pass',
      lastRun: '2024-01-30 14:30',
      duration: 180
    },
    {
      name: 'Performance',
      description: 'Site speed and user experience metrics',
      tests: mockTestResults.filter(test => test.category === 'performance'),
      overallScore: 90,
      status: 'warning',
      lastRun: '2024-01-30 14:15',
      duration: 120
    },
    {
      name: 'Mobile SEO',
      description: 'Mobile optimization and responsive design checks',
      tests: mockTestResults.filter(test => test.category === 'mobile'),
      overallScore: 100,
      status: 'pass',
      lastRun: '2024-01-30 14:20',
      duration: 90
    },
    {
      name: 'Local SEO',
      description: 'Local search optimization and business listing verification',
      tests: mockTestResults.filter(test => test.category === 'local'),
      overallScore: 92,
      status: 'pass',
      lastRun: '2024-01-30 14:10',
      duration: 150
    },
    {
      name: 'Content',
      description: 'Content quality, optimization, and relevance analysis',
      tests: mockTestResults.filter(test => test.category === 'content'),
      overallScore: 83,
      status: 'warning',
      lastRun: '2024-01-30 13:00',
      duration: 240
    },
    {
      name: 'Security',
      description: 'Security headers and HTTPS implementation',
      tests: mockTestResults.filter(test => test.category === 'security'),
      overallScore: 99,
      status: 'pass',
      lastRun: '2024-01-30 13:45',
      duration: 60
    }
  ];

  const mockSchedules: TestSchedule[] = [
    {
      id: 'daily-tech',
      testName: 'Technical SEO Tests',
      frequency: 'daily',
      time: '02:00',
      enabled: true,
      lastRun: '2024-01-30 02:00',
      nextRun: '2024-01-31 02:00'
    },
    {
      id: 'daily-performance',
      testName: 'Performance Tests',
      frequency: 'daily',
      time: '03:00',
      enabled: true,
      lastRun: '2024-01-30 03:00',
      nextRun: '2024-01-31 03:00'
    },
    {
      id: 'weekly-content',
      testName: 'Content Quality Tests',
      frequency: 'weekly',
      time: '08:00',
      enabled: true,
      lastRun: '2024-01-29 08:00',
      nextRun: '2024-02-05 08:00'
    },
    {
      id: 'monthly-voice',
      testName: 'Voice Search Tests',
      frequency: 'monthly',
      time: '10:00',
      enabled: false,
      lastRun: '2024-01-01 10:00',
      nextRun: '2024-02-01 10:00'
    }
  ];

  useEffect(() => {
    setTestResults(mockTestResults);
    setTestSchedules(mockSchedules);
  }, []);

  const runTests = (suiteName: string) => {
    setIsRunning(true);
    setProgress(0);

    const testsToRun = suiteName === 'all'
      ? mockTestResults
      : mockTestResults.filter(test => test.category === suiteName);

    // Simulate test execution
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsRunning(false);
        setProgress(0);
        setCurrentTest('');
      } else {
        const testIndex = Math.floor((currentProgress / 100) * testsToRun.length);
        if (testsToRun[testIndex]) {
          setCurrentTest(testsToRun[testIndex].name);
        }
      }
    }, 500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'fail': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return <Settings className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'local': return <MapPin className="w-4 h-4" />;
      case 'content': return <FileText className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const overallScore = Math.round(testResults.reduce((acc, test) => acc + test.score, 0) / testResults.length);
  const criticalIssues = testResults.filter(test => test.critical && test.status !== 'pass').length;
  const totalIssues = testResults.filter(test => test.status !== 'pass').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Bug className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Automated SEO Testing</h1>
            <p className="text-gray-600">Continuous monitoring and automated testing for SEO excellence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={criticalIssues === 0 ? 'default' : 'destructive'}>
            {criticalIssues === 0 ? 'All Clear' : `${criticalIssues} Critical Issues`}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Activity className="w-4 h-4" />
            Live Monitoring
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-600">{overallScore}</div>
              <Badge variant={overallScore >= 90 ? 'default' : overallScore >= 70 ? 'secondary' : 'destructive'}>
                {overallScore >= 90 ? 'Excellent' : overallScore >= 70 ? 'Good' : 'Needs Work'}
              </Badge>
            </div>
            <div className="mt-2 text-sm text-gray-600">Test Performance</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Tests Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-600">
                {testResults.filter(test => test.status === 'pass').length}/{testResults.length}
              </div>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="mt-2 text-sm text-gray-600">Success Rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-yellow-600">{totalIssues}</div>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="mt-2 text-sm text-gray-600">Need Attention</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-600">{criticalIssues}</div>
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="mt-2 text-sm text-gray-600">Immediate Action</div>
          </CardContent>
        </Card>
      </div>

      {/* Test Progress */}
      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              Running Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Current Test: {currentTest}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="suites" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suites" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Test Suites
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <FileText className="w-4 h-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="w-4 h-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <Download className="w-4 h-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Test Suites */}
        <TabsContent value="suites" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {testSuites.map((suite, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{suite.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={suite.status === 'pass' ? 'default' : suite.status === 'warning' ? 'secondary' : 'destructive'}>
                        {suite.status}
                      </Badge>
                      <Badge variant="outline">{suite.overallScore}/100</Badge>
                    </div>
                  </CardTitle>
                  <p className="text-sm text-gray-600">{suite.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Tests</div>
                        <div className="font-semibold">{suite.tests.length}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Duration</div>
                        <div className="font-semibold">{suite.duration}s</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Last Run</div>
                        <div className="font-semibold">{suite.lastRun.split(' ')[1]}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Passed</div>
                        <div className="font-semibold text-green-600">
                          {suite.tests.filter(test => test.status === 'pass').length}/{suite.tests.length}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">Test Results:</div>
                      <div className="space-y-1">
                        {suite.tests.slice(0, 3).map((test, testIndex) => (
                          <div key={testIndex} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(test.status)}
                              <span>{test.name}</span>
                            </div>
                            <span className={getScoreColor(test.score)}>{test.score}/100</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => runTests(suite.tests[0].category)}>
                        <Play className="w-4 h-4 mr-2" />
                        Run Suite
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Run All Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button onClick={() => runTests('all')} disabled={isRunning}>
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Complete Test Suite
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Tests
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Results */}
        <TabsContent value="results" className="space-y-6">
          <div className="space-y-4">
            {testResults.map((test, index) => (
              <Card key={index} className={test.critical && test.status !== 'pass' ? 'ring-2 ring-red-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(test.category)}
                      <span>{test.name}</span>
                      {test.critical && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Critical
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.status)}
                      <Badge variant="outline" className={getScoreColor(test.score)}>
                        {test.score}/100
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Category</div>
                        <div className="font-semibold capitalize">{test.category}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Frequency</div>
                        <div className="font-semibold capitalize">{test.frequency}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Last Run</div>
                        <div className="font-semibold">{test.lastRun}</div>
                      </div>
                    </div>

                    {test.issues.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Issues Found:</div>
                        <div className="space-y-1">
                          {test.issues.map((issue, issueIndex) => (
                            <div key={issueIndex} className="flex items-center gap-2 text-sm text-red-600">
                              <XCircle className="w-3 h-3" />
                              {issue}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {test.recommendations.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-600 mb-2">Recommendations:</div>
                        <div className="space-y-1">
                          {test.recommendations.map((rec, recIndex) => (
                            <div key={recIndex} className="flex items-center gap-2 text-sm text-blue-600">
                              <CheckCircle2 className="w-3 h-3" />
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Run Test
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Test Schedule */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Automated Test Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testSchedules.map((schedule, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${schedule.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                      <div>
                        <h4 className="font-semibold">{schedule.testName}</h4>
                        <div className="text-sm text-gray-600">
                          Every {schedule.frequency} at {schedule.time}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Last: {schedule.lastRun}</div>
                      <div className="text-sm text-gray-600">Next: {schedule.nextRun}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Play className="w-4 h-4 mr-1" />
                        Run Now
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Generate Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Report Type</Label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option>Complete SEO Audit Report</option>
                      <option>Technical SEO Report</option>
                      <option>Performance Report</option>
                      <option>Content Analysis Report</option>
                      <option>Mobile SEO Report</option>
                    </select>
                  </div>
                  <div>
                    <Label>Format</Label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option>PDF</option>
                      <option>Excel</option>
                      <option>CSV</option>
                      <option>JSON</option>
                    </select>
                  </div>
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Test History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Complete SEO Audit</h4>
                        <p className="text-sm text-gray-600">Generated on Jan 30, 2024</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Score: 92</Badge>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Performance Analysis</h4>
                        <p className="text-sm text-gray-600">Generated on Jan 29, 2024</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Score: 88</Badge>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Technical SEO Audit</h4>
                        <p className="text-sm text-gray-600">Generated on Jan 28, 2024</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Score: 95</Badge>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomatedSEOTesting;