'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Expense, ExpenseCategory, User } from '@/types';
import { ArrowLeft, Plus, Filter, Search, X } from 'lucide-react';
// Charts removed

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [paidByFilter, setPaidByFilter] = useState<string>('');
  // Date range filter
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'today' | 'this_week' | 'this_month' | 'custom'>('this_week');
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [showSummaryDetails, setShowSummaryDetails] = useState(false);
  const toYMDLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  // duplicate removed

  const clearAllFilters = () => {
    setSearchTerm('');
    setPaymentTypeFilter('');
    setCategoryFilter('');
    setPaidByFilter('');
    // reset to this week by default
    const today = new Date();
    const day = today.getDay();
    const diffToMonday = (day + 6) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    setStartDateFilter(toYMDLocal(start));
    setEndDateFilter(toYMDLocal(end));
    setDatePreset('this_week');
    setShowFilters(false);
    // Fetch unfiltered list immediately
    api.get(`/expenses?startDate=${toYMDLocal(start)}&endDate=${toYMDLocal(end)}`).then(async (response) => {
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      }
    }).catch(() => {
      // fallback to normal fetch
      setTimeout(fetchExpenses, 0);
    });
  };

  // duplicate removed

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin) {
        router.push('/dashboard');
        return;
      }
      // initialize date range to this week before initial fetch
      const today = new Date();
      const day = today.getDay();
      const diffToMonday = (day + 6) % 7;
      const start = new Date(today);
      start.setDate(today.getDate() - diffToMonday);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      setStartDateFilter(toYMDLocal(start));
      setEndDateFilter(toYMDLocal(end));
      setDatePreset('this_week');
      setTimeout(() => {
        fetchInitial();
      }, 0);
    }
  }, [user, isAdmin, authLoading, router]);

  const fetchInitial = async () => {
    await Promise.all([fetchExpenses(), fetchCategories(), fetchUsers()]);
    setIsLoading(false);
  };

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (paymentTypeFilter && paymentTypeFilter !== 'all') params.append('paymentType', paymentTypeFilter);
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);
      if (paidByFilter && paidByFilter !== 'all') params.append('paidBy', paidByFilter);
      if (startDateFilter) params.append('startDate', startDateFilter);
      if (endDateFilter) params.append('endDate', endDateFilter);
      const response = await api.get(`/expenses?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      } else {
        toast.error('Failed to load expenses');
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/expense-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold mb-2">Expenses</h1>
          <p className="text-gray-600 truncate">Manage daily expenses and filters</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowFilters(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/expenses/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
          <Button variant="outline" onClick={() => router.push('/admin/expenses/categories')}>
            Manage Expense Categories
          </Button>
        </div>
      </div>

      {/* Date Presets (outside filters) */}
      <div className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Select value={datePreset} onValueChange={(v) => {
              const preset = (v as 'today' | 'this_week' | 'this_month' | 'custom');
              setDatePreset(preset);
              const today = new Date();
              if (preset === 'today') {
                setStartDateFilter(toYMDLocal(today));
                setEndDateFilter(toYMDLocal(today));
              } else if (preset === 'this_week') {
                const day = today.getDay();
                const diffToMonday = (day + 6) % 7;
                const start = new Date(today);
                start.setDate(today.getDate() - diffToMonday);
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                setStartDateFilter(toYMDLocal(start));
                setEndDateFilter(toYMDLocal(end));
              } else if (preset === 'this_month') {
                const start = new Date(today.getFullYear(), today.getMonth(), 1);
                const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setStartDateFilter(toYMDLocal(start));
                setEndDateFilter(toYMDLocal(end));
              } else {
                // custom
              }
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className={`${datePreset === 'custom' ? '' : 'hidden'}`}>
            <label className="text-sm font-medium mb-2 block">From</label>
            <Input
              type="date"
              value={startDateFilter}
              onChange={(e) => {
                setDatePreset('custom');
                setStartDateFilter(e.target.value);
              }}
            />
          </div>
          <div className={`${datePreset === 'custom' ? '' : 'hidden'}`}>
            <label className="text-sm font-medium mb-2 block">To</label>
            <Input
              type="date"
              value={endDateFilter}
              onChange={(e) => {
                setDatePreset('custom');
                setEndDateFilter(e.target.value);
              }}
            />
          </div>
          <div className="flex gap-2 md:justify-end">
            <Button variant="outline" onClick={fetchExpenses} className="w-full md:w-auto">Apply</Button>
          </div>
        </div>
      </div>

      {/* Applied Filters Summary */}
      {(searchTerm || (paymentTypeFilter && paymentTypeFilter !== 'all') || (categoryFilter && categoryFilter !== 'all') || (paidByFilter && paidByFilter !== 'all') || startDateFilter || endDateFilter) && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">Applied Filters:</div>
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Button variant="outline" size="sm" onClick={() => setShowFilters(true)}>
                Search: {searchTerm}
              </Button>
            )}
            {paymentTypeFilter && paymentTypeFilter !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setShowFilters(true)}>
                Payment: {paymentTypeFilter}
              </Button>
            )}
            {categoryFilter && categoryFilter !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setShowFilters(true)}>
                Category: {categories.find(c => c._id === categoryFilter)?.name || 'Selected'}
              </Button>
            )}
            {paidByFilter && paidByFilter !== 'all' && (
              <Button variant="outline" size="sm" onClick={() => setShowFilters(true)}>
                Paid By: {users.find(u => u._id === paidByFilter)?.firstName || 'Selected'}
              </Button>
            )}
            {(startDateFilter || endDateFilter) && (
              <Button variant="outline" size="sm" onClick={() => setShowFilters(true)}>
                Date: {startDateFilter || '...'} to {endDateFilter || '...'}
              </Button>
            )}
            {/* Clear All button removed per request; use Filters modal to manage */}
          </div>
        </div>
      )}

      {/* Filters Modal (on demand) */}
      <FiltersModal
        open={showFilters}
        onClose={() => setShowFilters(false)}
      >
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Payment Type</label>
              <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Expense Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All expense categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All expense categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Paid By</label>
              <Select value={paidByFilter} onValueChange={setPaidByFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* Date filters moved outside modal */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={clearAllFilters}
              >
                Clear All
              </Button>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowFilters(false)} className="w-full sm:w-auto">Close</Button>
              <Button onClick={() => { fetchExpenses(); setShowFilters(false); }} className="w-full sm:w-auto">Apply Filters</Button>
            </div>
          </div>
        </div>
      </FiltersModal>

      {/* Summary (plain) */}
      {expenses.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Summary (Current Results)</CardTitle>
              {/* Small screens: toggle details */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setShowSummaryDetails((v) => !v)}
              >
                {showSummaryDetails ? 'Hide details' : 'Show details'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600">Total Expense Amount</div>
                <div className="mt-1 text-2xl font-semibold">₹{getTotalAmount(expenses).toFixed(2)}</div>
              </div>
              {/* Details hidden on small screens unless expanded */}
              <div className={`p-4 border rounded-lg ${showSummaryDetails ? '' : 'hidden'} lg:block`}>
                <div className="text-sm text-gray-600 mb-2">By Expense Type</div>
                <div className="space-y-1">
                  {Object.entries(getAmountByType(expenses)).map(([type, amt]) => (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span className="tabular-nums">₹{amt.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`p-4 border rounded-lg ${showSummaryDetails ? '' : 'hidden'} lg:block`}>
                <div className="text-sm text-gray-600 mb-2">By Expense Category</div>
                <div className="space-y-1 max-h-48 overflow-auto pr-1">
                  {getAmountByCategory(expenses, categories).map(row => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="truncate">{row.label}</span>
                      <span className="tabular-nums">₹{row.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`p-4 border rounded-lg ${showSummaryDetails ? '' : 'hidden'} lg:block`}>
                <div className="text-sm text-gray-600 mb-2">By User</div>
                <div className="space-y-1 max-h-48 overflow-auto pr-1">
                  {getAmountByUser(expenses, users).map(row => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span className="truncate">{row.label}</span>
                      <span className="tabular-nums">₹{row.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center text-gray-500">No expenses found</div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp) => (
                <div key={exp._id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">₹{exp.amount.toFixed(2)} • {typeof exp.category === 'string' ? categories.find(c => c._id === exp.category)?.name : exp.category.name}</div>
                    <div className="text-xs text-gray-500">{new Date(exp.date).toLocaleDateString()} • {typeof exp.paidBy === 'string' ? users.find(u => u._id === exp.paidBy)?.firstName : exp.paidBy.firstName}</div>
                    {exp.description && (
                      <div className="text-sm text-gray-700">{exp.description}</div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/admin/expenses/${exp._id}`)}>View</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
