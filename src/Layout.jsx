import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { 
        LayoutDashboard, 
        Search, 
        Settings, 
        LogOut, 
        Crown,
        Menu,
        X,
        Layers,
        Clock,
        User,
        HelpCircle,
        Compass,
        Sparkles,
        Briefcase,
        ChevronLeft,
        ChevronRight
      } from 'lucide-react';
import FeasixWordmark from '@/components/brand/FeasixWordmark';
import FeasixIcon from '@/components/brand/FeasixIcon';
import FeasixBot from '@/components/FeasixBot';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WelcomeOverlay from '@/components/WelcomeOverlay';
import FeasixSidebarAdvice from '@/components/FeasixSidebarAdvice';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AnalysisProgressCard from '@/components/ui/AnalysisProgressCard';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Layout({ children, currentPageName }) {
  const { user, isLoadingAuth, isLoadingPublicSettings, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('preparing');
  const [analysisVideoTitle, setAnalysisVideoTitle] = useState('');
  const [analysisVideoId, setAnalysisVideoId] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('feasix-welcome-seen');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (isLoadingAuth || isLoadingPublicSettings) return;

    if (!user) {
      if (currentPageName !== 'LandingPage') {
        navigate(createPageUrl('LandingPage'));
      }
    } else {
      if (!user.onboarding_complete && currentPageName !== 'Onboarding') {
        navigate(createPageUrl('Onboarding'));
      }
    }
  }, [user, isLoadingAuth, isLoadingPublicSettings, currentPageName, navigate]);

  useEffect(() => {
    const analyzing = sessionStorage.getItem('feasix-analyzing-video');
    if (!analyzing) {
      setShowCard(false);
      return;
    }

    const checkAnalysisStatus = async () => {
      const step = sessionStorage.getItem('feasix-analysis-step');
      const title = sessionStorage.getItem('feasix-analysis-title');

      setShowCard(true);
      if (title) setAnalysisVideoTitle(title);
      if (step) setAnalysisStep(step);
      
      try {
        const { videoId } = JSON.parse(analyzing);
        if (videoId) {
          setAnalysisVideoId(videoId);
          const videos = await base44.entities.Video.filter({ id: videoId });
          
          if (videos.length > 0) {
            const video = videos[0];
            if (video.friction_analysis || video.eight_dimension_analysis || video.rating) {
              setAnalysisStep('complete');
              toast.success('Video analysis complete!', {
                description: title || 'Your video has been analyzed',
                duration: 5000
              });
              clearInterval(interval);
            }
          }
        }
      } catch (error) {
        console.error('Error checking analysis status:', error);
      }
    };

    checkAnalysisStatus();
    const interval = setInterval(checkAnalysisStatus, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (isLoadingAuth || isLoadingPublicSettings) {
    return <div className="min-h-screen bg-zinc-950" />;
  }

  if (!user) {
    if (currentPageName === 'LandingPage') {
      return children;
    }
    return null;
  }

  if (currentPageName === 'LandingPage' || currentPageName === 'Onboarding') {
    return children;
  }
  
  const navItems = [
    { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
    { name: 'Discover Ventures', page: 'VentureDiscovery', icon: Compass },
    { name: 'Analyze', page: 'Analyze', icon: Search },
    { name: 'Sessions', page: 'Sessions', icon: Layers },
    { name: 'Personal Context', page: 'PersonalContext', icon: User },
    { name: 'Chat with Feasix', page: 'AIChat', icon: HelpCircle },
    { name: 'History', page: 'EvaluationHistory', icon: Clock },
    { name: 'Settings', page: 'Settings', icon: Settings },
  ];
  
  const NavContent = () => (
    <div className="flex flex-col h-full bg-zinc-950/50 backdrop-blur-xl overflow-visible">
      {/* Sidebar Header with Branding & NEW Top Tabs */}
      <div className="p-6 border-b border-zinc-800/50 overflow-visible">
        <div className="flex items-center justify-between mb-8">
          <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
            <FeasixIcon className="h-6 w-6 text-teal-400" />
            <span className="text-xl font-bold text-zinc-100 tracking-tighter">FEASIX</span>
          </Link>
          <button onClick={() => logout()} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Feature Tabs Container */}
        <div className="flex items-center justify-between gap-1 p-1 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl mb-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={createPageUrl('Pricing')} className="flex-1 flex justify-center py-2.5 rounded-xl hover:bg-zinc-800 transition-all group">
                  <Crown className="h-4 w-4 text-amber-400 group-hover:scale-110 transition-transform" />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-800 text-zinc-100">Upgrade to Pro</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={createPageUrl('PersonalContext')} className="flex-1 flex justify-center py-2.5 rounded-xl hover:bg-zinc-800 transition-all group">
                  <User className="h-4 w-4 text-zinc-400 group-hover:text-teal-400 transition-colors" />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-800 text-zinc-100">Personal Context</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setShowWelcome(true)} className="flex-1 flex justify-center py-2.5 rounded-xl hover:bg-zinc-800 transition-all group">
                  <HelpCircle className="h-4 w-4 text-zinc-400 group-hover:text-blue-400 transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-800 text-zinc-100">Help & Tutorials</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link to={createPageUrl('Onboarding')} className="flex-1 flex justify-center py-2.5 rounded-xl hover:bg-zinc-800 transition-all group">
                  <Briefcase className="h-4 w-4 text-zinc-600 group-hover:text-zinc-200 transition-colors" />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-800 text-zinc-100">Onboarding Flow</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Advisor Section - Takes up the main space. Removed overflow-y-auto to fix bubble clipping. */}
      <div className="flex-1 overflow-visible">
        <FeasixSidebarAdvice />
      </div>
      
      {/* Analysis Progress Card */}
      {showCard && (
        <div className="px-5 pb-5">
          <AnalysisProgressCard
            currentStep={analysisStep}
            videoTitle={analysisVideoTitle}
            videoId={analysisVideoId}
            onDismiss={() => {
              setShowCard(false);
              sessionStorage.removeItem('feasix-analyzing-video');
              sessionStorage.removeItem('feasix-analysis-step');
              sessionStorage.removeItem('feasix-analysis-title');
              setAnalysisVideoId('');
            }}
          />
        </div>
      )}
      
      {/* Footer Branding */}
      <div className="p-6 border-t border-zinc-800/50 bg-zinc-950/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-zinc-200 truncate">{user.full_name || 'User'}</p>
            <p className="text-[9px] text-zinc-500 truncate uppercase tracking-tighter">Authorized Venture Expert</p>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="min-h-screen bg-zinc-950">
      <style>{`
        :root {
          --background: 9 9 11;
          --foreground: 250 250 250;
        }
        body {
          background-color: rgb(9, 9, 11);
          color: rgb(250, 250, 250);
        }
        p, span, li, h1, h2, h3, h4, h5, h6, td, th, blockquote {
          user-select: text;
          cursor: text;
        }
      `}</style>
      
      {/* Welcome Overlay */}
      {showWelcome && <WelcomeOverlay onClose={() => setShowWelcome(false)} />}
      
      {/* Desktop Sidebar - WIDENED TO w-80. Using overflow-visible to allow AI bubble to escape. */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-80 lg:flex-col border-r border-zinc-800/50 bg-zinc-950 z-40 shadow-2xl overflow-visible">
        <NavContent />
      </aside>
      
      {/* Top Header - Offset by 80 (320px) */}
      <header className="fixed top-0 left-0 right-0 lg:left-80 h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 z-50 transition-all duration-300">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center gap-4">
             {/* History Navigation Arrows */}
             <div className="hidden lg:flex items-center gap-1 border border-zinc-800 bg-zinc-900/50 p-1 rounded-xl">
               <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all"
               >
                 <ChevronLeft className="h-4 w-4" />
               </Button>
               <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(1)}
                className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all"
               >
                 <ChevronRight className="h-4 w-4" />
               </Button>
             </div>
             
             <button onClick={() => navigate(createPageUrl('Dashboard'))} className="lg:hidden">
              <FeasixIcon className="w-6 h-6 text-teal-400" />
             </button>
             <div className="hidden lg:flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-teal-500/50" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{currentPageName} Mode Active</span>
             </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 px-4 bg-zinc-900 border border-zinc-800 text-zinc-100 hover:bg-zinc-800 transition-all rounded-full overflow-hidden group">
                  <div className="flex items-center gap-2 relative">
                    <FeasixIcon className="w-4 h-4 text-teal-400" />
                    <span className="font-bold text-sm tracking-tight">FEASIX</span>
                    <Menu className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 ml-1 transition-colors" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800 text-zinc-100" align="end shadow-2xl">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.page} asChild>
                      <Link to={createPageUrl(item.page)} className="flex items-center gap-2 cursor-pointer py-2.5">
                        <Icon className="w-4 h-4 text-zinc-400" />
                        <span>{item.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem onClick={() => logout()} className="text-red-400 focus:text-red-400 cursor-pointer py-2.5">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 text-zinc-400 hover:text-zinc-200">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 bg-zinc-950 border-zinc-800">
                <NavContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      
      {/* Main Content - Offset by 80 (320px) */}
      <main className="lg:pl-80 pt-16 min-h-screen pb-24 transition-all duration-300 bg-zinc-950">
        {children}
      </main>

      <FeasixBot />
    </div>
  );
}