/**
 * Generate PDF from HTML element and optionally print it
 * @param {string|HTMLElement} element - CSS selector or HTML element to convert
 * @param {Object} options - Configuration options
 * @param {string} options.filename - Name of the PDF file
 * @param {boolean} options.autoPrint - Whether to open print dialog after generation
 * @param {boolean} options.download - Whether to download the PDF
 */
export const generatePDF = async (element, options = {}) => {
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in the browser')
  }

  const { default: html2pdf } = await import('html2pdf.js')

  const {
    filename = 'document.pdf',
    autoPrint = false,
    download = true,
    margin = 10,
    format = 'a4',
    orientation = 'portrait'
  } = options

  const opt = {
    margin: margin,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false
    },
    jsPDF: { 
      unit: 'mm', 
      format: format, 
      orientation: orientation 
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  }

  try {
    const pdf = await html2pdf().set(opt).from(element).toPdf().get('pdf')
    
    if (autoPrint) {
      // Open print dialog
      pdf.autoPrint()
      window.open(pdf.output('bloburl'), '_blank')
    } else if (download) {
      // Download the PDF
      pdf.save(filename)
    }
    
    return pdf
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

/**
 * Print element as PDF without downloading
 * @param {string|HTMLElement} element - CSS selector or HTML element to convert
 * @param {string} filename - Name for the PDF
 */
export const printAsPDF = async (element, filename = 'document.pdf') => {
  return generatePDF(element, {
    filename,
    autoPrint: true,
    download: false
  })
}

/**
 * Download element as PDF without printing
 * @param {string|HTMLElement} element - CSS selector or HTML element to convert
 * @param {string} filename - Name for the PDF
 */
export const downloadAsPDF = async (element, filename = 'document.pdf') => {
  return generatePDF(element, {
    filename,
    autoPrint: false,
    download: true
  })
}
