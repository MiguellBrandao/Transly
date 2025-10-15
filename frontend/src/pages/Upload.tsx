import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { api } from '../config/api';
import { Upload as UploadIcon, CheckCircle, XCircle } from 'lucide-react';

const Upload = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      setError('');
      setSuccess(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
      setError('');
      setSuccess(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError(t('upload.error'));
      return;
    }

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', title);

      await api.upload('/api/videos/upload', formData, (p) => setProgress(p));

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('upload.error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('upload.title')}
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {success ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('upload.success')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('upload.processing')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Drag & Drop Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center mb-6 hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
              >
                <UploadIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                  {t('upload.dragDrop')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('upload.or')}
                </p>
                <label className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-colors">
                  {t('upload.browse')}
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  {t('upload.formats')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('upload.maxSize')}
                </p>
              </div>

              {/* File Info */}
              {file && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('files.name')}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {file.name} ({Math.round(file.size / 1024 / 1024)} MB)
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              {uploading && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <span>{t('upload.uploading')}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                  <XCircle className="w-5 h-5 text-red-500 mr-3" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? t('upload.uploading') : t('upload.selectFile')}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Upload;

