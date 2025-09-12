'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import { Settings, Save, RefreshCw, Percent, Truck, CreditCard, Tag, ArrowLeft } from 'lucide-react';

interface Setting {
  _id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  isActive: boolean;
}

export default function AdminSettingsPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }
    
    if (!isAdmin) {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, isAdmin, router]);

  // Fetch settings
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchSettings();
    }
  }, [isAuthenticated, isAdmin]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/settings');
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        setError('Failed to load settings');
        toast.error('Failed to load settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.key === key ? { ...setting, value } : setting
      )
    );
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError('');

      const settingsToUpdate = settings.map(setting => ({
        key: setting.key,
        value: setting.value,
        description: setting.description,
        category: setting.category,
        isActive: setting.isActive
      }));

      const response = await api.put('/settings/multiple', { settings: settingsToUpdate });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save settings');
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingValue = (key: string, defaultValue: any = '') => {
    const setting = settings.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  const renderSettingInput = (setting: Setting) => {
    const { key, value, description } = setting;

    switch (key) {
      case 'tax_rate':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>Tax Rate (%)</Label>
            <Input
              id={key}
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={value * 100}
              onChange={(e) => updateSetting(key, parseFloat(e.target.value) / 100)}
              placeholder="Enter tax rate"
            />
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
        );

      case 'shipping_cost':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>Shipping Cost (₹)</Label>
            <Input
              id={key}
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => updateSetting(key, parseFloat(e.target.value) || 0)}
              placeholder="Enter shipping cost"
            />
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
        );

      case 'currency':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>Currency</Label>
            <Select value={value} onValueChange={(val) => updateSetting(key, val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
              </SelectContent>
            </Select>
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
        );

      case 'free_shipping_threshold':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>Free Shipping Threshold (₹)</Label>
            <Input
              id={key}
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => updateSetting(key, parseFloat(e.target.value) || 0)}
              placeholder="Enter minimum order amount for free shipping"
            />
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Label>
            <Input
              id={key}
              value={value}
              onChange={(e) => updateSetting(key, e.target.value)}
              placeholder={`Enter ${key.replace(/_/g, ' ')}`}
            />
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
        );
    }
  };

  const initializeDefaultSettings = () => {
    const defaultSettings = [
      { _id: 'tax_rate', key: 'tax_rate', value: 0, description: 'Tax rate as decimal (0.18 = 18%)', category: 'pricing', isActive: true },
      { _id: 'shipping_cost', key: 'shipping_cost', value: 0, description: 'Default shipping cost', category: 'shipping', isActive: true },
      { _id: 'currency', key: 'currency', value: 'INR', description: 'Currency (Indian Rupee)', category: 'pricing', isActive: true },
      { _id: 'free_shipping_threshold', key: 'free_shipping_threshold', value: 0, description: 'Minimum order amount for free shipping', category: 'shipping', isActive: true },
      { _id: 'store_name', key: 'store_name', value: 'Andhra Potlam', description: 'Store name', category: 'general', isActive: true },
      { _id: 'store_address', key: 'store_address', value: 'Main Street, Andhra Pradesh, India', description: 'Store address', category: 'general', isActive: true },
      { _id: 'store_phone', key: 'store_phone', value: '+91 1234567890', description: 'Store phone number', category: 'general', isActive: true },
      { _id: 'store_email', key: 'store_email', value: 'info@andhrapotlam.com', description: 'Store email', category: 'general', isActive: true }
    ];

    const existingKeys = settings.map(s => s.key);
    const newSettings = defaultSettings.filter(s => !existingKeys.includes(s.key));

    if (newSettings.length > 0) {
      setSettings(prev => [...prev, ...newSettings]);
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
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

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={initializeDefaultSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Initialize Defaults
            </Button>
            <Button onClick={saveSettings} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pricing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Pricing Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings
                .filter(s => s.category === 'pricing')
                .map(setting => (
                  <div key={setting.key}>
                    {renderSettingInput(setting)}
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Shipping Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipping Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings
                .filter(s => s.category === 'shipping')
                .map(setting => (
                  <div key={setting.key}>
                    {renderSettingInput(setting)}
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {settings
                  .filter(s => s.category === 'general')
                  .map(setting => (
                    <div key={setting.key}>
                      {renderSettingInput(setting)}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
