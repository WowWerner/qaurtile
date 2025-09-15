import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Pin, PinOff, Plus, X, Building, Brain, Users, BarChart3, UserCheck, DollarSign, Target, Activity, Trash2, ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserInteractionsService } from '../utils/userInteractions';
import { cn } from '../lib/utils';

const iconMap = {
  Building,
  Brain,
  Users,
  BarChart3,
  UserCheck,
  DollarSign,
  Target,
  Activity,
  Clock,
  Pin
};

interface QuickLinksSectionProps {
  className?: string;
}

export function QuickLinksSection({ className }: QuickLinksSectionProps) {
  const navigate = useNavigate();
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [pinnedItems, setPinnedItems] = useState<any[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'recent' | 'pinned' | 'quick'>('recent');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const recent = UserInteractionsService.getRecentItems();
    const pinned = UserInteractionsService.getPinnedItems();
    setRecentItems(recent);
    setPinnedItems(pinned);
  };

  const handleItemClick = (item: any) => {
    // Track this interaction
    UserInteractionsService.trackInteraction({
      id: item.id || item.path,
      title: item.title,
      path: item.path,
      icon: item.icon,
      type: 'page',
      category: item.category || 'Navigation'
    });

    navigate(item.path);
    
    // Refresh data after navigation
    setTimeout(loadUserData, 100);
  };

  const handlePinItem = (item: any) => {
    const success = UserInteractionsService.pinItem({
      id: item.id || item.path,
      title: item.title,
      path: item.path,
      icon: item.icon,
      category: item.category || 'General'
    });

    if (success) {
      loadUserData();
    }
  };

  const handleUnpinItem = (itemId: string) => {
    UserInteractionsService.unpinItem(itemId);
    loadUserData();
  };

  const handleClearRecent = () => {
    UserInteractionsService.clearRecentItems();
    loadUserData();
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Target;
    return IconComponent;
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const quickActions = UserInteractionsService.getQuickActions();

  // Calculate total activity count
  const totalActivity = recentItems.length + pinnedItems.length;

  return (
    <div className={cn("fixed bottom-8 right-8 z-40", className)}>
      {/* Sleek Tab Container */}
      <div className={cn(
        "bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-2xl shadow-gray-900/20 transition-all duration-500 ease-out",
        isExpanded ? "w-96 h-96" : "w-16 h-16"
      )}>
        
        {/* Toggle Button */}
        <div 
          className="absolute top-0 left-0 w-16 h-16 flex items-center justify-center cursor-pointer group rounded-2xl transition-all duration-300 hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="relative">
            <Zap 
              size={20} 
              strokeWidth={1.5} 
              className={cn(
                "text-[rgb(0,171,174)] transition-all duration-300",
                isExpanded ? "rotate-180" : "rotate-0 group-hover:scale-110"
              )} 
            />
            {totalActivity > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[rgb(0,171,174)] rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">{totalActivity > 9 ? '9+' : totalActivity}</span>
              </div>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        <div className={cn(
          "transition-all duration-500 ease-out overflow-hidden",
          isExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          {/* Tab Header */}
          <div className="pt-20 px-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light text-gray-800">Quick Access</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={14} strokeWidth={1.5} className="text-gray-400" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('recent')}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  activeTab === 'recent'
                    ? "bg-white text-[rgb(0,171,174)] shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                )}
              >
                Recent
                {recentItems.length > 0 && (
                  <span className="ml-1 text-xs">{recentItems.length}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('pinned')}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  activeTab === 'pinned'
                    ? "bg-white text-[rgb(0,171,174)] shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                )}
              >
                Pinned
                {pinnedItems.length > 0 && (
                  <span className="ml-1 text-xs">{pinnedItems.length}</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('quick')}
                className={cn(
                  "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  activeTab === 'quick'
                    ? "bg-white text-[rgb(0,171,174)] shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                )}
              >
                Quick
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 pb-6 h-64 overflow-y-auto">
            {/* Recent Items Tab */}
            {activeTab === 'recent' && (
              <div className="space-y-2">
                {recentItems.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Recently Viewed</span>
                      <Button
                        onClick={handleClearRecent}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      >
                        <Trash2 size={12} strokeWidth={1.5} />
                      </Button>
                    </div>
                    {recentItems.slice(0, 8).map((item) => {
                      const IconComponent = getIconComponent(item.icon);
                      const isPinned = UserInteractionsService.isItemPinned(item.id);
                      
                      return (
                        <div
                          key={item.id}
                          className="group flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-all duration-200"
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="flex items-center space-x-2">
                            <IconComponent 
                              size={14} 
                              strokeWidth={1.5} 
                              className="text-gray-600 group-hover:text-gray-800 transition-colors" 
                            />
                            <div>
                              <div className="font-medium text-gray-800 text-sm">
                                {item.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatTimestamp(item.timestamp)}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isPinned) {
                                handleUnpinItem(item.id);
                              } else {
                                handlePinItem(item);
                              }
                            }}
                            className={cn(
                              "p-1 rounded-md transition-all duration-200",
                              isPinned
                                ? "text-[rgb(0,171,174)] hover:bg-gray-200"
                                : "text-gray-400 hover:text-[rgb(0,171,174)] hover:bg-gray-200 opacity-0 group-hover:opacity-100"
                            )}
                          >
                            {isPinned ? (
                              <PinOff size={12} strokeWidth={1.5} />
                            ) : (
                              <Pin size={12} strokeWidth={1.5} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Clock size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            )}

            {/* Pinned Items Tab */}
            {activeTab === 'pinned' && (
              <div className="space-y-2">
                {pinnedItems.length > 0 ? (
                  <>
                    <div className="text-sm font-medium text-gray-700 mb-3">Pinned Items</div>
                    {pinnedItems.map((item) => {
                      const IconComponent = getIconComponent(item.icon);
                      return (
                        <div
                          key={item.id}
                          className="group relative flex items-center space-x-2 p-2 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-all duration-200"
                          onClick={() => handleItemClick(item)}
                        >
                          <IconComponent 
                            size={14} 
                            strokeWidth={1.5} 
                            className="text-[rgb(0,171,174)] flex-shrink-0" 
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 text-sm truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.category}
                            </div>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnpinItem(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-red-500 hover:bg-red-100 transition-all duration-200"
                          >
                            <X size={10} strokeWidth={2} />
                          </button>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Pin size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No pinned items</p>
                  </div>
                )}
              </div>
            )}

            {/* Quick Actions Tab */}
            {activeTab === 'quick' && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700 mb-3">Quick Actions</div>
                {quickActions
                  .filter(action => !UserInteractionsService.isItemPinned(action.id))
                  .map((action) => {
                    const IconComponent = getIconComponent(action.icon);
                    return (
                      <div
                        key={action.id}
                        className="group flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-[rgb(0,171,174)]/5 cursor-pointer transition-all duration-200"
                        onClick={() => handleItemClick(action)}
                      >
                        <div className="flex items-center space-x-2">
                          <IconComponent 
                            size={14} 
                            strokeWidth={1.5} 
                            className="text-gray-600 group-hover:text-[rgb(0,171,174)] transition-colors" 
                          />
                          <div>
                            <div className="font-medium text-gray-800 text-sm group-hover:text-[rgb(0,171,174)] transition-colors">
                              {action.title}
                            </div>
                            <div className="text-xs text-gray-500">{action.category}</div>
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinItem(action);
                          }}
                          className="p-1 rounded-md text-gray-400 hover:text-[rgb(0,171,174)] hover:bg-[rgb(0,171,174)]/10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <Pin size={12} strokeWidth={1.5} />
                        </button>
                      </div>
                    );
                  })}
                
                {quickActions.filter(action => !UserInteractionsService.isItemPinned(action.id)).length === 0 && (
                  <div className="text-center py-8">
                    <Target size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">All actions pinned</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button when collapsed */}
      {!isExpanded && totalActivity > 0 && (
        <div 
          className="absolute -top-2 -left-2 w-16 h-16 rounded-full bg-gradient-to-br from-[rgb(0,171,174)] to-[rgb(0,151,154)] shadow-xl shadow-[rgb(0,171,174)]/30 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl"
          onClick={() => setIsExpanded(true)}
        >
          <div className="text-center">
            <div className="text-white font-bold text-base">{totalActivity > 99 ? '99+' : totalActivity}</div>
            <div className="text-white/80 text-xs font-light">items</div>
          </div>
        </div>
      )}
    </div>
  );
}