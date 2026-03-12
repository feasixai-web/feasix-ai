import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import CategoryCard from '@/components/dashboard/CategoryCard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, FolderOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Categories() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    loadUser();
  }, []);
  
  const loadUser = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);
    } catch (e) {}
  };
  
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list()
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
  
  const { data: videosByCategory = {} } = useQuery({
    queryKey: ['videos-by-category'],
    queryFn: async () => {
      const videos = await base44.entities.Video.list();
      const counts = {};
      videos.forEach(v => {
        counts[v.category_id] = (counts[v.category_id] || 0) + 1;
      });
      return counts;
    }
  });
  
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-zinc-100">Categories</h1>
          <p className="mt-1 text-zinc-500">
            Browse advice categories with pre-defined requirement models
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
      </div>
      
      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 bg-zinc-800/50" />
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              videosAnalyzed={videosByCategory[category.id] || 0}
              isLocked={!isPaid && index > 0}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-zinc-900/50 border-zinc-800/50 p-8 text-center">
          <FolderOpen className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">
            {searchQuery ? 'No categories match your search' : 'No categories available'}
          </p>
        </Card>
      )}
    </div>
  );
}