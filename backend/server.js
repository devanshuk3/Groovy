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
        const result = await getAudioUrl(url);

        res.json({
            success: true,
            result,
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
