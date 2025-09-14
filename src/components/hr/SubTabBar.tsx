import { cn } from '@/lib/utils';

interface SubTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SubTabBar({ activeTab, onTabChange }: SubTabBarProps) {
  const tabs = [
    { id: 'agents', label: 'Agents' },
    { id: 'workload', label: 'Workload' },
    { id: 'skill-matrix', label: 'Skill Matrix' },
    { id: 'performance', label: 'Performance' },
    { id: 'teams', label: 'Teams' }
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
            activeTab === tab.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}