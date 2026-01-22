/**
 * Type definitions for pdfExport utility functions
 */

export interface PDFOptions {
  filename?: string;
  autoPrint?: boolean;
  download?: boolean;
  margin?: number | number[];
  format?: 'a4' | 'a3' | 'a5' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
}

/**
 * Generate PDF from HTML element and optionally print it
 * @param element - CSS selector string or HTML element to convert
 * @param options - Configuration options for PDF generation
 * @returns Promise that resolves to the generated PDF object
 */
export function generatePDF(
  element: string | HTMLElement, 
  options?: PDFOptions
): Promise<any>;

/**
 * Print element as PDF without downloading
 * @param element - CSS selector string or HTML element to convert
 * @param filename - Name for the PDF file
 * @returns Promise that resolves when printing is initiated
 */
export function printAsPDF(
  element: string | HTMLElement, 
  filename?: string
): Promise<any>;

/**
 * Download element as PDF without printing
 * @param element - CSS selector string or HTML element to convert  
 * @param filename - Name for the PDF file
 * @returns Promise that resolves when download is complete
 */
export function downloadAsPDF(
  element: string | HTMLElement,
  filename?: string
): Promise<any>;
