import { processFile } from '../../utils/fileProcessor'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { file, fileName, fileType } = req.body

    if (!file || !fileName) {
      return res.status(400).json({ error: 'File data and filename are required' })
    }

    // Validate file type
    const allowedTypes = [
      'text/plain', 
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
      'text/x-markdown'
    ]
    if (fileType && !allowedTypes.includes(fileType)) {
      return res.status(400).json({ error: 'Unsupported file type' })
    }

    // Process the file and extract text content
    const extractedText = await processFile(file, fileType)

    res.status(200).json({ 
      success: true, 
      content: extractedText,
      fileName: fileName 
    })
  } catch (error) {
    console.error('Error processing file:', error)
    res.status(500).json({ error: 'Failed to process file' })
  }
}