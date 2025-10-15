import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { api } from '../config/api';
import { Video, Upload, FileText, HardDrive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';

interface VideoData {
  id: string;
  title: string;
  status: string;
  created_at: string;
  size: number;
}

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
    
    // Auto-refresh every 5 seconds if there are processing videos
    const interval = setInterval(() => {
      if (videos.some(v => v.status === 'processing')) {
        loadVideos();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [videos]);

  const loadVideos = async () => {
    try {
      const data = await api.get('/api/videos');
      setVideos(data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400';
      case 'processing':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400';
    }
  };

  const locale = i18n.language === 'pt' ? pt : enUS;

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/20">
                <Video className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboard.stats.totalVideos')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {videos.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboard.stats.totalTranscriptions')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {videos.filter(v => v.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <HardDrive className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('dashboard.stats.storageUsed')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatBytes(videos.reduce((acc, v) => acc + v.size, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Videos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('dashboard.recentVideos')}
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="p-12 text-center">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('dashboard.noVideos')}
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                {t('dashboard.uploadFirst')}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {videos.map((video) => (
                <Link
                  key={video.id}
                  to={`/video/${video.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <Video className="w-10 h-10 text-gray-400 mr-4" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {video.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(video.created_at), {
                            addSuffix: true,
                            locale,
                          })} • {formatBytes(video.size)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        video.status
                      )}`}
                    >
                      {t(`status.${video.status}`)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

