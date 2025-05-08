export function sanitize(title: string): string {
    return title.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '').trim() || 'youtube-download';
}
