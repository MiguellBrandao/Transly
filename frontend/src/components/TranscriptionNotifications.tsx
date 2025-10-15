import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSocket } from '../config/socket';
import { CheckCircle, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../config/api';

interface Notification {
  videoId: string;
  status: 'processing' | 'completed';
  title?: string;
  completedAt?: number;
}

const TranscriptionNotifications = () => {
  const { t } = useTranslation();

  // Load notifications from localStorage
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('transly_notifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('transly_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('transcription:started', async (data: any) => {
      console.log('📢 Received transcription:started event:', data);
      try {
        const video = await api.get(`/api/videos/${data.videoId}`);
        setNotifications(prev => {
          const filtered = prev.filter(n => n.videoId !== data.videoId);
          return [
            {
              videoId: data.videoId,
              status: 'processing',
              title: video.title,
            },
            ...filtered,
          ];
        });
      } catch (error) {
        console.error('Failed to get video info:', error);
      }
    });

    socket.on('transcription:completed', async (data: any) => {
      console.log('📢 Received transcription:completed event:', data);
      setNotifications(prev => {
        const updated = prev.map(n =>
          n.videoId === data.videoId
            ? { ...n, status: 'completed' as const, completedAt: Date.now() }
            : n
        );
        console.log('📢 Updated notifications:', updated);
        return updated;
      });
    });

    return () => {
      socket.off('transcription:started');
      socket.off('transcription:completed');
    };
  }, []);

  // Clean up old completed notifications (> 1 hour or > 5 completed)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      setNotifications(prev => {
        const completed = prev.filter(n => n.status === 'completed');
        const processing = prev.filter(n => n.status === 'processing');

        // Remove if > 1 hour old OR if > 5 completed
        const filteredCompleted = completed.filter(n => {
          if (completed.length > 5) {
            // Keep only the 5 most recent
            const sortedByTime = completed.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
            return sortedByTime.slice(0, 5).includes(n);
          }
          // Remove if older than 1 hour
          return (now - (n.completedAt || 0)) < oneHour;
        });

        return [...processing, ...filteredCompleted];
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const removeNotification = (videoId: string) => {
    setNotifications(prev => prev.filter(n => n.videoId !== videoId));
  };

  const processingCount = notifications.filter(n => n.status === 'processing').length;
  const completedCount = notifications.filter(n => n.status === 'completed').length;

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div 
          className="px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-700 dark:to-cyan-700 text-white flex items-center justify-between cursor-pointer hover:from-blue-700 hover:to-cyan-700 transition-all"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <Loader2 className={`w-5 h-5 ${processingCount > 0 ? 'animate-spin' : ''}`} />
            <div>
              <p className="font-semibold text-sm">Transcriptions Queue</p>
              <p className="text-xs opacity-90">
                {processingCount} processing • {completedCount} completed
              </p>
            </div>
          </div>
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </div>

        {/* List */}
        {!isCollapsed && (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.videoId}
                className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                  notification.status === 'processing'
                    ? 'bg-blue-50 dark:bg-blue-900/10'
                    : 'bg-green-50 dark:bg-green-900/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {notification.status === 'processing' ? (
                      <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${
                        notification.status === 'processing'
                          ? 'text-blue-900 dark:text-blue-200'
                          : 'text-green-900 dark:text-green-200'
                      }`}>
                        {notification.title || 'Video'}
                      </p>
                      <p className={`text-xs ${
                        notification.status === 'processing'
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {notification.status === 'processing'
                          ? t('notifications.processing')
                          : t('notifications.completed')}
                      </p>
                    </div>
                  </div>
                  {notification.status === 'completed' && (
                    <button
                      onClick={() => removeNotification(notification.videoId)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                    >
                      <X className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptionNotifications;

