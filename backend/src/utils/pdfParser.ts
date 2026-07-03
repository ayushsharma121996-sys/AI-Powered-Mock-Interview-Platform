import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extracts text from a file buffer based on the mime type or file extension.
 * Supports PDF and DOCX.
 */
export async function parseResume(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const fileExtension = filename.split('.').pop()?.toLowerCase();

  if (mimeType === 'application/pdf' || fileExtension === 'pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileExtension === 'docx'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    // If it's a plain text file or anything else, try converting to string
    return buffer.toString('utf-8');
  }
}
