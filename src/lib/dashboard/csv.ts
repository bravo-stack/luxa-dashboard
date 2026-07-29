export function escapeCsvValue(value: string | number) {
  let stringValue = String(value);

  // Spreadsheet apps may execute cells beginning with formula control characters.
  // Lead fields originate outside this trusted admin surface, so neutralize them.
  if (/^[\t ]*[=+\-@]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }

  if (/[",\r\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
