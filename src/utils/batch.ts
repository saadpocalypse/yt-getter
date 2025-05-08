import fs from 'fs';
import path from 'path';

export function readUrlsFromFile(filePath: string): string[] {
    const fullPath = path.resolve(filePath);

    if (!fs.existsSync(fullPath)) {
        throw new Error(`Batch file not found: ${fullPath}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length && !line.startsWith('#'));
}
