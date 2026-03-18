import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query } = await req.json();

        if (!query) {
            return Response.json({ error: 'Query parameter is required' }, { status: 400 });
        }

        const youtubeApiKey = Deno.env.get("YoutubeAPI");
        if (!youtubeApiKey) {
            return Response.json({ error: 'YoutubeAPI key not configured' }, { status: 500 });
        }

        const youtubeResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${youtubeApiKey}`
        );

        if (!youtubeResponse.ok) {
            const errorText = await youtubeResponse.text();
            console.error(`YouTube API error: ${youtubeResponse.status} - ${errorText}`);
            return Response.json({ error: `Failed to search YouTube: ${errorText}` }, { status: youtubeResponse.status });
        }

        const youtubeData = await youtubeResponse.json();

        const results = youtubeData.items.map(item => ({
            videoId: item.id.videoId,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.high.url,
            publishedAt: item.snippet.publishedAt,
            description: item.snippet.description
        }));

        return Response.json({ results });

    } catch (error) {
        console.error('Error searching YouTube videos:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});