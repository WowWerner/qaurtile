interface InteractionItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  timestamp: number;
  type: 'page' | 'action';
  category?: string;
}

interface PinnedItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  category: string;
  pinnedAt: number;
}

export class UserInteractionsService {
  private static readonly RECENT_KEY = 'quartile_recent_views';
  private static readonly PINNED_KEY = 'quartile_pinned_items';
  private static readonly MAX_RECENT_ITEMS = 8;
  private static readonly MAX_PINNED_ITEMS = 6;

  // Track a user interaction
  static trackInteraction(item: Omit<InteractionItem, 'timestamp'>) {
    try {
      const recentItems = this.getRecentItems();
      const newItem: InteractionItem = {
        ...item,
        timestamp: Date.now()
      };

      // Remove if already exists and add to front
      const filteredItems = recentItems.filter(existing => existing.id !== item.id);
      const updatedItems = [newItem, ...filteredItems].slice(0, this.MAX_RECENT_ITEMS);

      localStorage.setItem(this.RECENT_KEY, JSON.stringify(updatedItems));
    } catch (error) {
      console.error('Failed to track interaction:', error);
    }
  }

  // Get recent items
  static getRecentItems(): InteractionItem[] {
    try {
      const stored = localStorage.getItem(this.RECENT_KEY);
      if (!stored) return [];
      
      const items: InteractionItem[] = JSON.parse(stored);
      // Filter out items older than 7 days
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      return items.filter(item => item.timestamp > weekAgo);
    } catch (error) {
      console.error('Failed to get recent items:', error);
      return [];
    }
  }

  // Pin an item
  static pinItem(item: Omit<PinnedItem, 'pinnedAt'>) {
    try {
      const pinnedItems = this.getPinnedItems();
      
      // Check if already pinned
      if (pinnedItems.some(pinned => pinned.id === item.id)) {
        return false; // Already pinned
      }

      const newPinnedItem: PinnedItem = {
        ...item,
        pinnedAt: Date.now()
      };

      const updatedItems = [newPinnedItem, ...pinnedItems].slice(0, this.MAX_PINNED_ITEMS);
      localStorage.setItem(this.PINNED_KEY, JSON.stringify(updatedItems));
      return true;
    } catch (error) {
      console.error('Failed to pin item:', error);
      return false;
    }
  }

  // Unpin an item
  static unpinItem(itemId: string) {
    try {
      const pinnedItems = this.getPinnedItems();
      const updatedItems = pinnedItems.filter(item => item.id !== itemId);
      localStorage.setItem(this.PINNED_KEY, JSON.stringify(updatedItems));
      return true;
    } catch (error) {
      console.error('Failed to unpin item:', error);
      return false;
    }
  }

  // Get pinned items
  static getPinnedItems(): PinnedItem[] {
    try {
      const stored = localStorage.getItem(this.PINNED_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to get pinned items:', error);
      return [];
    }
  }

  // Check if item is pinned
  static isItemPinned(itemId: string): boolean {
    return this.getPinnedItems().some(item => item.id === itemId);
  }

  // Clear recent items
  static clearRecentItems() {
    try {
      localStorage.removeItem(this.RECENT_KEY);
    } catch (error) {
      console.error('Failed to clear recent items:', error);
    }
  }

  // Clear pinned items
  static clearPinnedItems() {
    try {
      localStorage.removeItem(this.PINNED_KEY);
    } catch (error) {
      console.error('Failed to clear pinned items:', error);
    }
  }

  // Get predefined quick actions
  static getQuickActions(): Array<Omit<PinnedItem, 'pinnedAt'>> {
    return [
      {
        id: 'select-client',
        title: 'Client Selection',
        path: '/select-client',
        icon: 'Building',
        category: 'Client Management'
      },
      {
        id: 'intelligence-center',
        title: 'Intelligence Center',
        path: '/intelligence-center',
        icon: 'Brain',
        category: 'Analysis'
      },
      {
        id: 'action-analysis',
        title: 'Workforce Planning',
        path: '/action-analysis',
        icon: 'Users',
        category: 'Planning'
      },
      {
        id: 'overview-dashboard',
        title: 'Overview Dashboard',
        path: '/dashboard/overview',
        icon: 'BarChart3',
        category: 'Dashboard'
      },
      {
        id: 'hr-dashboard',
        title: 'HR Analytics',
        path: '/dashboard/hr',
        icon: 'UserCheck',
        category: 'Dashboard'
      },
      {
        id: 'finance-dashboard',
        title: 'Financial Forecasting',
        path: '/dashboard/finance',
        icon: 'DollarSign',
        category: 'Dashboard'
      }
    ];
  }
}