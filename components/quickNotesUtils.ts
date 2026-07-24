import { logger } from '../services/monitoring';
export interface QuickNote {
  id: string;
  content: string;
  createdAt: string;
  page?: number;
}

export function parseNotesField(notesField: string | null | undefined): {
  generalNotes: string;
  quickNotes: QuickNote[];
} {
  if (!notesField) {
    return { generalNotes: '', quickNotes: [] };
  }

  const marker = '\n\n---QUICK_NOTES_DATA---';
  const index = notesField.indexOf(marker);
  if (index === -1) {
    return { generalNotes: notesField, quickNotes: [] };
  }

  const generalNotes = notesField.substring(0, index).trim();
  const jsonStr = notesField.substring(index + marker.length).trim();
  try {
    const quickNotes = JSON.parse(jsonStr);
    if (Array.isArray(quickNotes)) {
      return { generalNotes, quickNotes };
    }
  } catch (e) {
    logger.error("Error parsing quick notes:", e);
  }

  return { generalNotes, quickNotes: [] };
}

export function serializeNotesField(generalNotes: string, quickNotes: QuickNote[]): string {
  const cleanGeneral = (generalNotes || '').trim();
  if (quickNotes.length === 0) {
    return cleanGeneral;
  }
  const marker = '\n\n---QUICK_NOTES_DATA---';
  return `${cleanGeneral}${marker}${JSON.stringify(quickNotes)}`;
}
