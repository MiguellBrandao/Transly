import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { api } from '../config/api';
import ReactPlayer from 'react-player';
import {
  ArrowLeft,
  Search,
  Copy,
  Download,
  Play,
  Pause,
} from 'lucide-react';

interface Word {
  word: string;
  start: number;
  end: number;
  confidence?: number;
}

interface Sentence {
  text: string;
  start: number;
  end: number;
  words: Word[];
}

interface Transcription {
  id: string;
  text: string;
  words: Word[];
  sentences: Sentence[];
  language: string;
}

interface Video {
  id: string;
  title: string;
  storage_url: string;
  status: string;
}

const VideoPlayer = () => {
  const { id } = useParams();
  const { t } = useTranslation();

  const [video, setVideo] = useState<Video | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredWord, setHoveredWord] = useState<Word | null>(null);

  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [videoData, transcriptionData] = await Promise.all([
        api.get(`/api/videos/${id}`),
        api.get(`/api/transcriptions/video/${id}`).catch(() => null),
      ]);
      setVideo(videoData);
      setTranscription(transcriptionData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgress = (state: any) => {
    setCurrentTime(state.playedSeconds);
  };

  const seekTo = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time, 'seconds');
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportTranscription = async (format: string) => {
    try {
      const { supabase } = await import('../config/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No access token available');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/transcriptions/export/${id}/${format}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video?.title}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export transcription. Please try again.');
    }
  };

  const getCurrentWord = () => {
    if (!transcription?.words) return null;
    return transcription.words.find(
      (w) => currentTime >= w.start && currentTime <= w.end
    );
  };

  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  const highlightSearch = (text: string) => {
    if (!searchTerm) return text;

    const normalizedSearch = normalizeText(searchTerm);
    const normalizedText = normalizeText(text);
    const index = normalizedText.indexOf(normalizedSearch);

    if (index === -1) return text;

    const before = text.slice(0, index);
    const match = text.slice(index, index + searchTerm.length);
    const after = text.slice(index + searchTerm.length);

    return (
      <>
        {before}
        <mark className="bg-yellow-300 dark:bg-yellow-600">{match}</mark>
        {after}
      </>
    );
  };

  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4, 8, 16];

  const currentWord = getCurrentWord();

  if (loading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              to="/dashboard"
              className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {video?.title}
            </h1>
          </div>

          {transcription && (
            <div className="flex gap-2">
              <button
                onClick={() => exportTranscription('txt')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                TXT
              </button>
              <button
                onClick={() => exportTranscription('csv')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
              <button
                onClick={() => exportTranscription('docx')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                DOCX
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Player */}
          <div className="space-y-4">
            <div className="bg-black rounded-lg overflow-hidden aspect-video">
              <ReactPlayer
                ref={playerRef}
                url={video?.storage_url}
                playing={playing}
                playbackRate={playbackRate}
                onProgress={handleProgress}
                width="100%"
                height="100%"
                controls={false}
              />
            </div>

            {/* Custom Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setPlaying(!playing)}
                  className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={playerRef.current?.getDuration() || 0}
                    value={currentTime}
                    onChange={(e) => seekTo(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(playerRef.current?.getDuration() || 0)}</span>
                  </div>
                </div>

                <select
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500"
                >
                  {speedOptions.map((speed) => (
                    <option key={speed} value={speed}>
                      {speed}x
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Transcription */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('player.transcription')}
            </h2>

            {!transcription ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">
                  {video?.status === 'processing'
                    ? t('player.processing')
                    : t('player.noTranscription')}
                </p>
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('player.search')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>

                {/* Copy All Button */}
                <button
                  onClick={() => copyText(transcription.text)}
                  className="w-full mb-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {t('player.copyAll')}
                </button>

                {/* Transcription Content */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                  {transcription.sentences?.map((sentence, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(sentence.start)} - {formatTime(sentence.end)}
                        </span>
                        <button
                          onClick={() => copyText(sentence.text)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-gray-900 dark:text-white leading-relaxed">
                        {sentence.words?.map((word, widx) => {
                          const isCurrentWord =
                            currentTime >= word.start && currentTime <= word.end;
                          return (
                            <span
                              key={widx}
                              onClick={() => seekTo(word.start)}
                              onMouseEnter={() => setHoveredWord(word)}
                              onMouseLeave={() => setHoveredWord(null)}
                              className={`cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/20 px-1 rounded transition-all relative ${
                                isCurrentWord
                                  ? 'underline decoration-2 decoration-primary-600 dark:decoration-primary-400'
                                  : ''
                              }`}
                              title={t('player.wordInfo', {
                                word: word.word,
                                start: word.start.toFixed(2),
                                end: word.end.toFixed(2),
                                duration: (word.end - word.start).toFixed(2),
                              })}
                            >
                              {highlightSearch(word.word)}
                              {' '}
                            </span>
                          );
                        })}
                      </p>
                    </div>
                  )) || (
                    <div className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {highlightSearch(transcription.text)}
                    </div>
                  )}
                </div>

                {/* Hovered Word Tooltip */}
                {hoveredWord && (
                  <div className="fixed bottom-4 right-4 bg-gray-900 dark:bg-gray-700 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50">
                    <div className="font-semibold mb-1">{hoveredWord.word}</div>
                    <div className="text-xs text-gray-300 dark:text-gray-400">
                      {t('player.wordInfo', {
                        word: hoveredWord.word,
                        start: hoveredWord.start.toFixed(2),
                        end: hoveredWord.end.toFixed(2),
                        duration: (hoveredWord.end - hoveredWord.start).toFixed(2),
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default VideoPlayer;

