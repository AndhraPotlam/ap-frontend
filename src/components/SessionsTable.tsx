'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CashSession } from '@/types';
import { Eye, Edit, Trash2, CheckCircle } from 'lucide-react';

interface SessionsTableProps {
  sessions: CashSession[];
  loading?: boolean;
  showEditDelete?: boolean; // If true, shows Edit/Delete buttons, otherwise shows Close button
  returnUrl?: string; // For navigation back
  onViewSession?: (sessionId: string) => void;
  onEditSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onCloseSession?: (sessionId: string) => void;
}

export default function SessionsTable({
  sessions,
  loading = false,
  showEditDelete = false,
  returnUrl,
  onViewSession,
  onEditSession,
  onDeleteSession,
  onCloseSession
}: SessionsTableProps) {
  const router = useRouter();

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-100 text-green-800 text-xs">OPEN</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800 text-xs">CLOSED</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">{status.toUpperCase()}</Badge>;
    }
  };

  const getNetColor = (net: number) => {
    return net >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Default handlers
  const handleViewSession = (sessionId: string) => {
    if (onViewSession) {
      onViewSession(sessionId);
    } else {
      const params = new URLSearchParams();
      if (returnUrl) {
        params.set('returnUrl', returnUrl);
      }
      router.push(`/admin/cashbox/sessions/${sessionId}?${params.toString()}`);
    }
  };

  const handleEditSession = (sessionId: string) => {
    if (onEditSession) {
      onEditSession(sessionId);
    } else {
      const params = new URLSearchParams();
      if (returnUrl) {
        params.set('returnUrl', returnUrl);
      }
      router.push(`/admin/cashbox/sessions/${sessionId}/edit?${params.toString()}`);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (onDeleteSession) {
      onDeleteSession(sessionId);
    } else {
      // Default delete handler - you might want to add confirmation
      console.log('Delete session:', sessionId);
    }
  };

  const handleCloseSession = (sessionId: string) => {
    if (onCloseSession) {
      onCloseSession(sessionId);
    } else {
      const params = new URLSearchParams();
      if (returnUrl) {
        params.set('returnUrl', returnUrl);
      }
      router.push(`/admin/cashbox/sessions/${sessionId}/close?${params.toString()}`);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-600">Loading sessions...</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <div className="text-lg font-medium mb-2">No Sessions Found</div>
        <div className="text-sm">No sessions found for the selected criteria.</div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Session Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Opening</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Closing</th>
              <th className="text-right py-3 px-4 font-medium text-gray-700">Net</th>
              <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session._id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-900">
                  {format(new Date(session.date), 'MMM do, yyyy')}
                </td>
                <td className="py-3 px-4 text-sm text-gray-900">
                  {session.sessionName}
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(session.status)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-900 text-right">
                  ₹{session.openingAmount.toFixed(2)}
                </td>
                <td className="py-3 px-4 text-sm text-gray-900 text-right">
                  ₹{(session.closingAmount || 0).toFixed(2)}
                </td>
                <td className={`py-3 px-4 text-sm font-medium text-right ${getNetColor((session.closingAmount || 0) - session.openingAmount)}`}>
                  ₹{((session.closingAmount || 0) - session.openingAmount).toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSession(session._id)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {showEditDelete ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSession(session._id)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSession(session._id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      session.status === 'open' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCloseSession(session._id)}
                          className="h-8 w-8 p-0"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {sessions.map((session) => (
          <div key={session._id} className="border rounded-lg p-3 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-medium text-gray-900 text-sm">{session.sessionName}</div>
                <div className="text-xs text-gray-600">
                  {format(new Date(session.date), 'MMM do, yyyy')}
                </div>
              </div>
              {getStatusBadge(session.status)}
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <div className="text-xs text-gray-500">Opening</div>
                <div className="text-sm font-medium">₹{session.openingAmount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Closing</div>
                <div className="text-sm font-medium">₹{(session.closingAmount || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Net</div>
                <div className={`text-sm font-medium ${getNetColor((session.closingAmount || 0) - session.openingAmount)}`}>
                  ₹{((session.closingAmount || 0) - session.openingAmount).toFixed(2)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewSession(session._id)}
                className="flex-1 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                View Details
              </Button>
              
              {showEditDelete ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSession(session._id)}
                    className="flex-1 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSession(session._id)}
                    className="flex-1 text-xs text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </>
              ) : (
                session.status === 'open' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloseSession(session._id)}
                    className="flex-1 text-xs"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Close
                  </Button>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
