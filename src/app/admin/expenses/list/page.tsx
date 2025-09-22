'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Edit, Trash2, Receipt, CreditCard, Banknote } from 'lucide-react';
import { api } from '@/lib/api';
import { Expense } from '@/types';
import { useAuth } from '@/context/AuthContext';

export default function ExpensesListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const paymentType = searchParams.get('paymentType') || '';
  const category = searchParams.get('category') || '';
  const paidBy = searchParams.get('paidBy') || '';
  const returnUrl = searchParams.get('returnUrl') || '/admin/expenses';

  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      fetchExpenses();
    }
  }, [authLoading, user, currentPage, startDate, endDate, paymentType, category, paidBy]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        startDate,
        endDate,
      });
      
      if (paymentType) params.set('paymentType', paymentType);
      if (category) params.set('category', category);
      if (paidBy) params.set('paidBy', paidBy);

      const response = await api.get(`/expenses?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
        setTotalExpenses(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        const errorText = await response.text();
        console.error('Expenses API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewExpense = (expenseId: string) => {
    const params = new URLSearchParams();
    // Construct returnUrl with current list page parameters
    const currentParams = new URLSearchParams();
    if (startDate) currentParams.set('startDate', startDate);
    if (endDate) currentParams.set('endDate', endDate);
    if (paymentType) currentParams.set('paymentType', paymentType);
    if (category) currentParams.set('category', category);
    if (paidBy) currentParams.set('paidBy', paidBy);
    
    const returnUrl = `/admin/expenses/list?${currentParams.toString()}`;
    params.set('returnUrl', returnUrl);
    router.push(`/admin/expenses/${expenseId}?${params.toString()}`);
  };

  const handleEditExpense = (expenseId: string) => {
    const params = new URLSearchParams();
    const currentParams = new URLSearchParams();
    if (startDate) currentParams.set('startDate', startDate);
    if (endDate) currentParams.set('endDate', endDate);
    if (paymentType) currentParams.set('paymentType', paymentType);
    if (category) currentParams.set('category', category);
    if (paidBy) currentParams.set('paidBy', paidBy);
    
    const returnUrl = `/admin/expenses/list?${currentParams.toString()}`;
    params.set('returnUrl', returnUrl);
    router.push(`/admin/expenses/${expenseId}/edit?${params.toString()}`);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await api.delete(`/expenses/${expenseId}`);
        if (response.ok) {
          fetchExpenses(); // Refresh data
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'online': return <CreditCard className="h-4 w-4" />;
      default: return <Receipt className="h-4 w-4" />;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'online': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
          className="min-w-[40px]"
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        {pages}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  const getFilterDescription = () => {
    const filters = [];
    if (startDate && endDate) {
      filters.push(`${format(new Date(startDate), 'MMM do')} - ${format(new Date(endDate), 'MMM do, yyyy')}`);
    }
    if (paymentType) {
      filters.push(`Payment: ${paymentType}`);
    }
    if (category) {
      filters.push(`Category: ${category}`);
    }
    if (paidBy) {
      filters.push(`Paid by: ${paidBy}`);
    }
    return filters.length > 0 ? ` (${filters.join(', ')})` : '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(returnUrl)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Expenses</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  All Expenses{getFilterDescription()}
                </h1>
                <p className="text-gray-600">
                  {totalExpenses} expenses found
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        <Card className="shadow-sm border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center text-gray-500 py-8">Loading expenses...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No expenses found</div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Expense
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Paid By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenses.map((expense) => (
                        <tr key={expense._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {expense.description || 'No description'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              ₹{expense.amount.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={`${getPaymentTypeColor(expense.paymentType)}`}>
                              {getPaymentTypeIcon(expense.paymentType)}
                              <span className="ml-1 capitalize">{expense.paymentType}</span>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {typeof expense.category === 'string' 
                                ? expense.category 
                                : expense.category?.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {typeof expense.paidBy === 'string' 
                                ? expense.paidBy 
                                : `${expense.paidBy?.firstName} ${expense.paidBy?.lastName}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {format(new Date(expense.date), 'MMM do, yyyy')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewExpense(expense._id)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditExpense(expense._id)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteExpense(expense._id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden">
                  <div className="space-y-4 p-4">
                    {expenses.map((expense) => (
                      <div key={expense._id} className="p-4 border rounded-lg bg-white">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={`${getPaymentTypeColor(expense.paymentType)}`}>
                                {getPaymentTypeIcon(expense.paymentType)}
                                <span className="ml-1 capitalize">{expense.paymentType}</span>
                              </Badge>
                              <span className="text-lg font-semibold text-gray-900">
                                ₹{expense.amount.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {expense.description || 'No description'}
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>
                                Category: {typeof expense.category === 'string' 
                                  ? expense.category 
                                  : expense.category?.name}
                              </div>
                              <div>
                                Paid by: {typeof expense.paidBy === 'string' 
                                  ? expense.paidBy 
                                  : `${expense.paidBy?.firstName} ${expense.paidBy?.lastName}`}
                              </div>
                              <div>
                                Date: {format(new Date(expense.date), 'MMM do, yyyy')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewExpense(expense._id)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditExpense(expense._id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense._id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagination */}
                {renderPagination()}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
