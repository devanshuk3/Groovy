const express = require('express');
const youtubedl = require("youtube-dl-exec");

const { getAudioUrl, searchYoutube, } = require("./ytdlp");

const app = express()
app.use(express.json());

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`server listening on port:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Error: Port ${PORT} is already in use. Kill existing process or set PORT environment variable.`);
    } else {
        console.error('Server error:', err);
    }
});

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const CACHE_DIR = path.join(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getVideoId(url) {
    const match = url.match(/(?:v=|\/|youtu\.be\/)([0-9A-Za-z_-]{11})/);
    if (match) return match[1];
    return crypto.createHash('md5').update(url).digest('hex');
}

// GET endpoint to stream audio directly from yt-dlp with caching
app.get("/api/stream", async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send("URL parameter is required");
    }

    const videoId = getVideoId(url);
    const cacheFile = path.join(CACHE_DIR, `${videoId}.m4a`);
    const tempFile = path.join(CACHE_DIR, `${videoId}.tmp.m4a`);

    // 1. If cached on disk, serve directly (supports HTTP Range / 206 Partial Content out of the box)
    if (fs.existsSync(cacheFile)) {
        console.log(`⚡ Serving cached audio for: ${videoId}`);
        return res.sendFile(cacheFile);
    }

    try {
        console.log(`🎵 Streaming from yt-dlp for: ${videoId}`);
        const subprocess = youtubedl.exec(url, {
            output: '-',
            format: "bestaudio[ext=m4a]/bestaudio",
        });

        res.setHeader('Content-Type', 'audio/mp4');
        res.setHeader('Accept-Ranges', 'none');

        // Pipe stream directly to client
        subprocess.stdout.pipe(res);

        // Also write to temporary cache file
        const fileStream = fs.createWriteStream(tempFile);
        subprocess.stdout.pipe(fileStream);

        subprocess.on('close', (code) => {
            fileStream.end();
            if (code === 0 && fs.existsSync(tempFile)) {
                try {
                    fs.renameSync(tempFile, cacheFile);
                    console.log(`✅ Cached audio successfully: ${videoId}`);
                } catch (e) {
                    console.warn('Cache rename failed:', e);
                }
            } else {
                try { fs.unlinkSync(tempFile); } catch (e) { }
            }
        });

        subprocess.on('error', (err) => {
            console.error('yt-dlp stream error:', err);
            fileStream.end();
            try { fs.unlinkSync(tempFile); } catch (e) { }
            if (!res.headersSent) {
                res.status(500).send('Streaming failed');
            }
        });

        req.on('close', () => {
            if (!res.writableEnded) {
                // Client aborted request before finished
            }
        });
    } catch (err) {
        console.error('Error in /api/stream:', err);
        if (!res.headersSent) {
            res.status(500).send('Streaming failed: ' + err.message);
        }
    }
});

//post endpoint to get the audio url from the user
app.post("/api/url", async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            success: false,
            message: "URL is required"
        });
    }
    try {
        // Return reliable streaming proxy URL from this backend
        const host = req.get('host') || `localhost:${PORT}`;
        const protocol = req.protocol || 'http';
        const streamUrl = `${protocol}://${host}/api/stream?url=${encodeURIComponent(url.trim())}`;

        res.json({
            success: true,
            result: streamUrl,
        });
    }
    catch (err) {
        console.error('Error in /api/url:', err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

//post endpoint to get the query from the user
app.post("/api/search", async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({
            success: false,
            message: "Query is required.",
        });
    }
    try {
        const results = await searchYoutube(query);

        res.json({
            success: true,
            results,
        });
    }
    catch (err) {
        console.error('Error in /api/search:', err);
        res.status(500).json({
            success: false,
            message: err.message,
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Backend is running' });
});
