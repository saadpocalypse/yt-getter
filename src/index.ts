#!/usr/bin/env node
import { Command } from 'commander';
import { downloadAudio, downloadVideo } from './downloader.js';
import { DownloadOptions } from './types.js';
import fs from 'node:fs';
import path from 'node:path';
import { getPlaylistVideoUrls } from './utils/playlist.js';
import { readUrlsFromFile } from './utils/batch.js';

const program = new Command();

program
    .name('yt-get')
    .description('Download audio (MP3) and/or video (MP4) from a YouTube link, playlist, or batch file.\n\nNote: Wrap the URL in quotes.')
    .option('-a, --audio', 'Download audio')
    .option('-v, --video', 'Download video')
    .option('-o, --output <directory>', 'Custom output directory')
    .option('-n, --name <name>', 'Custom base filename (only works for single video)')
    .option('-f, --format <ext>', 'Audio format: aac, ogg, wav, or flac (default: mp3)')
    .option('-q, --quality <resolution>', 'Video quality: 360p, 720p, 1080p, etc. (default: highest available)')
    .option('-b, --batch <file>', 'Read YouTube video/playlist URLs from a text file')
    .argument('[urls...]', 'One or more YouTube video or playlist URLs (wrap each in quotes)')
    .parse(process.argv);

const opts = program.opts<{
    audio?: boolean;
    video?: boolean;
    output?: string;
    name?: string;
    format?: string;
    quality?: string;
    batch?: string;
}>();

const outputDir = path.resolve(opts.output ?? process.cwd());

(async () => {
    try {
        const inputUrls: string[] = [];

        if (opts.batch) {
            inputUrls.push(...readUrlsFromFile(opts.batch));
        } else if (program.args.length > 0) {
            inputUrls.push(...program.args.map(url => url.trim().replace(/^"|"$/g, '')));
        }

        if (inputUrls.length === 0 || (!opts.audio && !opts.video)) {
            program.help();
        }

        if (!opts.audio && opts.format) {
            console.warn('--format only applies to audio downloads. Ignoring it.');
        }

        if (!fs.existsSync(outputDir) || !fs.statSync(outputDir).isDirectory()) {
            throw new Error(`Output directory does not exist: ${outputDir}`);
        }

        if (opts.name && inputUrls.length > 1) {
            console.warn('⚠️  --name is ignored when using multiple URLs. Each video will use its own title.');
        }

        let totalIndex = 1;

        for (const rawUrl of inputUrls) {
            const isPlaylist = rawUrl.includes('list=');
            const urls = isPlaylist ? await getPlaylistVideoUrls(rawUrl) : [rawUrl];

            if (isPlaylist && opts.name) {
                console.warn('⚠️  --name is ignored for playlists. Each video will use its own title.');
            }

            for (const videoUrl of urls) {
                console.log(`\n📦  Downloading item ${totalIndex}...`);

                const downloadOpts: DownloadOptions = {
                    outputDir,
                    filename: inputUrls.length > 1 || isPlaylist ? undefined : opts.name,
                    format: opts.format,
                    quality: opts.quality,
                };

                if (opts.audio) await downloadAudio(videoUrl, downloadOpts);
                if (opts.video) await downloadVideo(videoUrl, downloadOpts);

                totalIndex++;
            }
        }

    } catch (err) {
        console.error('❌  Error:', (err as Error).message);
        process.exit(1);
    }
})();
