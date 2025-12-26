import React, { useState } from 'react';

interface SystemSettings {
  enableMonitoring: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  cacheEnabled: boolean;
  maxCacheSize: number;
  sessionTimeout: number;
  enableNotifications: boolean;
}

export function SettingsTab() {
  const [settings, setSettings] = useState<SystemSettings>({
    enableMonitoring: true,
    logLevel: 'info',
    cacheEnabled: true,
    maxCacheSize: 1000,
    sessionTimeout: 30,
    enableNotifications: false,
  });

  const handleSettingChange = (key: keyof SystemSettings, value: SystemSettings[keyof SystemSettings]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // In a real app, this would save to a database or config file
    console.log('Saving settings:', settings);
    // TODO: Show proper success notification using toast or similar
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">System Settings</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monitoring</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Enable Performance Monitoring
              </label>
              <input
                type="checkbox"
                checked={settings.enableMonitoring}
                onChange={(e) => handleSettingChange('enableMonitoring', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Log Level
              </label>
              <select
                value={settings.logLevel}
                onChange={(e) => handleSettingChange('logLevel', e.target.value as SystemSettings['logLevel'])}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Cache Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Enable Cache
              </label>
              <input
                type="checkbox"
                checked={settings.cacheEnabled}
                onChange={(e) => handleSettingChange('cacheEnabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Cache Size (items)
              </label>
              <input
                type="number"
                value={settings.maxCacheSize}
                onChange={(e) => handleSettingChange('maxCacheSize', e.target.value as unknown as number)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', e.target.value as unknown as number)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Enable Notifications
              </label>
              <input
                type="checkbox"
                checked={settings.enableNotifications}
                onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
