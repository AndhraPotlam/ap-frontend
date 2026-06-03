'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, CheckCircle, X, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ResetLinkModalProps {
    userId: string;
    userName: string;
    onClose: () => void;
}

export default function ResetLinkModal({ userId, userName, onClose }: ResetLinkModalProps) {
    const [resetLink, setResetLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const lastUserIdRef = useRef<string | null>(null);

    const generateResetLink = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.post(`/password-reset/admin/reset/${userId}`, {});

            if (response.ok) {
                const data = await response.json();
                setResetLink(data.resetLink);
                setEmailSent(data.emailSent || false);
                
                // Check if email was actually sent
                if (data.emailSent) {
                    toast.success(`Password reset link generated and sent to ${data.user?.email || 'user'}`);
                } else {
                    toast.success('Password reset link generated');
                    toast.warning('Email service unavailable - please share the link manually');
                }
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to generate reset link');
            }
        } catch (error) {
            toast.error('Failed to generate reset link');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(resetLink);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    // Auto-generate on mount or when userId changes (but only once per userId)
    useEffect(() => {
        // Only generate if userId changed or if we don't have a link yet
        if (lastUserIdRef.current !== userId) {
            lastUserIdRef.current = userId;
            setResetLink(''); // Reset link when userId changes
            setEmailSent(false);
            generateResetLink();
        }
    }, [userId, generateResetLink]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Password Reset Link - {userName}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600">Generating reset link...</p>
                        </div>
                    ) : resetLink ? (
                        <>
                            {emailSent ? (
                                <Alert className="bg-green-50 border-green-200">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        Password reset link generated and sent via email!
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <Alert className="bg-yellow-50 border-yellow-200">
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-800">
                                        Password reset link generated, but email service is unavailable. Please share the link manually.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Reset Link</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={resetLink}
                                        readOnly
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Share this link with the user to reset their password. This link will expire in 1 hour.
                                </p>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={generateResetLink}
                                >
                                    Generate New Link
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={onClose}
                                >
                                    Done
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-red-600">Failed to generate reset link</p>
                            <Button onClick={generateResetLink} className="mt-4">
                                Try Again
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
