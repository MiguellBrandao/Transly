import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { api } from '../config/api';
import {
  Folder,
  Video,
  Search,
  Trash2,
  FolderPlus,
  MoreVertical,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt, enUS } from 'date-fns/locale';

interface VideoData {
  id: string;
  title: string;
  status: string;
  created_at: string;
  size: number;
  folder_id: string | null;
}

interface FolderData {
  id: string;
  name: string;
  created_at: string;
  parent_folder_id: string | null;
}

const FileManager = () => {
  const { t, i18n } = useTranslation();
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    loadData();
  }, [currentFolder]);

  const loadData = async () => {
    try {
      const [videosData, foldersData] = await Promise.all([
        api.get('/api/videos'),
        api.get('/api/folders'),
      ]);
      setVideos(videosData);
      setFolders(foldersData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await api.post('/api/folders', {
        name: newFolderName,
        parent_folder_id: currentFolder,
      });
      setNewFolderName('');
      setShowNewFolder(false);
      loadData();
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm(t('files.confirmDelete'))) return;

    try {
      await api.delete(`/api/videos/${id}`);
      loadData();
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  const deleteFolder = async (id: string) => {
    if (!confirm(t('files.confirmDelete'))) return;

    try {
      await api.delete(`/api/folders/${id}`);
      loadData();
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
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

  const filteredFolders = folders.filter(
    (f) =>
      f.parent_folder_id === currentFolder &&
      f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVideos = videos.filter(
    (v) =>
      v.folder_id === currentFolder &&
      v.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const locale = i18n.language === 'pt' ? pt : enUS;

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('files.title')}
          </h1>
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            <FolderPlus className="w-5 h-5 mr-2" />
            {t('files.newFolder')}
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('files.search')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* New Folder Modal */}
        {showNewFolder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('files.newFolder')}
              </h3>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t('files.folderName')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={createFolder}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Files & Folders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : filteredFolders.length === 0 && filteredVideos.length === 0 ? (
            <div className="p-12 text-center">
              <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {t('dashboard.noVideos')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Folders */}
              {filteredFolders.map((folder) => (
                <div
                  key={folder.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group"
                >
                  <button
                    onClick={() => setCurrentFolder(folder.id)}
                    className="flex items-center flex-1"
                  >
                    <Folder className="w-10 h-10 text-yellow-500 mr-4" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {folder.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(folder.created_at), {
                          addSuffix: true,
                          locale,
                        })}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteFolder(folder.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {/* Videos */}
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group"
                >
                  <Link to={`/video/${video.id}`} className="flex items-center flex-1">
                    <Video className="w-10 h-10 text-gray-400 mr-4" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {video.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(video.created_at), {
                          addSuffix: true,
                          locale,
                        })}{' '}
                        • {formatBytes(video.size)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        video.status
                      )}`}
                    >
                      {t(`status.${video.status}`)}
                    </span>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      deleteVideo(video.id);
                    }}
                    className="ml-4 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FileManager;

