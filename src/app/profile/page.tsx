"use client";
import React, { useEffect } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
        setFirstName(user.firstName);
        setLastName(user.lastName);
        }
    }
    , [user]);

  if (!user) {
    return <p>Loading...</p>;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.put(`/users/${user._id}`, { firstName, lastName });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Back to Dashboard Button */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <p className="text-sm text-gray-500">Manage your profile information</p>
          <p>{user.firstName + user.lastName}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>First Name:</strong>
              {isEditing ? (
                <Input
                  
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="mt-1"
                />
              ) : (
                <p>{firstName}</p>
              )}
            </div>
            <div>
              <strong>Last Name:</strong>
              {isEditing ? (
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="mt-1"
                />
              ) : (
                <p>{lastName}</p>
              )}
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>Role:</strong> {user.role}
            </div>
            {isEditing ? (
              <div className="flex space-x-4 mt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="mt-4">
                Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}