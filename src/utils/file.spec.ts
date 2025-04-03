import type { MockInstance } from 'vitest';
import { buildCSV, download } from './file';

describe('buildCSV', () => {
  test('should build file', async () => {
    type FieldName = 'header1' | 'header2' | 'header3' | 'header4';
    const headers: Array<FieldName> = ['header1', 'header2', 'header3', 'header4'];
    const rows: Array<Record<FieldName, string>> = [
      {
        header1: '1',
        header2: '2',
        header3: '3',
        header4: '4',
      },
      {
        header1: '',
        header2: '',
        header3: '',
        header4: '',
      },
    ];
    const content: string = buildCSV(headers, rows);
    const lines: Array<string> = content.split('\n').filter(Boolean);
    expect(lines.length).toBe(3);
    expect(lines[0]).toBe(headers.join(';'));
    for (let i: number = 0; i < rows.length; i++) {
      const row: Record<FieldName, string> = rows[i]!;
      expect(lines[1 + i]).toBe([...Object.values(row)].join(';'));
    }
  });
});

describe('download', () => {
  test('creates url and link and clicks link', () => {
    const createObjectURL: MockInstance = vi.fn(() => 'testUrl');
    const revokeObjectURL: MockInstance = vi.fn();
    const mockAnchor: HTMLAnchorElement = {
      href: '',
      setAttribute: vi.fn(),
      click: vi.fn(),
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement;
    vi.stubGlobal('window', {
      URL: {
        createObjectURL,
        revokeObjectURL,
      },
    });
    vi.stubGlobal('document', {
      createElement: () => mockAnchor,
      body: {
        appendChild: vi.fn(),
      },
    });

    const fileName: string = 'testFile.txt';
    const file: Blob = new Blob();

    download(fileName, file);

    expect(createObjectURL).toHaveBeenLastCalledWith(file);
    expect(mockAnchor.href).toBe('testUrl');

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockAnchor.setAttribute).toHaveBeenCalledWith('download', fileName);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockAnchor.click).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockAnchor.remove).toHaveBeenCalled();

    expect(revokeObjectURL).toHaveBeenCalled();
  });
});
