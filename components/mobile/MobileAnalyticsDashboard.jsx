/**
 * Mobile Analytics Dashboard Component
 * Sprint 3 Story 2: PWA & Mobile Analytics
 *
 * Provides mobile analytics for supervisors and compliance officers
 */

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Camera,
  FileText,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import useMobileOptimization from '../../hooks/useMobileOptimization';

export default function MobileAnalyticsDashboard({
  organization = null,
  userRole = 'supervisor', // 'supervisor', 'compliance_officer', 'admin'
  timeRange = '24h'
}) {
  const { isMobile, trackPerformanceMetric } = useMobileOptimization();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(loadAnalyticsData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [organization, timeRange]);

  const loadAnalyticsData = async () => {
    if (isOffline) {
      // Load cached analytics data
      const cached = localStorage.getItem('cachedAnalytics');
      if (cached) {
        setAnalyticsData(JSON.parse(cached));
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      trackPerformanceMetric('analytics_load_start', Date.now());

      // Generate mock analytics data based on organization and industry
      const mockData = generateMockAnalyticsData(organization, timeRange);
      setAnalyticsData(mockData);
      setLastUpdate(new Date());

      // Cache analytics data for offline access
      localStorage.setItem('cachedAnalytics', JSON.stringify(mockData));

      trackPerformanceMetric('analytics_load_complete', Date.now());
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate analytics metrics based on user role
  const getAnalyticsMetrics = useMemo(() => {
    if (!analyticsData) return [];

    const baseMetrics = [
      {
        title: 'SOP Completions',
        value: analyticsData.sopCompletions || 0,
        change: '+12%',
        trend: 'up',
        icon: CheckCircle,
        color: 'green'
      },
      {
        title: 'Mobile Usage',
        value: `${analyticsData.mobileUsagePercent || 0}%`,
        change: '+8%',
        trend: 'up',
        icon: Users,
        color: 'blue'
      },
      {
        title: 'Avg. Completion Time',
        value: `${analyticsData.avgCompletionTime || 0}min`,
        change: '-15%',
        trend: 'down',
        icon: Clock,
        color: 'purple'
      },
      {
        title: 'Compliance Rate',
        value: `${analyticsData.complianceRate || 0}%`,
        change: '+5%',
        trend: 'up',
        icon: FileText,
        color: 'orange'
      }
    ];

    if (userRole === 'compliance_officer') {
      return [
        ...baseMetrics,
        {
          title: 'Photo Documentation',
          value: analyticsData.photoCount || 0,
          change: '+20%',
          trend: 'up',
          icon: Camera,
          color: 'indigo'
        },
        {
          title: 'Audit Readiness',
          value: `${analyticsData.auditReadiness || 0}%`,
          change: '+3%',
          trend: 'up',
          icon: AlertTriangle,
          color: 'red'
        }
      ];
    }

    return baseMetrics;
  }, [analyticsData, userRole]);

  // Get industry-specific insights
  const getIndustryInsights = () => {
    const industryType = organization?.industry_type || 'general';

    const insights = {
      hospitality: [
        'Peak mobile usage during housekeeping shifts (9-11 AM)',
        'Room cleaning SOPs most accessed on mobile devices',
        '89% compliance rate exceeds hospitality industry average'
      ],
      restaurant: [
        'Food safety SOPs accessed 3x more on mobile during busy periods',
        'Kitchen staff prefer mobile access during prep and service',
        '94% compliance rate leads restaurant industry standards'
      ],
      medical: [
        'Patient care SOPs accessed primarily on mobile devices',
        'Hand hygiene compliance tracked via mobile documentation',
        '97% audit readiness through mobile compliance tracking'
      ],
      general: [
        'Mobile usage increases during field operations',
        'Offline functionality reduces operational disruptions',
        'Mobile compliance tracking improves audit outcomes'
      ]
    };

    return insights[industryType] || insights.general;
  };

  const industryInsights = getIndustryInsights();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Analytics</h2>
          <p className="text-gray-600">Gathering field operations insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {userRole === 'compliance_officer' ? 'Compliance Analytics' : 'Field Operations Analytics'}
              </h1>
              <p className="text-sm text-gray-600 capitalize">
                {organization?.name || 'Organization'} • {organization?.industry_type || 'General'} Industry
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {isOffline ? (
                <WifiOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Wifi className="w-5 h-5 text-green-500" />
              )}

              <button
                onClick={loadAnalyticsData}
                disabled={loading}
                className="p-2 rounded-lg bg-blue-100 text-blue-600"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {lastUpdate && (
            <p className="text-xs text-gray-500 mt-2">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Analytics Content */}
      <div className="p-4 pb-24">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {getAnalyticsMetrics.map((metric, index) => {
            const Icon = metric.icon;
            const isPositiveTrend = metric.trend === 'up';

            return (
              <div key={index} className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isPositiveTrend
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {metric.change}
                  </span>
                </div>

                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </div>

                <div className="text-sm text-gray-600">
                  {metric.title}
                </div>
              </div>
            );
          })}
        </div>

        {/* Industry Insights */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Industry Insights
          </h2>

          <div className="space-y-3">
            {industryInsights.map((insight, index) => (
              <div key={index} className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Patterns Chart */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
            Mobile Usage Patterns
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Peak Usage Hours</span>
              <span className="text-sm font-medium">9-11 AM, 2-4 PM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Most Accessed SOPs</span>
              <span className="text-sm font-medium">
                {organization?.industry_type === 'hospitality' ? 'Housekeeping' :
                 organization?.industry_type === 'restaurant' ? 'Food Safety' :
                 organization?.industry_type === 'medical' ? 'Patient Care' : 'Safety'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Offline Usage</span>
              <span className="text-sm font-medium">{analyticsData?.offlineUsagePercent || 35}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Session Duration</span>
              <span className="text-sm font-medium">{analyticsData?.avgSessionDuration || 8} minutes</span>
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        {userRole === 'compliance_officer' && (
          <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
              Compliance Status
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-700">
                  {analyticsData?.compliantSOPs || 42}
                </div>
                <div className="text-xs text-green-600">Compliant SOPs</div>
              </div>

              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-700">
                  {analyticsData?.pendingSOPs || 3}
                </div>
                <div className="text-xs text-orange-600">Pending Review</div>
              </div>

              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-700">
                  {analyticsData?.photoDocumentation || 156}
                </div>
                <div className="text-xs text-blue-600">Photos Documented</div>
              </div>

              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-700">
                  {analyticsData?.digitalSignatures || 89}
                </div>
                <div className="text-xs text-purple-600">Digital Signatures</div>
              </div>
            </div>
          </div>
        )}

        {/* Team Performance */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Users className="w-5 h-5 mr-2 text-green-600" />
            Team Performance
          </h2>

          <div className="space-y-3">
            {(analyticsData?.teamPerformance || []).map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {member.initials}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-semibold text-gray-900">{member.completionRate}%</div>
                  <div className="text-xs text-gray-500">Completion Rate</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Offline Status */}
      {isOffline && (
        <div className="fixed bottom-0 left-0 right-0 bg-orange-500 text-white p-3 text-center">
          <div className="flex items-center justify-center">
            <WifiOff className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">
              Offline Mode - Analytics from {lastUpdate?.toLocaleTimeString() || 'cache'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Generate mock analytics data based on organization and industry
function generateMockAnalyticsData(organization, timeRange) {
  const industryType = organization?.industry_type || 'general';

  const baseData = {
    sopCompletions: Math.floor(Math.random() * 50) + 30,
    mobileUsagePercent: Math.floor(Math.random() * 30) + 70,
    avgCompletionTime: Math.floor(Math.random() * 10) + 5,
    complianceRate: Math.floor(Math.random() * 10) + 85,
    offlineUsagePercent: Math.floor(Math.random() * 20) + 25,
    avgSessionDuration: Math.floor(Math.random() * 5) + 6
  };

  // Industry-specific data
  const industryData = {
    hospitality: {
      ...baseData,
      complianceRate: 89,
      photoCount: 145,
      auditReadiness: 92,
      teamPerformance: [
        { name: 'Sarah Johnson', role: 'Housekeeper', initials: 'SJ', completionRate: 96 },
        { name: 'Mike Chen', role: 'Maintenance', initials: 'MC', completionRate: 88 },
        { name: 'Lisa Rodriguez', role: 'Front Desk', initials: 'LR', completionRate: 94 }
      ]
    },
    restaurant: {
      ...baseData,
      complianceRate: 94,
      photoCount: 189,
      auditReadiness: 96,
      teamPerformance: [
        { name: 'Carlos Mendez', role: 'Chef', initials: 'CM', completionRate: 98 },
        { name: 'Jenny Kim', role: 'Line Cook', initials: 'JK', completionRate: 91 },
        { name: 'David Park', role: 'Server', initials: 'DP', completionRate: 87 }
      ]
    },
    medical: {
      ...baseData,
      complianceRate: 97,
      photoCount: 203,
      auditReadiness: 99,
      teamPerformance: [
        { name: 'Dr. Emily White', role: 'Physician', initials: 'EW', completionRate: 99 },
        { name: 'Nurse Jessica Brown', role: 'RN', initials: 'JB', completionRate: 97 },
        { name: 'Tech Alex Kim', role: 'Tech', initials: 'AK', completionRate: 95 }
      ]
    },
    general: {
      ...baseData,
      teamPerformance: [
        { name: 'John Smith', role: 'Worker', initials: 'JS', completionRate: 92 },
        { name: 'Mary Johnson', role: 'Supervisor', initials: 'MJ', completionRate: 94 },
        { name: 'Bob Wilson', role: 'Team Lead', initials: 'BW', completionRate: 90 }
      ]
    }
  };

  return industryData[industryType] || industryData.general;
}