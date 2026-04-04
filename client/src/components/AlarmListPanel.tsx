import React, { useState } from 'react';
import { useAlarms } from '@/hooks/useAlarm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Bell, Trash2, Plus, Clock } from 'lucide-react';
import { format, addMinutes, addHours, addDays } from 'date-fns';

export default function AlarmListPanel() {
  const {
    alarms,
    isLoading,
    createAlarm,
    deleteAlarm,
    isCreating,
    isDeleting,
    requestNotificationPermission
  } = useAlarms();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [alarmLabel, setAlarmLabel] = useState('Wellness Check-in');
  const [timeOption, setTimeOption] = useState('15min');
  const [customMinutes, setCustomMinutes] = useState(30);

  const getAlarmTime = () => {
    const now = new Date();
    switch (timeOption) {
      case '15min': return addMinutes(now, 15);
      case '30min': return addMinutes(now, 30);
      case '1hour': return addHours(now, 1);
      case '2hours': return addHours(now, 2);
      case '4hours': return addHours(now, 4);
      case '1day': return addDays(now, 1);
      case 'custom': return addMinutes(now, customMinutes);
      default: return addMinutes(now, 30);
    }
  };

  const handleCreateAlarm = async () => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return;
    }

    const triggerAt = getAlarmTime();
    
    createAlarm({
      label: alarmLabel,
      triggerAt,
      isActive: true,
      isRecurring: false,
      notificationSent: false
    });

    // Reset form
    setAlarmLabel('Wellness Check-in');
    setTimeOption('15min');
    setShowCreateForm(false);
  };

  const formatAlarmTime = (triggerAt: string | Date) => {
    const date = new Date(triggerAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const getTimeUntilAlarm = (triggerAt: string | Date) => {
    const date = new Date(triggerAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Past due';
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2 text-blue-600">Loading alarms...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Bell className="h-5 w-5" />
          Wellness Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Alarm Button */}
        {!showCreateForm && (
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Schedule New Reminder
          </Button>
        )}

        {/* Create Alarm Form */}
        {showCreateForm && (
          <div className="space-y-4 p-4 bg-white dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
            <div>
              <Label htmlFor="alarm-label" className="text-blue-900 dark:text-blue-100">
                Reminder Message
              </Label>
              <Input
                id="alarm-label"
                value={alarmLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAlarmLabel(e.target.value)}
                placeholder="Enter reminder message"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="time-option" className="text-blue-900 dark:text-blue-100">
                When to remind you
              </Label>
              <Select value={timeOption} onValueChange={setTimeOption}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15min">In 15 minutes</SelectItem>
                  <SelectItem value="30min">In 30 minutes</SelectItem>
                  <SelectItem value="1hour">In 1 hour</SelectItem>
                  <SelectItem value="2hours">In 2 hours</SelectItem>
                  <SelectItem value="4hours">In 4 hours</SelectItem>
                  <SelectItem value="1day">Tomorrow</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timeOption === 'custom' && (
              <div>
                <Label htmlFor="custom-minutes" className="text-blue-900 dark:text-blue-100">
                  Minutes from now
                </Label>
                <Input
                  id="custom-minutes"
                  type="number"
                  min="1"
                  max="10080" // 1 week
                  value={customMinutes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomMinutes(parseInt(e.target.value) || 30)}
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateAlarm}
                disabled={isCreating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Schedule
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Alarm List */}
        {alarms.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-blue-300 dark:text-blue-600 mb-3" />
            <p className="text-blue-600 dark:text-blue-300">No reminders scheduled</p>
            <p className="text-sm text-blue-500 dark:text-blue-400">
              Schedule a wellness reminder to stay on track with your mental health goals
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Scheduled Reminders ({alarms.length})
            </h4>
            {alarms.map((alarm) => (
              <div
                key={alarm.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700"
              >
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {alarm.label}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    {formatAlarmTime(alarm.triggerAt)}
                  </p>
                  <p className="text-xs text-blue-500 dark:text-blue-400">
                    {getTimeUntilAlarm(alarm.triggerAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteAlarm(alarm.id)}
                  disabled={isDeleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
