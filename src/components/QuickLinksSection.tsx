import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Pin, PinOff, Plus, X, Building, Brain, Users, BarChart3, UserCheck, DollarSign, Target, Activity, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UserInteractionsService } from '../utils/userInteractions';

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

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Pinned Items */}
      {pinnedItems.length > 0 && (
        <Card className="border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Pin size={18} strokeWidth={1.5} className="text-blue-600" />
                <span className="text-lg font-light text-blue-800">Quick Links</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {pinnedItems.length} pinned
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {pinnedItems.map((item) => {
                const IconComponent = getIconComponent(item.icon);
                return (
                  <div
                    key={item.id}
                    className="group relative bg-white p-4 rounded-xl border border-blue-200 hover:border-blue-300 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <IconComponent 
                        size={20} 
                        strokeWidth={1.5} 
                        className="text-blue-600 mb-2 group-hover:text-blue-700 transition-colors" 
                      />
                      <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors leading-tight">
                        {item.title}
                      </span>
                      <span className="text-xs text-blue-600 mt-1">
                        {item.category}
                      </span>
                    </div>
                    
                    {/* Unpin button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnpinItem(item.id);
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                    >
                      <X size={12} strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recently Viewed */}
        <Card className="border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock size={18} strokeWidth={1.5} className="text-gray-600" />
                <span className="text-lg font-light text-gray-800">Recently Viewed</span>
              </div>
              <div className="flex items-center space-x-2">
                {recentItems.length > 0 && (
                  <Button
                    onClick={handleClearRecent}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </Button>
                )}
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  {recentItems.length}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentItems.length > 0 ? (
              <div className="space-y-3">
                {recentItems.map((item) => {
                  const IconComponent = getIconComponent(item.icon);
                  const isPinned = UserInteractionsService.isItemPinned(item.id);
                  
                  return (
                    <div
                      key={item.id}
                      className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-all duration-200"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent 
                          size={16} 
                          strokeWidth={1.5} 
                          className="text-gray-600 group-hover:text-gray-800 transition-colors" 
                        />
                        <div>
                          <div className="font-medium text-gray-800 group-hover:text-gray-900 transition-colors">
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
                        className={`p-1.5 rounded-md transition-all duration-200 ${
                          isPinned
                            ? 'text-blue-600 hover:bg-blue-100'
                            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isPinned ? (
                          <PinOff size={14} strokeWidth={1.5} />
                        ) : (
                          <Pin size={14} strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-light">No recent activity</p>
                <p className="text-xs text-gray-400 mt-1">Your recently visited pages will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target size={18} strokeWidth={1.5} className="text-gray-600" />
                <span className="text-lg font-light text-gray-800">Quick Actions</span>
              </div>
              <Button
                onClick={() => setShowQuickActions(!showQuickActions)}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <Plus size={14} strokeWidth={1.5} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showQuickActions ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">Pin frequently used features:</div>
                {quickActions
                  .filter(action => !UserInteractionsService.isItemPinned(action.id))
                  .map((action) => {
                    const IconComponent = getIconComponent(action.icon);
                    return (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <IconComponent 
                            size={16} 
                            strokeWidth={1.5} 
                            className="text-gray-600" 
                          />
                          <div>
                            <div className="font-medium text-gray-800">{action.title}</div>
                            <div className="text-xs text-gray-500">{action.category}</div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => {
                            handlePinItem(action);
                            setShowQuickActions(false);
                          }}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        >
                          <Pin size={14} strokeWidth={1.5} />
                        </Button>
                      </div>
                    );
                  })}
                {quickActions.filter(action => !UserInteractionsService.isItemPinned(action.id)).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">All quick actions are already pinned</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 mb-3">Suggested actions based on your usage:</div>
                
                {/* Smart suggestions based on recent activity */}
                {recentItems.length > 0 ? (
                  <div className="space-y-2">
                    {quickActions
                      .filter(action => !UserInteractionsService.isItemPinned(action.id))
                      .slice(0, 3)
                      .map((action) => {
                        const IconComponent = getIconComponent(action.icon);
                        return (
                          <div
                            key={action.id}
                            className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-all duration-200"
                            onClick={() => handleItemClick(action)}
                          >
                            <div className="flex items-center space-x-3">
                              <IconComponent 
                                size={16} 
                                strokeWidth={1.5} 
                                className="text-gray-600 group-hover:text-blue-600 transition-colors" 
                              />
                              <div>
                                <div className="font-medium text-gray-800 group-hover:text-blue-800 transition-colors">
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
                              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition-all duration-200"
                            >
                              <Pin size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Target size={32} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-light mb-2">Pin your favorite features</p>
                    <Button
                      onClick={() => setShowQuickActions(true)}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 hover:text-blue-600 border-gray-300"
                    >
                      <Plus size={14} className="mr-2" />
                      Add Quick Actions
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Analytics */}
      {(recentItems.length > 0 || pinnedItems.length > 0) && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-light text-gray-800 flex items-center space-x-2">
              <Activity size={18} strokeWidth={1.5} />
              <span>Usage Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="text-2xl font-light text-blue-700">
                  {new Set(recentItems.map(item => item.category)).size}
                </div>
                <div className="text-sm text-blue-600">Categories Used</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="text-2xl font-light text-green-700">
                  {pinnedItems.length}
                </div>
                <div className="text-sm text-green-600">Pinned Items</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                <div className="text-2xl font-light text-purple-700">
                  {recentItems.length}
                </div>
                <div className="text-sm text-purple-600">Recent Views</div>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
                <div className="text-2xl font-light text-orange-700">
                  {recentItems.filter(item => {
                    const hoursSince = (Date.now() - item.timestamp) / (1000 * 60 * 60);
                    return hoursSince <= 24;
                  }).length}
                </div>
                <div className="text-sm text-orange-600">Today's Activity</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}