import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSocket } from '../config/socket';
import { CheckCircle, Loader2, X } from 'lucide-react';
import { api } from '../config/api';

interface Notification {
  videoId: string;
  status: 'processing' | 'completed';
  title?: string;
}

const TranscriptionNotifications = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const socket = getSocket();

    socket.on('transcription:started', async (data: any) => {
      // Get video title
      try {
        const video = await api.get(`/api/videos/${data.videoId}`);
        setNotifications(prev => [
          ...prev.filter(n => n.videoId !== data.videoId),
          {
            videoId: data.videoId,
            status: 'processing',
            title: video.title,
          },
        ]);
      } catch (error) {
        console.error('Failed to get video info:', error);
      }
    });

    socket.on('transcription:completed', async (data: any) => {
      // Update notification to completed
      setNotifications(prev =>
        prev.map(n =>
          n.videoId === data.videoId
            ? { ...n, status: 'completed' as const }
            : n
        )
      );

      // Remove completed notification after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.videoId !== data.videoId));
      }, 5000);
    });

    return () => {
      socket.off('transcription:started');
      socket.off('transcription:completed');
    };
  }, []);

  const removeNotification = (videoId: string) => {
    setNotifications(prev => prev.filter(n => n.videoId !== videoId));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-64 right-0 z-50 p-4 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.videoId}
          className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-lg transition-all ${
            notification.status === 'processing'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.status === 'processing' ? (
              <Loader2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                notification.status === 'processing'
                  ? 'text-yellow-800 dark:text-yellow-300'
                  : 'text-green-800 dark:text-green-300'
              }`}>
                {notification.status === 'processing'
                  ? t('status.processing')
                  : '✓ ' + t('status.completed')}
              </p>
              <p className={`text-xs ${
                notification.status === 'processing'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {notification.title || 'Video'}
              </p>
            </div>
          </div>
          {notification.status === 'completed' && (
            <button
              onClick={() => removeNotification(notification.videoId)}
              className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors"
            >
              <X className="w-4 h-4 text-green-600 dark:text-green-400" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default TranscriptionNotifications;

