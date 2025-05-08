import ytpl from 'ytpl';

export async function getPlaylistVideoUrls(url: string): Promise<string[]> {
    const playlist = await ytpl(url, { pages: Infinity });
    return playlist.items.map(item => item.shortUrl);
}
