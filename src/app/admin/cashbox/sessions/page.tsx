'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Edit, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { CashSession } from '@/types';
import { useAuth } from '@/context/AuthContext';
import SessionsTable from '@/components/SessionsTable';

export default function SessionDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  
  const sessionType = searchParams.get('sessionType') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const status = searchParams.get('status') || '';
  const returnUrl = searchParams.get('returnUrl') || '/admin/cashbox';

  // Debug logging
  console.log('Sessions page URL params:', { sessionType, startDate, endDate, status, returnUrl });

  const itemsPerPage = 10;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
        return;
      }
      fetchSessions();
    }
  }, [authLoading, user, currentPage, sessionType, startDate, endDate, status]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sessionType,
        startDate,
        endDate,
      });
      
      if (status) {
        params.set('status', status);
      }

      console.log('Fetching sessions with params:', params.toString());

      const response = await api.get(`/cashbox/sessions?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
        setTotalSessions(data.total || 0);
        setTotalPages(Math.ceil((data.total || 0) / itemsPerPage));
      } else {
        const errorText = await response.text();
        console.error('Sessions API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSession = (sessionId: string) => {
    const params = new URLSearchParams();
    // Construct returnUrl with current session page parameters
    const currentParams = new URLSearchParams();
    if (sessionType) currentParams.set('sessionType', sessionType);
    if (startDate) currentParams.set('startDate', startDate);
    if (endDate) currentParams.set('endDate', endDate);
    if (status) currentParams.set('status', status);
    
    const returnUrl = `/admin/cashbox/sessions?${currentParams.toString()}`;
    params.set('returnUrl', returnUrl);
    router.push(`/admin/cashbox/sessions/${sessionId}?${params.toString()}`);
  };



  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(returnUrl)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Cash Box</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {sessionType} {status ? `${status.charAt(0).toUpperCase() + status.slice(1)} ` : ''}Sessions
            </h1>
            <p className="text-sm text-gray-600">
              {startDate && endDate 
                ? `${format(new Date(startDate), 'MMM do, yyyy')} - ${format(new Date(endDate), 'MMM do, yyyy')}`
                : 'All sessions'
              }
              {status && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {status.toUpperCase()}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {totalSessions} session{totalSessions !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionsTable
            sessions={sessions}
            loading={authLoading || loading}
            showEditDelete={true}
            returnUrl={returnUrl}
            onViewSession={handleViewSession}
            onEditSession={(sessionId) => {
              const params = new URLSearchParams();
              params.set('returnUrl', window.location.pathname + window.location.search);
              router.push(`/admin/cashbox/sessions/${sessionId}/edit?${params.toString()}`);
            }}
            onDeleteSession={async (sessionId) => {
              if (!confirm('Are you sure you want to delete this session?')) return;
              
              try {
                await api.delete(`/cashbox/sessions/${sessionId}`);
                fetchSessions(); // Refresh the list
              } catch (error) {
                console.error('Error deleting session:', error);
                alert('Failed to delete session');
              }
            }}
          />
          
          {/* Pagination */}
          {!authLoading && !loading && sessions.length > 0 && renderPagination()}
        </CardContent>
      </Card>
    </div>
  );
}
