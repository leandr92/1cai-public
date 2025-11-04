import { useCallback } from 'react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { DemoResult, GeneratedCode } from '../data/demoContent';

interface EnhancedDemoResult {
  scenarioTitle: string;
  roleName: string;
  results: DemoResult[];
  codeExamples: GeneratedCode[];
  executionTime: number;
  timestamp: string;
  summary: {
    totalFiles: number;
    totalSize: string;
    successRate: number;
  };
}

export const useEnhancedDemoExport = () => {
  const downloadJSON = useCallback((result: EnhancedDemoResult) => {
    try {
      const data = {
        metadata: {
          scenarioTitle: result.scenarioTitle,
          roleName: result.roleName,
          executionTime: result.executionTime,
          timestamp: result.timestamp,
          summary: result.summary
        },
        results: result.results,
        codeExamples: result.codeExamples,
        technicalDetails: {
          generatedFiles: result.results.map(r => ({
            filename: r.filename,
            type: r.type,
            size: r.size
          })),
          codeModules: result.codeExamples.map(c => ({
            title: c.title,
            filename: c.filename,
            language: c.language,
            lines: (c.content || '').split('\n').length
          }))
        }
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.roleName}_${result.scenarioTitle.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Данные экспортированы в JSON (${data.technicalDetails.generatedFiles.length} файлов)`);
    } catch (error) {
      console.error('Ошибка экспорта JSON:', error);
      toast.error('Ошибка экспорта в JSON');
    }
  }, []);

  const downloadTXT = useCallback((result: EnhancedDemoResult) => {
    try {
      let content = `=== ДЕТАЛЬНЫЙ ОТЧЕТ ДЕМОНСТРАЦИИ ИИ-АССИСТЕНТА 1С ===\n\n`;
      content += `Роль: ${result.roleName}\n`;
      content += `Сценарий: ${result.scenarioTitle}\n`;
      content += `Дата: ${result.timestamp}\n`;
      content += `Время выполнения: ${result.executionTime}с\n\n`;
      
      content += `=== СВОДКА РЕЗУЛЬТАТОВ ===\n`;
      content += `Файлов сгенерировано: ${result.summary.totalFiles}\n`;
      content += `Общий размер: ${result.summary.totalSize}\n`;
      content += `Успешность: ${result.summary.successRate}%\n\n`;

      if (result.results.length > 0) {
        content += `=== СГЕНЕРИРОВАННЫЕ ФАЙЛЫ ===\n\n`;
        result.results.forEach((file, index) => {
          content += `${index + 1}. ${file.title}\n`;
          content += `   Тип: ${file.type}\n`;
          content += `   Файл: ${file.filename}\n`;
          content += `   Размер: ${file.size}\n`;
          content += `   Описание: ${file.description}\n\n`;
          
          if (file.content.length > 0) {
            content += `   === СОДЕРЖИМОЕ ===\n${file.content}\n\n`;
          }
        });
      }

      if (result.codeExamples.length > 0) {
        content += `=== ПРИМЕРЫ КОДА ===\n\n`;
        result.codeExamples.forEach((code, index) => {
          content += `${index + 1}. ${code.title}\n`;
          content += `   Язык: ${code.language}\n`;
          content += `   Файл: ${code.filename}\n`;
          content += `   Строк кода: ${(code.content || '').split('\n').length}\n\n`;
          content += `   === ИСХОДНЫЙ КОД ===\n${code.content}\n\n`;
          content += `   ${'='.repeat(50)}\n\n`;
        });
      }

      content += `=== ТЕХНИЧЕСКАЯ ИНФОРМАЦИЯ ===\n`;
      content += `Всего файлов: ${result.summary.totalFiles}\n`;
      content += `Код модулей: ${result.codeExamples.length}\n`;
      content += `Среднее время генерации: ${(result.executionTime / result.summary.totalFiles).toFixed(1)}с на файл\n\n`;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${result.roleName}_${result.scenarioTitle.replace(/\s+/g, '_')}_DETAILS_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Детальный отчет экспортирован в TXT');
    } catch (error) {
      console.error('Ошибка экспорта TXT:', error);
      toast.error('Ошибка экспорта в TXT');
    }
  }, []);

  const downloadPDF = useCallback(async (result: EnhancedDemoResult) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let currentY = 20;

      // Заголовок отчета
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Отчет демонстрации ИИ-ассистента 1С', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Роль: ${result.roleName}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 10;
      pdf.text(`Сценарий: ${result.scenarioTitle}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;

      // Информация о выполнении
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Информация о выполнении', 20, currentY);
      currentY += 12;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const executionInfo = [
        `Дата выполнения: ${result.timestamp}`,
        `Время выполнения: ${result.executionTime} секунд`,
        `Файлов сгенерировано: ${result.summary.totalFiles}`,
        `Общий размер файлов: ${result.summary.totalSize}`,
        `Успешность выполнения: ${result.summary.successRate}%`,
        `Код модулей создано: ${result.codeExamples.length}`
      ];

      executionInfo.forEach((item) => {
        pdf.text(`• ${item}`, 25, currentY);
        currentY += 7;
      });

      currentY += 10;

      // Сгенерированные файлы
      if (result.results.length > 0 && currentY < pageHeight - 50) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Сгенерированные файлы', 20, currentY);
        currentY += 12;

        result.results.forEach((file, index) => {
          if (currentY > pageHeight - 60) {
            pdf.addPage();
            currentY = 20;
          }

          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${file.title}`, 25, currentY);
          currentY += 6;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Тип: ${file.type} | Файл: ${file.filename} | Размер: ${file.size}`, 30, currentY);
          currentY += 5;
          
          if (file.description) {
            const descLines = pdf.splitTextToSize(`Описание: ${file.description}`, pageWidth - 40);
            descLines.forEach((line: string) => {
              pdf.text(line, 30, currentY);
              currentY += 4;
            });
          }
          currentY += 5;
        });
      }

      // Примеры кода
      if (result.codeExamples.length > 0 && currentY < pageHeight - 80) {
        pdf.addPage();
        currentY = 20;

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Примеры сгенерированного кода', 20, currentY);
        currentY += 12;

        result.codeExamples.forEach((code, index) => {
          if (currentY > pageHeight - 40) {
            pdf.addPage();
            currentY = 20;
          }

          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${code.title}`, 25, currentY);
          currentY += 6;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Язык: ${code.language} | Файл: ${code.filename}`, 30, currentY);
          currentY += 5;

          // Добавляем превью кода
          const codeLines = (code.content || '').split('\n');
          const previewLines = codeLines.slice(0, 15); // Первые 15 строк
          
          pdf.setFont('courier', 'normal');
          pdf.setFontSize(8);
          
          previewLines.forEach((line) => {
            if (currentY > pageHeight - 30) {
              pdf.addPage();
              currentY = 20;
            }
            
            const maxLength = 80;
            const displayLine = line.length > maxLength ? line.substring(0, maxLength) + '...' : line;
            pdf.text(displayLine, 30, currentY);
            currentY += 4;
          });
          
          if (codeLines.length > 15) {
            pdf.setFont('helvetica', 'italic');
            pdf.text('... (код обрезан для PDF)', 30, currentY);
            currentY += 6;
          }
          
          pdf.setFont('helvetica', 'normal');
          currentY += 8;
        });
      }

      // Подвал
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Страница ${i} из ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
        pdf.text('ИИ-ассистенты для 1С - Профессиональный отчет', 20, pageHeight - 10);
      }

      const filename = `${result.roleName}_${result.scenarioTitle.replace(/\s+/g, '_')}_REPORT_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
      
      toast.success('Профессиональный PDF отчет создан');
    } catch (error) {
      console.error('Ошибка создания PDF:', error);
      toast.error('Ошибка создания PDF отчета');
    }
  }, []);

  return {
    downloadJSON,
    downloadTXT, 
    downloadPDF
  };
};
