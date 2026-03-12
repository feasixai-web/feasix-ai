import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoCard from '@/components/dashboard/VideoCard';
import AccumulationPanel from '@/components/analysis/AccumulationPanel';
import { ArrowLeft, AlertTriangle, CheckCircle, Zap, Lock, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Category() {
  const [user, setUser] = useState(null);
  const [accumulatedVideos, setAccumulatedVideos] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('id');
  
  useEffect(() => {
    loadUser();
  }, []);
  
  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
  };
  
  const { data: category, isLoading: loadingCategory } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      const cats = await base44.entities.Category.filter({ id: categoryId });
      return cats[0];
    },
    enabled: !!categoryId
  });
  
  const { data: videos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ['category-videos', categoryId],
    queryFn: () => base44.entities.Video.filter({ category_id: categoryId }),
    enabled: !!categoryId
  });
  
  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.email],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ created_by: user?.email });
      return subs[0] || { tier: 'free' };
    },
    enabled: !!user
  });
  
  const isPaid = subscription?.tier === 'paid';
  
  const handleAccumulate = (video) => {
    if (accumulatedVideos.find(v => v.id === video.id)) return;
    if (!isPaid && accumulatedVideos.length >= 3) return;
    setAccumulatedVideos([...accumulatedVideos, video]);
  };
  
  const handleRemove = (videoId) => {
    setAccumulatedVideos(accumulatedVideos.filter(v => v.id !== videoId));
  };
  
  const handleAnalyze = async () => {
    if (accumulatedVideos.length < 3) return;
    setIsGenerating(true);
    
    try {
      // Create accumulation session
      const session = await base44.entities.AccumulationSession.create({
        category_id: categoryId,
        video_ids: accumulatedVideos.map(v => v.id),
        status: 'analyzing'
      });
      
      // Redirect to roadmap generation
      window.location.href = createPageUrl(`Roadmap?session=${session.id}`);
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
    }
  };
  
  const watchVideos = videos.filter(v => v.rating === 'watch');
  const skimVideos = videos.filter(v => v.rating === 'skim');
  const skipVideos = videos.filter(v => v.rating === 'skip');
  
  if (loadingCategory) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64 bg-zinc-800/50 mb-4" />
        <Skeleton className="h-4 w-96 bg-zinc-800/50" />
      </div>
    );
  }
  
  if (!category) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
          <p className="text-zinc-400">Category not found</p>
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="outline" className="mt-4 border-zinc-700 text-zinc-300">
              Return to Dashboard
            </Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link to={createPageUrl('Dashboard')} className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl lg:text-3xl font-semibold text-zinc-100">{category.name}</h1>
        <p className="mt-1 text-zinc-500">{category.description}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.core_requirements?.length > 0 && (
              <Card className="bg-zinc-900/50 border-zinc-800/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-medium text-zinc-200">Core Requirements</h3>
                </div>
                <ul className="space-y-2">
                  {category.core_requirements.slice(0, 4).map((req, i) => (
                    <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                      <span className="text-zinc-600">•</span>
                      {req.requirement}
                      {req.commonly_omitted && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-950/50 text-amber-400 rounded">Often omitted</span>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            
            {category.common_failure_points?.length > 0 && (
              <Card className="bg-zinc-900/50 border-zinc-800/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <h3 className="font-medium text-zinc-200">Common Failures</h3>
                </div>
                <ul className="space-y-2">
                  {category.common_failure_points.slice(0, 4).map((fp, i) => (
                    <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                      <span className="text-zinc-600">•</span>
                      {fp.point}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
          
          {/* Videos Tabs */}
          <Tabs defaultValue="watch" className="w-full">
            <TabsList className="bg-zinc-900/50 border border-zinc-800/50">
              <TabsTrigger value="watch" className="data-[state=active]:bg-emerald-950/50 data-[state=active]:text-emerald-400">
                Watch ({watchVideos.length})
              </TabsTrigger>
              <TabsTrigger value="skim" className="data-[state=active]:bg-amber-950/50 data-[state=active]:text-amber-400">
                Skim ({skimVideos.length})
              </TabsTrigger>
              <TabsTrigger value="skip" className="data-[state=active]:bg-red-950/50 data-[state=active]:text-red-400">
                Skip ({skipVideos.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="watch" className="mt-4 space-y-4">
              {loadingVideos ? (
                <Skeleton className="h-32 bg-zinc-800/50" />
              ) : watchVideos.length > 0 ? (
                watchVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    showDetails={true}
                    isAccumulated={accumulatedVideos.some(v => v.id === video.id)}
                    onAccumulate={handleAccumulate}
                    canAccumulate={isPaid || accumulatedVideos.length < 3}
                  />
                ))
              ) : (
                <Card className="bg-zinc-900/30 border-zinc-800/50 p-6 text-center">
                  <p className="text-zinc-500">No watch-worthy videos found yet</p>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="skim" className="mt-4 space-y-4">
              {skimVideos.length > 0 ? (
                skimVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isAccumulated={accumulatedVideos.some(v => v.id === video.id)}
                    onAccumulate={handleAccumulate}
                    canAccumulate={isPaid || accumulatedVideos.length < 3}
                  />
                ))
              ) : (
                <Card className="bg-zinc-900/30 border-zinc-800/50 p-6 text-center">
                  <p className="text-zinc-500">No skim videos found</p>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="skip" className="mt-4 space-y-4">
              {skipVideos.length > 0 ? (
                skipVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))
              ) : (
                <Card className="bg-zinc-900/30 border-zinc-800/50 p-6 text-center">
                  <p className="text-zinc-500">No skip videos found</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <AccumulationPanel
            videos={accumulatedVideos}
            onRemove={handleRemove}
            onAnalyze={handleAnalyze}
            isAnalyzing={isGenerating}
            isPaid={isPaid}
            minVideos={3}
            maxVideos={3}
          />
          
          {/* Capability Sensitivities */}
          {category.capability_sensitivities?.length > 0 && (
            <Card className="mt-4 bg-zinc-900/50 border-zinc-800/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-blue-400" />
                <h3 className="font-medium text-zinc-200">Feasibility Factors</h3>
              </div>
              <ul className="space-y-3">
                {category.capability_sensitivities.map((cap, i) => (
                  <li key={i} className="text-sm">
                    <p className="text-zinc-300">{cap.factor}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{cap.description}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}