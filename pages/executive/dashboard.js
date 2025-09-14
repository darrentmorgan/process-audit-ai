/**
 * Executive Dashboard Page
 * Sprint 4 Story 1: Executive Intelligence & Business Analytics
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  BarChart3,
  Users,
  Shield,
  TrendingUp,
  Building,
  Settings,
  Bell,
  Menu,
  X
} from 'lucide-react';
import ExecutiveDashboard from '../../components/executive/ExecutiveDashboard';
import OperationsDashboard from '../../components/executive/OperationsDashboard';

export default function ExecutiveDashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('executive');
  const [organization, setOrganization] = useState(null);
  const [userRole, setUserRole] = useState('executive');
  const [timeRange, setTimeRange] = useState('30d');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock organization data (would come from auth context in production)
  useEffect(() => {
    const mockOrg = {
      id: 'org_demo_hospitality',
      name: 'Demo Hotel Paradise',
      industry_type: 'hospitality',
      plan: 'enterprise'
    };
    setOrganization(mockOrg);
  }, []);

  const navigationItems = [
    {
      id: 'executive',
      label: 'Executive Overview',
      icon: Building,
      description: 'Strategic KPIs and business intelligence'
    },
    {
      id: 'operations',
      label: 'Operations Intelligence',
      icon: Users,
      description: 'Real-time field operations and team performance'
    },
    {
      id: 'compliance',
      label: 'Compliance & Risk',
      icon: Shield,
      description: 'Regulatory status and audit readiness'
    },
    {
      id: 'analytics',
      label: 'Business Intelligence',
      icon: BarChart3,
      description: 'Predictive insights and trend analysis'
    }
  ];

  const timeRangeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  return (
    <>
      <Head>
        <title>Executive Dashboard - ProcessAudit AI</title>
        <meta name="description" content="Executive business intelligence and operational analytics" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                >
                  <Menu className="w-6 h-6" />
                </button>

                <div className="flex items-center ml-4 lg:ml-0">
                  <Building className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                      ProcessAudit AI Executive
                    </h1>
                    <p className="text-sm text-gray-500 capitalize">
                      {organization?.name} • {organization?.industry_type} Industry
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {timeRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                  <Bell className="w-5 h-5" />
                </button>

                <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex">
            {/* Sidebar Navigation */}
            <div className={`${
              sidebarOpen ? 'block' : 'hidden'
            } lg:block w-64 mr-8`}>
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-start p-4 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className={`text-sm mt-1 ${
                          isActive ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {activeTab === 'executive' && (
                <ExecutiveDashboard
                  organization={organization}
                  timeRange={timeRange}
                  userRole={userRole}
                />
              )}

              {activeTab === 'operations' && (
                <OperationsDashboard
                  organization={organization}
                  timeRange={timeRange}
                  department="all"
                />
              )}

              {activeTab === 'compliance' && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Shield className="w-6 h-6 mr-2 text-green-600" />
                    Compliance & Risk Management
                  </h2>
                  <p className="text-gray-600">
                    Compliance dashboard coming in next phase of implementation.
                  </p>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                    Business Intelligence & Predictive Analytics
                  </h2>
                  <p className="text-gray-600">
                    Advanced business intelligence coming in next phase of implementation.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg bg-gray-100 text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <nav className="p-4 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-start p-4 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className={`text-sm mt-1 ${
                          isActive ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </div>
    </>
  );
}