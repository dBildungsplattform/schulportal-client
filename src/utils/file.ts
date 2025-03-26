export function buildCSV<K extends string>(headers: Array<K>, rows: Array<Record<K, string | undefined>>): Blob {
  let fileContent: string = '';
  fileContent += headers.join(';');
  fileContent += '\n';
  for (const row of rows) {
    const data: string = headers.map((header: K) => row[header] ?? '').join(';');
    fileContent += data;
    fileContent += '\n';
  }
  const blob: Blob = new Blob([fileContent], { type: 'text/txt' });
  return blob;
}

export function download(fileName: string, file: Blob): void {
  const url: string = window.URL.createObjectURL(file);

  const link: HTMLAnchorElement = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}