// (old stray function removed)

function FiltersModal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-3xl bg-white rounded-t-xl sm:rounded-xl shadow-xl p-4 m-0 sm:m-4">
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="text-base font-semibold">Filters</div>
          <button aria-label="Close" className="p-1" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------- Summary Helpers ----------
function getTotalAmount(expenses: Expense[]): number {
  return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
}

function getAmountByType(expenses: Expense[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    const key = (e.paymentType || 'unknown') as string;
    map[key] = (map[key] || 0) + (e.amount || 0);
  }
  return map;
}

function resolveCategoryName(cat: Expense['category'], categories: ExpenseCategory[]): string {
  if (!cat) return 'Unknown';
  if (typeof cat === 'string') {
    return categories.find(c => c._id === cat)?.name || 'Unknown';
  }
  return cat.name || 'Unknown';
}

function getAmountByCategory(expenses: Expense[], categories: ExpenseCategory[]): Array<{ label: string; value: number }> {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const label = resolveCategoryName(e.category, categories);
    map.set(label, (map.get(label) || 0) + (e.amount || 0));
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

function resolveUserName(paidBy: Expense['paidBy'], users: User[]): string {
  if (!paidBy) return 'Unknown';
  if (typeof paidBy === 'string') {
    const u = users.find(x => x._id === paidBy);
    return u ? `${u.firstName} ${u.lastName ?? ''}`.trim() : 'Unknown';
  }
  const anyUser = paidBy as any;
  const first = anyUser?.firstName || '';
  const last = anyUser?.lastName || '';
  return `${first} ${last}`.trim() || 'Unknown';
}

function getAmountByUser(expenses: Expense[], users: User[]): Array<{ label: string; value: number }> {
  const map = new Map<string, number>();
  for (const e of expenses) {
    const label = resolveUserName(e.paidBy, users);
    map.set(label, (map.get(label) || 0) + (e.amount || 0));
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}


