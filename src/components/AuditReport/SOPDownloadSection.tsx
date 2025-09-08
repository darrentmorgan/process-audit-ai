import React, { useState } from 'react'
import { 
  SOPFormat, 
  OrganizationBranding,
  SOPPDFGenerationRequest 
} from '@/types/sop'
import { useAuth } from '@/contexts/UnifiedAuthContext'
import { 
  Select, 
  Button, 
  VStack, 
  HStack, 
  Text, 
  useToast 
} from '@chakra-ui/react'

interface SOPDownloadSectionProps {
  reportId: string
  organization?: {
    id: string
    branding: OrganizationBranding
  }
}

export const SOPDownloadSection: React.FC<SOPDownloadSectionProps> = ({ 
  reportId, 
  organization 
}) => {
  const [selectedFormat, setSelectedFormat] = useState<SOPFormat>('step-by-step')
  const [isGenerating, setIsGenerating] = useState(false)
  const { user } = useAuth()
  const toast = useToast()

  const handleDownloadSOP = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to download the SOP',
        status: 'warning',
        duration: 3000,
        isClosable: true
      })
      return
    }

    setIsGenerating(true)

    try {
      const requestBody: SOPPDFGenerationRequest = {
        reportId,
        sopFormat: selectedFormat,
        branding: organization?.branding || {
          name: 'ProcessAudit AI',
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          logoUrl: '/logo.svg',
          fontFamily: 'Inter, sans-serif'
        },
        includeBranding: true
      }

      const response = await fetch('/api/sop/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()

      if (result.success) {
        // Trigger PDF download
        const downloadLink = document.createElement('a')
        downloadLink.href = result.pdfUrl
        downloadLink.download = `SOP-${reportId}.pdf`
        downloadLink.click()

        toast({
          title: 'SOP PDF Generated',
          description: 'Your SOP has been successfully downloaded',
          status: 'success',
          duration: 3000,
          isClosable: true
        })
      } else {
        throw new Error('PDF generation failed')
      }
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Unable to generate SOP PDF. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <VStack 
      spacing={4} 
      align="stretch" 
      p={4} 
      borderWidth={1} 
      borderRadius="md"
      boxShadow="sm"
    >
      <Text fontWeight="bold" fontSize="lg">
        Generate Professional SOP
      </Text>

      <HStack>
        <Select 
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value as SOPFormat)}
          placeholder="Select SOP Format"
        >
          <option value="step-by-step">Step-by-Step</option>
          <option value="hierarchical">Hierarchical</option>
          <option value="checklist">Checklist</option>
          <option value="flowchart">Flowchart</option>
        </Select>

        <Button 
          colorScheme="blue" 
          onClick={handleDownloadSOP}
          isLoading={isGenerating}
          loadingText="Generating PDF"
        >
          Download SOP
        </Button>
      </HStack>

      {organization && (
        <Text fontSize="sm" color="gray.500">
          Branded for {organization.branding.name}
        </Text>
      )}
    </VStack>
  )
}