import { useState, useEffect, useCallback } from 'react';
import { FileText, Database, RefreshCw, Table2, ChevronRight, Search, ArrowUpDown, ChevronLeft } from 'lucide-react';

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/swordfish-proxy`;

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

export function ReportsDashboardPage() {
  const [tableCount, setTableCount] = useState<number | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [filteredTables, setFilteredTables] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const LIMIT = 25;

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [countRes, tablesRes] = await Promise.all([
        fetch(`${PROXY_BASE}?path=tables/count`),
        fetch(`${PROXY_BASE}?path=tables`),
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

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
      const res = await fetch(`${PROXY_BASE}?path=table/${tableName}&limit=${LIMIT}&offset=${newOffset}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-gray-500 font-medium">Connecting to Swordfish API...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="max-w-[1400px] mx-auto px-6 pt-28 pb-12">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reports</h1>
              <p className="text-gray-500 mt-1">Swordfish database explorer</p>
            </div>
            <button
              onClick={fetchOverview}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

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
      </div>
    </div>
  );
}
