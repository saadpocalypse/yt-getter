
#  yt-getter

A TypeScript CLI tool to download audio (MP3) and video (MP4) from YouTube links. It uses `ffmpeg`, `ytdl-core`, and includes everything out of the box, no setup needed.

<br>

##  Features

-   Downloads YouTube audio 
-   Downloads YouTube videos
-   Bundles  `ffmpeg`  automatically
-   Convert audio to other formats:  `aac`,  `ogg`,  `wav`,  `flac`
-   Set custom video resolution using  `--quality`  (e.g.  `720p`,  `1080p`)
-   Specify output directory using  `--output`
-   Set custom filename for single video downloads using  `--name`
-   Accept multiple YouTube URLs as command-line arguments
-   Download from YouTube playlists
-   Read video and playlist URLs from a  `.txt`  batch file using  `--batch`
-   Validates and cleans filenames for safe saving
-   Displays download progress bars

<br>

##  Usage

Install Globally

```bash
npm install -g yt-getter
```
<br>

Download Audio (MP3)
```bash
yt-get -a "https://www.youtube.com/watch?v=VIDEO_ID"
```

<br>

Download Video (MP4 with Audio)
```bash
yt-get -v "https://www.youtube.com/watch?v=VIDEO_ID"
```
<br>

Download Both Audio and Video
```bash
yt-get -a -v "https://www.youtube.com/watch?v=VIDEO_ID"
```
<br>

Do wrap the YouTube URL in quotes to avoid shell interpretation issues (especially in zsh or fish).

For a complete list of commands, run
```bash
yt-get --help
```

<br>

##  Contributing

I welcome contributions!
Feel free to fork the project, submit issues, or open pull requests.

Check out the repository [here](https://github.com/saadpocalypse/yt-getter.git).

<br>

##  License

  

This extension is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.