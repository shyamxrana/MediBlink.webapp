import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

export default function SettingsTab() {
  const [settingsForm, setSettingsForm] = useState({
    emailNotifications: true,
    smsNotifications: false,
    language: 'en',
    shareRecords: true
  });
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(true);
    // In a real app, you would save these settings to the backend
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8">
        <form onSubmit={handleSettingsSubmit} className="space-y-6 max-w-2xl">
          {settingsSuccess && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Settings saved successfully!</h3>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-8">
            {/* Notifications Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="emailNotifications"
                      name="emailNotifications"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={settingsForm.emailNotifications}
                      onChange={(e) => setSettingsForm({ ...settingsForm, emailNotifications: e.target.checked })}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="emailNotifications" className="font-medium text-gray-700">Email Notifications</label>
                    <p className="text-gray-500">Receive appointment reminders and updates via email.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="smsNotifications"
                      name="smsNotifications"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={settingsForm.smsNotifications}
                      onChange={(e) => setSettingsForm({ ...settingsForm, smsNotifications: e.target.checked })}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="smsNotifications" className="font-medium text-gray-700">SMS Notifications</label>
                    <p className="text-gray-500">Receive text messages for upcoming appointments.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Section */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy & Data</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="shareRecords"
                      name="shareRecords"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={settingsForm.shareRecords}
                      onChange={(e) => setSettingsForm({ ...settingsForm, shareRecords: e.target.checked })}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="shareRecords" className="font-medium text-gray-700">Share Medical Records</label>
                    <p className="text-gray-500">Allow your assigned doctors to view your complete medical history.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
              <div className="sm:col-span-2">
                <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                  Language
                </label>
                <div className="mt-1">
                  <Select
                    id="language"
                    name="language"
                    value={settingsForm.language}
                    onChange={(e) => setSettingsForm({ ...settingsForm, language: e.target.value })}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'es', label: 'Spanish' },
                      { value: 'fr', label: 'French' },
                      { value: 'de', label: 'German' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 flex justify-end">
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              Save Preferences
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
