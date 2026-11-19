import fs from 'fs';

const raw = fs.readFileSync('scripts/uploaded_data.csv', 'utf8');

function parseCsvLines(text) {
  const lines = [];
  let curLine = [];
  let curToken = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        curToken += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      curLine.push(curToken);
      curToken = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      curLine.push(curToken);
      curToken = '';
      if (curLine.some(t => t.trim().length > 0)) {
        lines.push(curLine);
      }
      curLine = [];
    } else {
      curToken += c;
    }
  }
  if (curToken.length > 0 || curLine.length > 0) {
    curLine.push(curToken);
    lines.push(curLine);
  }
  return lines;
}

const parsed = parseCsvLines(raw);

console.log('--- Sample LV row ---');
console.log(parsed[5]);

console.log('--- Sample Control row ---');
console.log(parsed[125]);
