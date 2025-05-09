import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import cliProgress from 'cli-progress';
import { createWriteStream, unlink } from 'node:fs';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import path from 'node:path';
import { sanitize } from './utils/sanitize.js';
import { DownloadOptions } from './types.js';
import fs from 'node:fs';

ffmpeg.setFfmpegPath(ffmpegPath as string);
const unlinkAsync = promisify(unlink);

function stripUrlParams(rawUrl: string): string {
    try {
        const parsed = new URL(rawUrl);
        parsed.searchParams.delete('list');
        parsed.searchParams.delete('index');
        return parsed.toString();
    } catch {
        return rawUrl;
    }
}

export async function downloadAudio(url: string, options: DownloadOptions): Promise<void> {
    url = stripUrlParams(url); // ✅ Sanitize URL early

    const allowedFormats = ['wav', 'ogg', 'flac', 'aac', 'mp3'];
    const format = options.format?.toLowerCase() || 'mp3';

    if (!allowedFormats.includes(format)) {
        throw new Error(
            `Unsupported format "${format}". Supported formats: ${allowedFormats.join(', ')}`
        );
    }

    const ffmpegFormatMap: Record<string, string> = {
        aac: 'adts',
        wav: 'wav',
        ogg: 'ogg',
        flac: 'flac',
        mp3: 'mp3',
    };

    const ffmpegFormat = ffmpegFormatMap[format];

    if (!fs.existsSync(options.outputDir) || !fs.statSync(options.outputDir).isDirectory()) {
        throw new Error(`Output directory does not exist: ${options.outputDir}`);
    }

    if (!ytdl.validateURL(url)) throw new Error('Invalid YouTube URL.');

    const info = await ytdl.getInfo(url);
    const title = options.filename ? sanitize(options.filename) : sanitize(info.videoDetails.title);
    const outputPath = path.join(options.outputDir, `${title}.${format}`);

    const audioStream = ytdl(url, { quality: 'highestaudio' });

    let total = 0;
    const bar = new cliProgress.SingleBar({ clearOnComplete: true });
    audioStream.on('response', res => {
        total = parseInt(res.headers['content-length'] ?? '0', 10);
        bar.start(total, 0);
    });
    audioStream.on('data', chunk => bar.increment(chunk.length));
    audioStream.on('end', () => bar.stop());

    return new Promise((resolve, reject) => {
        ffmpeg(audioStream)
            .audioBitrate(128)
            .format(ffmpegFormat)
            .on('error', reject)
            .on('end', () => {
                console.log(`Saved: ${outputPath}`);
                resolve();
            })
            .save(outputPath);
    });
}

export async function downloadVideo(url: string, options: DownloadOptions): Promise<void> {
    url = stripUrlParams(url); // ✅ Sanitize URL early

    const allowedQualities = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];
    const requestedQuality = options.quality?.toLowerCase();

    if (requestedQuality && !allowedQualities.includes(requestedQuality)) {
        throw new Error(`Unsupported quality "${requestedQuality}". Allowed values: ${allowedQualities.join(', ')}`);
    }

    if (!fs.existsSync(options.outputDir) || !fs.statSync(options.outputDir).isDirectory()) {
        throw new Error(`Output directory does not exist: ${options.outputDir}`);
    }

    if (!ytdl.validateURL(url)) throw new Error('Invalid YouTube URL.');

    const info = await ytdl.getInfo(url);
    const title = options.filename ? sanitize(options.filename) : sanitize(info.videoDetails.title);
    const outputPath = path.join(options.outputDir, `${title}.mp4`);

    const tempDir = tmpdir();
    const audioPath = path.join(tempDir, `${title}-audio.tmp.mp4`);
    const videoPath = path.join(tempDir, `${title}-video.tmp.mp4`);

    let videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });

    if (requestedQuality) {
        const match = info.formats.find(
            (f) =>
                f.hasVideo &&
                !f.hasAudio &&
                f.qualityLabel?.toLowerCase() === requestedQuality
        );

        if (match) {
            videoFormat = match;
        } else {
            console.warn(`Quality "${requestedQuality}" not available. Using best available.`);
        }
    }

    console.log('\nDownloading video and audio streams.');

    await new Promise<void>((resolve, reject) => {
        ytdl.downloadFromInfo(info, { format: videoFormat })
            .pipe(createWriteStream(videoPath))
            .on('finish', () => resolve())
            .on('error', reject);
    });

    await new Promise<void>((resolve, reject) => {
        ytdl(url, { quality: 'highestaudio' })
            .pipe(createWriteStream(audioPath))
            .on('finish', () => resolve())
            .on('error', reject);
    });

    console.log('Merging video and audio.');

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoPath)
            .input(audioPath)
            .videoCodec('copy')
            .audioCodec('copy')
            .format('mp4')
            .on('error', reject)
            .on('end', async () => {
                console.log(`Saved: ${outputPath}`);
                await unlinkAsync(videoPath).catch(() => { });
                await unlinkAsync(audioPath).catch(() => { });
                resolve();
            })
            .save(outputPath);
    });
}
