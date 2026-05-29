import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';

export const downloadPDF = async (element: HTMLElement, filename: string): Promise<void> => {
  try {
    const originalStyle = element.style.cssText;
    element.style.width = '900px';
    element.style.borderRadius = '0';

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: -window.scrollY,
      onclone: (clonedDoc) => {
        const animatedElements = clonedDoc.querySelectorAll('.animate-slide-up, .animate-fade-in');
        animatedElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.animation = 'none';
          htmlEl.style.opacity = '1';
          htmlEl.style.transform = 'none';
        });
      },
    });

    element.style.cssText = originalStyle;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - margin * 2;

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = usableWidth / (imgWidth / (96 / 25.4));
    const scaledHeight = (imgHeight / (96 / 25.4)) * ratio;

    let heightLeft = scaledHeight;
    let yOffset = margin;
    let page = 0;

    while (heightLeft > 0) {
      if (page > 0) pdf.addPage();

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        yOffset - page * (pageHeight - margin * 2),
        usableWidth,
        scaledHeight,
        undefined,
        'FAST'
      );

      heightLeft -= pageHeight - margin * 2;
      page++;
    }

    pdf.save(`${filename.replace(/[^a-z0-9-_]/gi, '_')}.pdf`);
  } catch (err) {
    console.error('PDF export failed:', err);
    throw err;
  }
};
