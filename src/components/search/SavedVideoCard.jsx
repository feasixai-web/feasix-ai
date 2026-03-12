import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function SavedVideoCard({ video, onAnalyze, onRemove }) {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    navigate(createPageUrl('VideoPlayer'), {
      state: {
        video: {
          videoId: video.youtube_id,
          title: video.title,
          channelTitle: video.channel_title,
          thumbnail: video.thumbnail,
          description: video.description,
          publishedAt: video.published_at
        },
        searchResults: [],
        currentIndex: 0,
        savedVideos: [],
        existingSessions: []
      }
    });
  };
  
  return (
    <Card 
      className="bg-zinc-800/40 border-zinc-700/40 overflow-hidden cursor-pointer hover:bg-zinc-800/60 transition-colors"
      onClick={handleCardClick}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-32 h-20 object-cover rounded-lg"
          />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-zinc-200 line-clamp-2 mb-1">
            {video.title}
          </h3>
          <p className="text-xs text-zinc-400 mb-1">{video.channel_title}</p>
          <p className="text-xs text-zinc-500">
            Saved {video.created_date && format(new Date(video.created_date), 'MMM d, yyyy')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze(video);
            }}
            className="bg-teal-600 hover:bg-teal-500 text-white text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Analyze
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(video.id);
            }}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    </Card>
  );
}