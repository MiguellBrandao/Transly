import { Document, Packer, Paragraph, TextRun } from 'docx';
import { Parser } from 'json2csv';

export const exportTranscriptionTxt = async (transcription: any): Promise<Buffer> => {
  const text = transcription.text || '';
  return Buffer.from(text, 'utf-8');
};

export const exportTranscriptionCsv = async (transcription: any): Promise<Buffer> => {
  const words = transcription.words || [];

  const csvData = words.map((word: any) => ({
    word: word.word,
    start: word.start.toFixed(2),
    end: word.end.toFixed(2),
    duration: (word.end - word.start).toFixed(2),
  }));

  const parser = new Parser({
    fields: ['word', 'start', 'end', 'duration'],
  });

  const csv = parser.parse(csvData);
  return Buffer.from(csv, 'utf-8');
};

export const exportTranscriptionDocx = async (transcription: any): Promise<Buffer> => {
  const sentences = transcription.sentences || [];

  const paragraphs = sentences.map((sentence: any) => {
    const timestamp = `[${formatTime(sentence.start)} - ${formatTime(sentence.end)}]`;
    return new Paragraph({
      children: [
        new TextRun({
          text: `${timestamp} `,
          bold: true,
        }),
        new TextRun({
          text: sentence.text,
        }),
      ],
      spacing: {
        after: 200,
      },
    });
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });

  return await Packer.toBuffer(doc);
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

