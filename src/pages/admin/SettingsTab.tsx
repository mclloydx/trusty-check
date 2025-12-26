// src/pages/admin/SettingsTab.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Shield, 
  Database, 
  Server, 
  AlertTriangle,
  Mail,
  Key,
  Lock
} from "lucide-react";

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: any;
}

interface SettingField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'textarea' | 'boolean';
  value: string | number | boolean;
  description?: string;
}

export function SettingsTab() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState<Record<string, any>>({
    siteName: 'Stazama Platform',
    siteDescription: 'Your trusted partner for product verification',
    siteUrl: 'https://stazama.com',
    adminEmail: 'admin@stazama.com',
    enableRegistration: true,
    enableEmailVerification: true,
    maxFileSize: 10,
    rateLimit: 100,
    maintenanceMode: false,
    enableLogging: true,
    logLevel: 'info',
    databaseUrl: '',
    jwtSecret: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: ''
  });

  const sections: SettingSection[] = [
    {
      id: 'general',
      title: 'General',
      description: 'Basic site settings',
      icon: Settings
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Security and authentication',
      icon: Shield
    },
    {
      id: 'database',
      title: 'Database',
      description: 'Database configuration',
      icon: Database
    },
    {
      id: 'email',
      title: 'Email',
      description: 'Email settings',
      icon: Mail
    },
    {
      id: 'api',
      title: 'API',
      description: 'API and rate limiting',
      icon: Server
    }
  ];

  const handleInputChange = (id: string, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // In a real app, this would save the settings to the database
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      siteName: 'Stazama Platform',
      siteDescription: 'Your trusted partner for product verification',
      siteUrl: 'https://stazama.com',
      adminEmail: 'admin@stazama.com',
      enableRegistration: true,
      enableEmailVerification: true,
      maxFileSize: 10,
      rateLimit: 100,
      maintenanceMode: false,
      enableLogging: true,
      logLevel: 'info',
      databaseUrl: '',
      jwtSecret: '',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: ''
    });
  };

  const renderField = (field: SettingField) => {
    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <Label htmlFor={field.id} className="flex items-center space-x-2">
              <span>{field.label}</span>
            </Label>
            <Switch
              id={field.id}
              checked={settings[field.id] as boolean}
              onCheckedChange={(checked) => handleInputChange(field.id, checked)}
            />
          </div>
        );
      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Textarea
              id={field.id}
              value={settings[field.id] as string}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );
      case 'password':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <div className="relative">
              <Input
                id={field.id}
                type="password"
                value={settings[field.id] as string}
                onChange={(e) => handleInputChange(field.id, e.target.value)}
                className="pr-10"
              />
              <Key className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            <Input
              id={field.id}
              type={field.type}
              value={settings[field.id] as string | number}
              onChange={(e) => handleInputChange(field.id, field.type === 'number' ? Number(e.target.value) : e.target.value)}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );
    }
  };

  const getFieldsForSection = (sectionId: string): SettingField[] => {
    switch (sectionId) {
      case 'general':
        return [
          { id: 'siteName', label: 'Site Name', type: 'text', value: settings.siteName },
          { id: 'siteDescription', label: 'Site Description', type: 'textarea', value: settings.siteDescription },
          { id: 'siteUrl', label: 'Site URL', type: 'text', value: settings.siteUrl },
          { id: 'adminEmail', label: 'Admin Email', type: 'text', value: settings.adminEmail },
          { id: 'enableRegistration', label: 'Enable User Registration', type: 'boolean', value: settings.enableRegistration },
          { id: 'enableEmailVerification', label: 'Require Email Verification', type: 'boolean', value: settings.enableEmailVerification },
          { id: 'maxFileSize', label: 'Max File Size (MB)', type: 'number', value: settings.maxFileSize }
        ];
      case 'security':
        return [
          { id: 'maintenanceMode', label: 'Maintenance Mode', type: 'boolean', value: settings.maintenanceMode },
          { id: 'jwtSecret', label: 'JWT Secret', type: 'password', value: settings.jwtSecret, description: 'Secret key for JWT tokens' },
          { id: 'enableLogging', label: 'Enable Logging', type: 'boolean', value: settings.enableLogging },
          { id: 'logLevel', label: 'Log Level', type: 'text', value: settings.logLevel, description: 'Log level (debug, info, warn, error)' }
        ];
      case 'database':
        return [
          { id: 'databaseUrl', label: 'Database URL', type: 'password', value: settings.databaseUrl, description: 'Connection string for the database' }
        ];
      case 'email':
        return [
          { id: 'smtpHost', label: 'SMTP Host', type: 'text', value: settings.smtpHost },
          { id: 'smtpPort', label: 'SMTP Port', type: 'number', value: settings.smtpPort },
          { id: 'smtpUser', label: 'SMTP User', type: 'text', value: settings.smtpUser },
          { id: 'smtpPassword', label: 'SMTP Password', type: 'password', value: settings.smtpPassword }
        ];
      case 'api':
        return [
          { id: 'rateLimit', label: 'Rate Limit (requests/min)', type: 'number', value: settings.rateLimit },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">System Settings</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex space-x-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Card>
            <CardContent className="p-0 mt-6">
              <div className="space-y-1">
                {sections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <button
                      key={section.id}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <IconComponent className="h-5 w-5" />
                      <div>
                        <div className="font-medium">{section.title}</div>
                        <div className="text-xs opacity-70">{section.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Form */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {(() => {
                  const section = sections.find(s => s.id === activeSection);
                  const IconComponent = section?.icon || Settings;
                  return <IconComponent className="h-5 w-5" />;
                })()}
                <span>{sections.find(s => s.id === activeSection)?.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {getFieldsForSection(activeSection).map((field) => (
                  <div key={field.id}>
                    {renderField(field)}
                  </div>
                ))}
              </div>

              {activeSection === 'security' && settings.maintenanceMode && (
                <div className="flex items-start space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Maintenance Mode Active</h4>
                    <p className="text-sm text-yellow-600">
                      The site is currently in maintenance mode. Only admins can access the site.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}