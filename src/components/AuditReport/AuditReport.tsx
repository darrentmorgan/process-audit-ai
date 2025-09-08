import React, { useState, useMemo } from 'react'
import { Box, Tabs, TabList, TabPanels, Tab, TabPanel, VStack } from '@chakra-ui/react'
import { SOPDownloadSection } from './SOPDownloadSection'
import { useAuth } from '@/contexts/UnifiedAuthContext'

interface AuditReportProps {
  reportId: string
  reportData: {
    title: string
    overview: string
    findings: string[]
    recommendations: string[]
    automationOpportunities: string[]
  }
}

export const AuditReport: React.FC<AuditReportProps> = ({ 
  reportId, 
  reportData 
}) => {
  const { user, organization } = useAuth()
  const [activeTab, setActiveTab] = useState(0)

  const reportTabs = useMemo(() => [
    {
      title: 'Overview',
      content: reportData.overview
    },
    {
      title: 'Findings',
      content: reportData.findings.join('\n')
    },
    {
      title: 'Recommendations',
      content: reportData.recommendations.join('\n')
    },
    {
      title: 'Automation Opportunities',
      content: reportData.automationOpportunities.join('\n')
    }
  ], [reportData])

  return (
    <VStack spacing={6} align="stretch" width="full">
      <Tabs 
        index={activeTab} 
        onChange={setActiveTab} 
        variant="soft-rounded" 
        colorScheme="blue"
      >
        <TabList>
          {reportTabs.map((tab, index) => (
            <Tab key={tab.title}>{tab.title}</Tab>
          ))}
        </TabList>

        <TabPanels>
          {reportTabs.map((tab, index) => (
            <TabPanel key={tab.title}>
              <Box 
                whiteSpace="pre-wrap" 
                p={4} 
                bg="gray.50" 
                borderRadius="md"
              >
                {tab.content}
              </Box>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>

      <SOPDownloadSection 
        reportId={reportId}
        organization={organization}
      />
    </VStack>
  )
}