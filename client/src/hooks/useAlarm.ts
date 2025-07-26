import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { Alarm, InsertAlarm } from '@shared/schema';

interface AlarmResponse {
  alarms: Alarm[];
}

interface CreateAlarmResponse {
  success: boolean;
  alarm: Alarm;
  message: string;
}

interface DeleteAlarmResponse {
  success: boolean;
  message: string;
}

export function useAlarms() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's alarms
  const alarmsQuery = useQuery({
    queryKey: ['/api/alarms'],
    queryFn: async (): Promise<AlarmResponse> => {
      const response = await fetch('/api/alarms', {
        headers: {
          'X-Device-Fingerprint': localStorage.getItem('deviceFingerprint') || '',
          'X-Session-ID': localStorage.getItem('sessionId') || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch alarms');
      }
      
      return response.json();
    }
  });

  // Create new alarm
  const createAlarmMutation = useMutation({
    mutationFn: async (data: Omit<InsertAlarm, 'userId'> & { triggerAt: Date | string }): Promise<CreateAlarmResponse> => {
      const response = await fetch('/api/alarms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Fingerprint': localStorage.getItem('deviceFingerprint') || '',
          'X-Session-ID': localStorage.getItem('sessionId') || ''
        },
        body: JSON.stringify({
          ...data,
          triggerAt: typeof data.triggerAt === 'string' ? data.triggerAt : data.triggerAt.toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create alarm');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/alarms'] });
      toast({
        title: '✅ Alarm Scheduled',
        description: data.message
      });
    },
    onError: (error) => {
      toast({
        title: '❌ Failed to Schedule Alarm',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Delete alarm
  const deleteAlarmMutation = useMutation({
    mutationFn: async (id: number): Promise<DeleteAlarmResponse> => {
      const response = await fetch('/api/alarms', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Fingerprint': localStorage.getItem('deviceFingerprint') || '',
          'X-Session-ID': localStorage.getItem('sessionId') || ''
        },
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete alarm');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/alarms'] });
      toast({
        title: '🗑️ Alarm Deleted',
        description: data.message
      });
    },
    onError: (error) => {
      toast({
        title: '❌ Failed to Delete Alarm',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Request notification permission
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: '❌ Not Supported',
        description: 'This browser does not support notifications',
        variant: 'destructive'
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  };

  // Schedule browser notification for upcoming alarms
  const scheduleNotifications = () => {
    if (!alarmsQuery.data?.alarms) return;

    alarmsQuery.data.alarms.forEach((alarm) => {
      const now = new Date();
      const triggerTime = new Date(alarm.triggerAt);
      const timeUntilTrigger = triggerTime.getTime() - now.getTime();

      // Only schedule notifications for alarms within the next 24 hours
      if (timeUntilTrigger > 0 && timeUntilTrigger <= 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification('🧘 Chakrai Wellness Reminder', {
              body: alarm.label || 'Time for your wellness check-in',
              icon: '/icon.png',
              tag: `chakrai-alarm-${alarm.id}`,
              requireInteraction: true
            });
          }
        }, timeUntilTrigger);
      }
    });
  };

  // Initialize notifications when alarms are loaded
  useEffect(() => {
    if (alarmsQuery.data?.alarms && Notification.permission === 'granted') {
      scheduleNotifications();
    }
  }, [alarmsQuery.data]);

  return {
    alarms: alarmsQuery.data?.alarms || [],
    isLoading: alarmsQuery.isLoading,
    error: alarmsQuery.error,
    createAlarm: createAlarmMutation.mutate,
    deleteAlarm: deleteAlarmMutation.mutate,
    isCreating: createAlarmMutation.isPending,
    isDeleting: deleteAlarmMutation.isPending,
    requestNotificationPermission,
    refetch: alarmsQuery.refetch
  };
}