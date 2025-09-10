export interface PDFGenerationConfig {
  reportType: 'audit' | 'executive-summary' | 'sop';
  brand?: string;
  templateVersion?: string;
  minPages?: number;
  maxPages?: number;
  requiredSections?: string[];
}

export interface PDFValidationResult {
  isValid: boolean;
  fileSize: number;
  pageCount: number;
  requiredSectionsPresent: boolean;
  errorMessages?: string[];
}

export interface PDFPerformanceMetrics {
  generationTime: number;
  fileSize: number;
  compressionRatio?: number;
}

export type PDFFallbackType = 'txt' | 'pdf' | 'error';