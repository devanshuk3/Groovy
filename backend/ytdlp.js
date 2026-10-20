const youtubedl = require("youtube-dl-exec");

async function getAudioUrl(url) {
    const result = await youtubedl(url, {
        getUrl: true,
        format: "bestaudio[ext=m4a]/bestaudio"
    });

    return String(result).split('\n')[0].trim();
}

async function searchYoutube(query) {
    const result = await youtubedl(`ytsearch15:${query}`, {
        dumpSingleJson: true,
        skipDownload: true,
        noWarnings: true,
    }
    );

    return result.entries.map(video => ({
        id: video.id,
        title: video.title,
        url: video.webpage_url,
        duration: video.duration,
        uploader: video.uploader,
        thumbnail: video.thumbnail,

    }))
}
module.exports = {
    getAudioUrl,
    searchYoutube,
};
