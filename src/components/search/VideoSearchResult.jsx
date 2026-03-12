import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Eye, Bookmark, BookmarkCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function VideoSearchResult({ video, onClick, onSave, isAnalyzed, isSaved }) {
  return (
    <Card className="bg-zinc-800/40 border-zinc-700/40 overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Thumbnail */}
        <div 
          className="relative flex-shrink-0 cursor-pointer" 
          onClick={onClick}
        >
          <img 
            src={video.thumbnail} 
            alt={video.title}
            className="w-40 h-24 object-cover rounded-lg"
          />
          {isAnalyzed && (
            <Badge className="absolute top-2 right-2 bg-teal-600 text-white text-xs">
              Analyzed
            </Badge>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          <h3 className="text-sm font-medium text-zinc-200 line-clamp-2 mb-2 hover:text-zinc-100">
            {video.title}
          </h3>
          <p className="text-xs text-zinc-400 mb-2">{video.channelTitle}</p>
          <p className="text-xs text-zinc-500 line-clamp-2 mb-2">
            {video.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(video.publishedAt), 'MMM d, yyyy')}
            </span>
            {!isAnalyzed && (
              <span className="flex items-center gap-1 text-amber-400">
                <Eye className="h-3 w-3" />
                Not analyzed yet
              </span>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex-shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            disabled={isSaved}
            className={`${
              isSaved 
                ? 'text-amber-400 hover:text-amber-300' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="h-4 w-4 mr-1" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="h-4 w-4 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}