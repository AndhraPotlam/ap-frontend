'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Mail, CheckCircle, Copy } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [resetLink, setResetLink] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setResetLink('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/password-reset/forgot-password', { email });

            if (response.ok) {
                const data = await response.json();
                setEmailSent(true);
                
                // Check if email was actually sent
                if (data.emailSent) {
                    toast.success(data.message || 'Password reset link sent to your email');
                } else {
                    // Email failed, but we have a reset link
                    if (data.resetLink) {
                        setResetLink(data.resetLink);
                        toast.warning('Email service unavailable. Please use the reset link below.');
                    } else {
                        toast.warning(data.message || 'Email service unavailable');
                    }
                }
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to process request');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2 mb-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/auth/login')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Login
                        </Button>
                    </div>
                    <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll generate a password reset link for you.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!emailSent ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            {resetLink ? (
                                <>
                                    <Alert className="bg-yellow-50 border-yellow-200">
                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                        <AlertDescription className="text-yellow-800">
                                            Email service unavailable. Please use the reset link below.
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-2">
                                        <Label>Password Reset Link</Label>
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
                                                onClick={() => {
                                                    navigator.clipboard.writeText(resetLink);
                                                    toast.success('Link copied to clipboard!');
                                                }}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Copy this link and open it in your browser. The link will expire in 1 hour.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Alert className="bg-green-50 border-green-200">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-800">
                                            Password reset link has been sent to your email!
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-2 text-center">
                                        <p className="text-gray-700 font-medium">Check your inbox</p>
                                        <p className="text-sm text-gray-600">
                                            We've sent a password reset link to <strong>{email}</strong>
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            The link will expire in 1 hour.
                                        </p>
                                    </div>
                                </>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setEmailSent(false);
                                        setResetLink('');
                                        setEmail('');
                                    }}
                                >
                                    Send Another
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={() => router.push('/auth/login')}
                                >
                                    Back to Login
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
