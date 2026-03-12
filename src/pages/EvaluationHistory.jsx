import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import VideoCard from '@/components/dashboard/VideoCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Filter } from 'lucide-react';

export default function EvaluationHistory() {
  const [user, setUser] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const queryClient = useQueryClient();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
  };

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['allVideos', user?.email],
    queryFn: () => base44.entities.Video.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user
  });

  const deleteVideoMutation = useMutation({
    mutationFn: (videoId) => base44.entities.Video.delete(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allVideos', user?.email] });
    }
  });

  const handleDeleteVideo = (videoId) => {
    if (confirm('Delete this video evaluation?')) {
      deleteVideoMutation.mutate(videoId);
    }
  };

  // Filter videos
  let filteredVideos = videos;
  if (filterType === 'general') {
    filteredVideos = videos.filter(v => v.video_type === 'general');
  } else if (filterType === 'specific') {
    filteredVideos = videos.filter(v => v.video_type === 'specific');
  }

  // Sort videos
  if (sortBy === 'oldest') {
    filteredVideos = [...filteredVideos].reverse();
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <History className="h-7 w-7 text-zinc-400" />
          <h1 className="text-2xl lg:text-3xl font-semibold text-zinc-100">Evaluation History</h1>
        </div>
        <p className="text-zinc-500">
          All your analyzed videos ({filteredVideos.length})
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-zinc-500" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36 bg-zinc-900/50 border-zinc-800">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="specific">Specific</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36 bg-zinc-900/50 border-zinc-800">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Videos List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 bg-zinc-800/50" />
          ))}
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVideos.map((video) => (
            <VideoCard 
              key={video.id} 
              video={video}
              onDelete={handleDeleteVideo}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-zinc-500">No videos found</p>
        </div>
      )}
    </div>
  );
}