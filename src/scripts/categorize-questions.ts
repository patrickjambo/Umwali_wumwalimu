import fs from 'fs';
import path from 'path';

const NUMERIC_PATTERN = /\d+\s*(?:km\/h|km|m\b|cm|toni|kg|%|°)/i;
const IBYAPA_PATTERN = /icyapa|ibyapa|kimenyetso|ishusho|ibara|uruziga|mpandeshatu/i;

export function categorize(questionText: string): 'text' | 'numeric' | 'ibyapa' {
  if (IBYAPA_PATTERN.test(questionText)) return 'ibyapa';
  if (NUMERIC_PATTERN.test(questionText)) return 'numeric';
  return 'text';
}

console.log("Categorization script loaded.");
