import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, X, AlertCircle, Layers, PlayCircle, ExternalLink, Bookmark, BookmarkCheck } from 'lucide-react';

export default function VideoPlayerModal({ 
  video, 
  isOpen, 
  onClose, 
  onAnalyze,
  onSave,
  isAnalyzing,
  isAnalyzed,
  isSaved,
  existingSessions = [],
  videoType,
  setVideoType,
  userLevel,
  setUserLevel,
  selectedNiche,
  setSelectedNiche,
  newNicheName,
  setNewNicheName
}) {

  if (!video) return null;

  const handleAnalyze = () => {
    if (videoType === 'specific' && selectedNiche === 'new' && !newNicheName.trim()) {
      return;
    }
    onAnalyze({
      videoType,
      userLevel,
      selectedNiche: selectedNiche === 'new' ? newNicheName : selectedNiche
    });
  };

  const canAnalyze = videoType && userLevel && 
    (videoType === 'general' || (videoType === 'specific' && (selectedNiche !== 'new' || newNicheName.trim())));

  const handleSaveClick = () => {
    onSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 pr-20">{video.title}</DialogTitle>
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSaveClick}
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
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          {isAnalyzed && (
            <Badge className="bg-teal-600 text-white">
              ✓ Already Analyzed
            </Badge>
          )}

          {/* YouTube Player */}
          <div className="aspect-video w-full bg-zinc-950 rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${video.videoId}`}
              title={video.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Video Details */}
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">{video.channelTitle}</p>
            <p className="text-sm text-zinc-300">{video.description}</p>
            <a
              href={`https://youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300"
            >
              <ExternalLink className="h-4 w-4" />
              Open in YouTube
            </a>
          </div>

          {/* Analysis Section */}
          {!isAnalyzed && (
            <div className="border-t border-zinc-800 pt-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-950/20 border border-blue-800/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-300 mb-1">Ready to Analyze?</h4>
                  <p className="text-xs text-blue-400/90">
                    Analysis will fetch the transcript, extract execution steps, and store results in your session.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Video Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVideoType('general')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        videoType === 'general'
                          ? 'border-zinc-100 bg-zinc-800/50'
                          : 'border-zinc-700/50 bg-zinc-900/30 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-200">General</span>
                      </div>
                      <p className="text-xs text-zinc-500 text-left">Multiple ventures</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVideoType('specific')}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        videoType === 'specific'
                          ? 'border-zinc-100 bg-zinc-800/50'
                          : 'border-zinc-700/50 bg-zinc-900/30 hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <PlayCircle className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-200">Specific</span>
                      </div>
                      <p className="text-xs text-zinc-500 text-left">One venture</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Your Experience Level</Label>
                  <Select value={userLevel} onValueChange={setUserLevel}>
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-zinc-100">
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="novice">Novice</SelectItem>
                      <SelectItem value="seasoned">Seasoned</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {videoType === 'specific' && (
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Niche/Venture</Label>
                    <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                      <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-zinc-100">
                        <SelectValue placeholder="Select existing or create new" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingSessions.map((session) => (
                          <SelectItem key={session.id} value={session.genre}>
                            {session.genre}
                          </SelectItem>
                        ))}
                        <SelectItem value="new">+ Create New Niche</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {selectedNiche === 'new' && (
                      <Input
                        placeholder="Enter niche name (e.g., Amazon FBA, SaaS)"
                        value={newNicheName}
                        onChange={(e) => setNewNicheName(e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                      />
                    )}
                  </div>
                )}

                <Button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze || isAnalyzing}
                  className="w-full bg-teal-600 hover:bg-teal-500 text-white disabled:bg-zinc-700 disabled:text-zinc-400"
                >
                  {isAnalyzing ? (
                    <>Analyzing...</>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze This Video
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}