import { useState, useEffect, useCallback } from 'react';
import { FileText, Database, RefreshCw, Table2, ChevronRight, Search, ArrowUpDown, ChevronLeft, BarChart3, TrendingUp, DollarSign, Calendar, Phone, Mail, MessageSquare, Award, Clock, Users } from 'lucide-react';
import { getContactabilityMetrics, type ContactabilityMetrics } from '../services/contactabilityService';
import CollectionActivityReportPage from './CollectionActivityReportPage';

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/swordfish-proxy`;
const AUTH_HEADERS = {
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};

interface TableInfo {
  Tables_in_swordfish_qaurtile: string;
}

interface TableCountResponse {
  success: boolean;
  count: number;
}

interface TablesListResponse {
  success: boolean;
  tables: TableInfo[];
}

interface TableDataResponse {
  success: boolean;
  data: Record<string, unknown>[];
  limit: number;
  offset: number;
}

type SortDirection = 'asc' | 'desc';
type TabType = 'database' | 'collection-activity' | 'propensity' | 'payment' | 'ptp' | 'contactability';

export function ReportsDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('database');
  const [tableCount, setTableCount] = useState<number | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [filteredTables, setFilteredTables] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [contactabilityMetrics, setContactabilityMetrics] = useState<ContactabilityMetrics | null>(null);
  const [contactabilityLoading, setContactabilityLoading] = useState(false);
  const LIMIT = 25;

  const fetchOverview = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [countRes, tablesRes] = await Promise.all([
        fetch(`${PROXY_BASE}?path=tables/count`, { headers: AUTH_HEADERS }),
        fetch(`${PROXY_BASE}?path=tables`, { headers: AUTH_HEADERS }),
      ]);
      const countData: TableCountResponse = await countRes.json();
      const tablesData: TablesListResponse = await tablesRes.json();

      if (countData.success) setTableCount(countData.count);
      if (tablesData.success) {
        const names = tablesData.tables.map((t) => t.Tables_in_swordfish_qaurtile);
        setTables(names);
        setFilteredTables(names);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to API');
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview(true);
  }, [fetchOverview]);

  const fetchContactabilityData = async () => {
    setContactabilityLoading(true);
    try {
      const metrics = await getContactabilityMetrics();
      setContactabilityMetrics(metrics);
    } catch (err) {
      console.error('Failed to load contactability metrics:', err);
      setError('Failed to load contactability data');
    } finally {
      setContactabilityLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'contactability') {
      fetchContactabilityData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTables(tables);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredTables(tables.filter((t) => t.toLowerCase().includes(q)));
    }
  }, [searchQuery, tables]);

  const fetchTableData = async (tableName: string, newOffset = 0) => {
    setTableLoading(true);
    setError(null);
    try {
      const res = await fetch(`${PROXY_BASE}?path=table/${tableName}&limit=${LIMIT}&offset=${newOffset}`, { headers: AUTH_HEADERS });
      const data: TableDataResponse = await res.json();
      if (data.success) {
        setTableData(data.data);
        setOffset(newOffset);
        setSelectedTable(tableName);
        setSortColumn(null);
        setSortDirection('asc');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table data');
    } finally {
      setTableLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = sortColumn
    ? [...tableData].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const aStr = String(aVal);
        const bStr = String(bVal);
        const aNum = Number(aStr);
        const bNum = Number(bStr);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }
        return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      })
    : tableData;

  const columns = tableData.length > 0 ? Object.keys(tableData[0]) : [];

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
      try {
        return new Date(value).toLocaleDateString('en-ZA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return value;
      }
    }
    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)) && value.includes('.'))) {
      const num = Number(value);
      if (!isNaN(num) && value.toString().includes('.')) {
        return num.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    return String(value);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-gray-500 font-medium">Connecting to Swordfish API...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'database' as TabType, label: 'Database', icon: Database },
    { id: 'collection-activity' as TabType, label: 'Collection Activity Report', icon: BarChart3 },
    { id: 'propensity' as TabType, label: 'Propensity to Pay', icon: TrendingUp },
    { id: 'payment' as TabType, label: 'Payment Reporting', icon: DollarSign },
    { id: 'ptp' as TabType, label: 'Promise to Pay (PTP) Reporting', icon: Calendar },
    { id: 'contactability' as TabType, label: 'Contactability Report', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-[1400px] mx-auto px-6 pt-28 pb-12">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reports</h1>
              <p className="text-gray-500 mt-1">Comprehensive reporting and analytics</p>
            </div>
            {activeTab === 'database' && (
              <button
                onClick={() => fetchOverview()}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8 bg-white rounded-2xl border border-gray-200/60 shadow-sm p-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-normal transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-teal-50 text-teal-700 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'database' && (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                <Database size={20} className="text-teal-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Tables</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{tableCount ?? '--'}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <Table2 size={20} className="text-sky-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Selected Table</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 truncate">
              {selectedTable ?? 'None'}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200/60 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <FileText size={20} className="text-amber-600" />
              </div>
              <span className="text-sm font-medium text-gray-500">Rows Loaded</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{tableData.length}</p>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-72 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden sticky top-28">
              <div className="p-4 border-b border-gray-100">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                  />
                </div>
              </div>
              <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
                {filteredTables.map((table) => (
                  <button
                    key={table}
                    onClick={() => fetchTableData(table)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left transition-all duration-150 border-b border-gray-50 group ${
                      selectedTable === table
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{table}</span>
                    <ChevronRight
                      size={14}
                      className={`shrink-0 transition-transform ${
                        selectedTable === table
                          ? 'text-teal-500'
                          : 'text-gray-300 group-hover:text-gray-500'
                      }`}
                    />
                  </button>
                ))}
                {filteredTables.length === 0 && (
                  <p className="px-4 py-6 text-sm text-gray-400 text-center">No tables match your search</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {!selectedTable ? (
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Table2 size={28} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Select a table</h3>
                <p className="text-sm text-gray-400">Choose a table from the list to view its data</p>
              </div>
            ) : tableLoading ? (
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-12 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mr-3" />
                <span className="text-gray-500">Loading {selectedTable}...</span>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-800">{selectedTable}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={offset === 0}
                      onClick={() => fetchTableData(selectedTable, Math.max(0, offset - LIMIT))}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={13} />
                      Prev
                    </button>
                    <span className="text-xs text-gray-500 px-2">
                      {offset + 1} - {offset + tableData.length}
                    </span>
                    <button
                      disabled={tableData.length < LIMIT}
                      onClick={() => fetchTableData(selectedTable, offset + LIMIT)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/80">
                        {columns.map((col) => (
                          <th
                            key={col}
                            onClick={() => handleSort(col)}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 transition-colors select-none"
                          >
                            <div className="flex items-center gap-1.5">
                              {col.replace(/_/g, ' ')}
                              <ArrowUpDown
                                size={12}
                                className={
                                  sortColumn === col ? 'text-teal-600' : 'text-gray-300'
                                }
                              />
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedData.map((row, i) => (
                        <tr
                          key={i}
                          className="hover:bg-teal-50/30 transition-colors"
                        >
                          {columns.map((col) => (
                            <td
                              key={col}
                              className="px-4 py-3 text-gray-700 whitespace-nowrap max-w-[240px] truncate"
                              title={String(row[col] ?? '')}
                            >
                              {formatCellValue(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {sortedData.length === 0 && (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="px-4 py-8 text-center text-gray-400"
                          >
                            No data in this table
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
          </>
        )}

        {/* Collection Activity Report */}
        {activeTab === 'collection-activity' && <CollectionActivityReportPage />}

        {/* Propensity to Pay */}
        {activeTab === 'propensity' && (
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <TrendingUp size={24} className="text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Propensity to Pay</h2>
                <p className="text-sm text-gray-500">AI-powered payment probability analysis</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-5 border border-emerald-200/50">
                <p className="text-sm font-medium text-emerald-600 mb-1">High Propensity</p>
                <p className="text-3xl font-bold text-emerald-900">1,245</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-5 border border-yellow-200/50">
                <p className="text-sm font-medium text-yellow-600 mb-1">Medium Propensity</p>
                <p className="text-3xl font-bold text-yellow-900">3,892</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-5 border border-orange-200/50">
                <p className="text-sm font-medium text-orange-600 mb-1">Low Propensity</p>
                <p className="text-3xl font-bold text-orange-900">2,156</p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-5 border border-slate-200/50">
                <p className="text-sm font-medium text-slate-600 mb-1">Avg. Score</p>
                <p className="text-3xl font-bold text-slate-900">67.8</p>
              </div>
            </div>
            <div className="text-center py-12 text-gray-400">
              <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium">Advanced propensity analysis dashboard coming soon</p>
            </div>
          </div>
        )}

        {/* Payment Reporting */}
        {activeTab === 'payment' && (
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <DollarSign size={24} className="text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Payment Reporting</h2>
                <p className="text-sm text-gray-500">Comprehensive payment analysis and trends</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl p-5 border border-teal-200/50">
                <p className="text-sm font-medium text-teal-600 mb-1">Total Collected</p>
                <p className="text-3xl font-bold text-teal-900">R 2.4M</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-5 border border-blue-200/50">
                <p className="text-sm font-medium text-blue-600 mb-1">This Month</p>
                <p className="text-3xl font-bold text-blue-900">R 387K</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl p-5 border border-indigo-200/50">
                <p className="text-sm font-medium text-indigo-600 mb-1">Avg. Payment</p>
                <p className="text-3xl font-bold text-indigo-900">R 1,247</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl p-5 border border-cyan-200/50">
                <p className="text-sm font-medium text-cyan-600 mb-1">Payment Count</p>
                <p className="text-3xl font-bold text-cyan-900">1,923</p>
              </div>
            </div>
            <div className="text-center py-12 text-gray-400">
              <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium">Detailed payment analytics and reports coming soon</p>
            </div>
          </div>
        )}

        {/* Promise to Pay (PTP) Reporting */}
        {activeTab === 'ptp' && (
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <Calendar size={24} className="text-teal-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Promise to Pay (PTP) Reporting</h2>
                <p className="text-sm text-gray-500">Track payment promises and fulfillment rates</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl p-5 border border-violet-200/50">
                <p className="text-sm font-medium text-violet-600 mb-1">Active PTPs</p>
                <p className="text-3xl font-bold text-violet-900">567</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-5 border border-green-200/50">
                <p className="text-sm font-medium text-green-600 mb-1">Kept Promises</p>
                <p className="text-3xl font-bold text-green-900">423</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-5 border border-red-200/50">
                <p className="text-sm font-medium text-red-600 mb-1">Broken Promises</p>
                <p className="text-3xl font-bold text-red-900">89</p>
              </div>
              <div className="bg-gradient-to-br from-sky-50 to-sky-100/50 rounded-xl p-5 border border-sky-200/50">
                <p className="text-sm font-medium text-sky-600 mb-1">Fulfillment Rate</p>
                <p className="text-3xl font-bold text-sky-900">82.6%</p>
              </div>
            </div>
            <div className="text-center py-12 text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium">Comprehensive PTP tracking dashboard coming soon</p>
            </div>
          </div>
        )}

        {/* Contactability Report */}
        {activeTab === 'contactability' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                    <Phone size={24} className="text-teal-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Contactability Report</h2>
                    <p className="text-sm text-gray-500">Real-time contact success rates and channel effectiveness</p>
                  </div>
                </div>
                <button
                  onClick={fetchContactabilityData}
                  disabled={contactabilityLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={15} className={contactabilityLoading ? 'animate-spin' : ''} />
                  {contactabilityLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {contactabilityLoading ? (
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-16 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
                  <p className="text-gray-500 font-medium">Loading contactability data...</p>
                </div>
              </div>
            ) : contactabilityMetrics ? (
              <>
                {/* Overview Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                        <Phone size={18} className="text-sky-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{contactabilityMetrics.totalAttempts.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                        <Award size={18} className="text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Successful</p>
                    </div>
                    <p className="text-3xl font-bold text-green-900">{contactabilityMetrics.successfulContacts.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                        <TrendingUp size={18} className="text-orange-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-900">{contactabilityMetrics.successRate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                        <BarChart3 size={18} className="text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Avg Contact Score</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900">{contactabilityMetrics.averageContactScore.toFixed(1)}</p>
                  </div>
                </div>

                {/* Channel Performance */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-5">Channel Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="border border-gray-200 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Phone size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Phone</p>
                          <p className="text-xs text-gray-400">{contactabilityMetrics.byChannel.phone.attempts} attempts</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Successful</span>
                          <span className="text-sm font-semibold text-gray-900">{contactabilityMetrics.byChannel.phone.success}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <span className="text-sm font-semibold text-blue-600">{contactabilityMetrics.byChannel.phone.rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${contactabilityMetrics.byChannel.phone.rate}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                          <Mail size={18} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Email</p>
                          <p className="text-xs text-gray-400">{contactabilityMetrics.byChannel.email.attempts} attempts</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Successful</span>
                          <span className="text-sm font-semibold text-gray-900">{contactabilityMetrics.byChannel.email.success}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <span className="text-sm font-semibold text-green-600">{contactabilityMetrics.byChannel.email.rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${contactabilityMetrics.byChannel.email.rate}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                          <MessageSquare size={18} className="text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">SMS</p>
                          <p className="text-xs text-gray-400">{contactabilityMetrics.byChannel.sms.attempts} attempts</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Successful</span>
                          <span className="text-sm font-semibold text-gray-900">{contactabilityMetrics.byChannel.sms.success}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Success Rate</span>
                          <span className="text-sm font-semibold text-teal-600">{contactabilityMetrics.byChannel.sms.rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                          <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${contactabilityMetrics.byChannel.sms.rate}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time of Day Performance */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <Clock size={20} />
                    Best Time to Contact
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Morning (6AM-12PM)</p>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{contactabilityMetrics.byTimeOfDay.morning.rate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">{contactabilityMetrics.byTimeOfDay.morning.success}/{contactabilityMetrics.byTimeOfDay.morning.attempts} attempts</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Afternoon (12PM-5PM)</p>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{contactabilityMetrics.byTimeOfDay.afternoon.rate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">{contactabilityMetrics.byTimeOfDay.afternoon.success}/{contactabilityMetrics.byTimeOfDay.afternoon.attempts} attempts</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Evening (5PM-9PM)</p>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{contactabilityMetrics.byTimeOfDay.evening.rate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">{contactabilityMetrics.byTimeOfDay.evening.success}/{contactabilityMetrics.byTimeOfDay.evening.attempts} attempts</p>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Night (9PM-6AM)</p>
                      <p className="text-2xl font-bold text-gray-900 mb-1">{contactabilityMetrics.byTimeOfDay.night.rate.toFixed(1)}%</p>
                      <p className="text-xs text-gray-500">{contactabilityMetrics.byTimeOfDay.night.success}/{contactabilityMetrics.byTimeOfDay.night.attempts} attempts</p>
                    </div>
                  </div>
                </div>

                {/* Trends */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-5">Recent Trends</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-xl p-5">
                      <p className="text-sm font-medium text-gray-600 mb-3">Last 7 Days</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Attempts</span>
                          <span className="text-sm font-semibold">{contactabilityMetrics.trends.last7Days.attempts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Successful</span>
                          <span className="text-sm font-semibold text-green-600">{contactabilityMetrics.trends.last7Days.success}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Rate</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {contactabilityMetrics.trends.last7Days.attempts > 0
                              ? ((contactabilityMetrics.trends.last7Days.success / contactabilityMetrics.trends.last7Days.attempts) * 100).toFixed(1)
                              : '0.0'}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-5">
                      <p className="text-sm font-medium text-gray-600 mb-3">Last 30 Days</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Attempts</span>
                          <span className="text-sm font-semibold">{contactabilityMetrics.trends.last30Days.attempts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Successful</span>
                          <span className="text-sm font-semibold text-green-600">{contactabilityMetrics.trends.last30Days.success}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Rate</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {contactabilityMetrics.trends.last30Days.attempts > 0
                              ? ((contactabilityMetrics.trends.last30Days.success / contactabilityMetrics.trends.last30Days.attempts) * 100).toFixed(1)
                              : '0.0'}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-5">
                      <p className="text-sm font-medium text-gray-600 mb-3">Last 90 Days</p>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Attempts</span>
                          <span className="text-sm font-semibold">{contactabilityMetrics.trends.last90Days.attempts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Successful</span>
                          <span className="text-sm font-semibold text-green-600">{contactabilityMetrics.trends.last90Days.success}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Rate</span>
                          <span className="text-sm font-semibold text-blue-600">
                            {contactabilityMetrics.trends.last90Days.attempts > 0
                              ? ((contactabilityMetrics.trends.last90Days.success / contactabilityMetrics.trends.last90Days.attempts) * 100).toFixed(1)
                              : '0.0'}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Performing Agents */}
                {contactabilityMetrics.topPerformingAgents.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                      <Users size={20} />
                      Top Performing Agents
                    </h3>
                    <div className="space-y-3">
                      {contactabilityMetrics.topPerformingAgents.map((agent, index) => (
                        <div key={agent.agent_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                              index === 0 ? 'bg-yellow-100 text-yellow-700' :
                              index === 1 ? 'bg-gray-100 text-gray-700' :
                              index === 2 ? 'bg-orange-100 text-orange-700' :
                              'bg-blue-50 text-blue-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{agent.agent_name}</p>
                              <p className="text-xs text-gray-500">{agent.attempts} attempts • {agent.successful} successful</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-teal-600">{agent.rate.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">success rate</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outcome Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-5">Contact Outcomes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(contactabilityMetrics.byOutcome)
                      .sort(([, a], [, b]) => b - a)
                      .map(([outcome, count]) => (
                        <div key={outcome} className="border border-gray-200 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1 capitalize">{outcome.replace(/_/g, ' ')}</p>
                          <p className="text-xl font-bold text-gray-900">{count}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-16 text-center">
                <Phone size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">No contactability data available</p>
                <p className="text-sm text-gray-400 mt-2">Contact attempts will appear here once recorded</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
