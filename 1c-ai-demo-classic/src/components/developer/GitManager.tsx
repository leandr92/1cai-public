/**
 * Компонент управления Git для разработки 1С
 * Интерфейс для работы с репозиториями, ветками, коммитами и Pull Requests
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  GitRepository,
  GitStatus,
  GitMergeOptions,
  GitPushOptions,
  GitCloneOptions,
  GitProvider,
  GitFile
} from '../../services/git-integration-service';

import {
  GitBranch as GitBranchIcon,
  GitCommit as GitCommitIcon,
  GitPullRequest as GitPullRequestIcon,
  Folder as RepositoryIcon,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Save,
  Share2,
  Users,
  Eye,
  Code,
  Clock,
  User,
  Calendar,
  Hash,
  ArrowRight,
  ArrowLeft,
  GitMerge,
  GitBranchPlus,
  GitBranch as GitBranchMinus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Zap,
  FileText,
  FolderOpen,
  Folder,
  Package,
  Tag,
  Shield,
  Globe,
  Lock,
  EyeOff,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Activity,
  BarChart3,
  History,
  GitFork
} from 'lucide-react';

import {
  gitIntegrationService,
  GitIntegrationConfig,
  GitFileStatus,
  GitPRState,
  GitCollaborationAction
} from '../../services/git-integration-service';

interface GitManagerProps {
  repository?: string;
  owner?: string;
  readonly?: boolean;
  height?: string | number;
  width?: string | number;
  className?: string;
  onRepositoryChange?: (repository: GitRepository | null) => void;
  onBranchChange?: (branch: string) => void;
  onCommit?: (commit: GitCommit) => void;
}

interface FilterOptions {
  branch?: string;
  author?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  message?: string;
  filePattern?: string;
}

interface GitRelease {
  id: string;
  name: string;
  tag: string;
  description: string;
  published_at: Date;
  author: {
    name: string;
  };
}

interface GitTag {
  name: string;
  commit: {
    sha: string;
  };
  protected: boolean;
}

interface ViewMode {
  active: 'overview' | 'commits' | 'branches' | 'pulls' | 'releases' | 'settings';
  collapsed: boolean;
}

const GitManager: React.FC<GitManagerProps> = ({
  repository = '',
  owner = '',
  readonly = false,
  height = '600px',
  width = '100%',
  className = '',
  onRepositoryChange,
  onBranchChange,
  onCommit
}) => {
  // Состояние основных данных
  const [currentRepository, setCurrentRepository] = useState<GitRepository | null>(null);
  const [branches, setBranches] = useState<GitBranch[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [pullRequests, setPullRequests] = useState<GitPullRequest[]>([]);
  const [releases, setReleases] = useState<GitRelease[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [tags, setTags] = useState<GitTag[]>([]);

  // Состояние UI
  const [viewMode, setViewMode] = useState<ViewMode>({
    active: 'overview',
    collapsed: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [showNewBranch, setShowNewBranch] = useState(false);
  const [showNewPR, setShowNewPR] = useState(false);
  const [showNewRepo, setShowNewRepo] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);

  // Состояние конфигурации
  const [config, setConfig] = useState<GitIntegrationConfig>({
    provider: GitProvider.GITHUB,
    token: '',
    username: '',
    repository: repository,
    owner: owner,
    baseUrl: 'https://api.github.com',
    autoCommit: false,
    autoPush: false,
    autoCreatePR: true
  });

  // Состояние форм
  const [newBranchName, setNewBranchName] = useState('');
  const [baseBranch, setBaseBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('');
  const [newRepoName, setNewRepoName] = useState('');
  const [cloneUrl, setCloneUrl] = useState('');
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prDescription, setPrDescription] = useState('');
  const [releaseVersion, setReleaseVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');

  // Состояние фильтрации и поиска
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка данных при монтировании
  useEffect(() => {
    if (repository && owner) {
      loadRepository();
    }
  }, [repository, owner]);

  // Загрузка данных репозитория
  const loadRepositoryData = useCallback(async () => {
    try {
      if (!currentRepository) return;

      // Параллельная загрузка данных
      const [branchesData, commitsData, prsData, statusData, tagsData] = await Promise.all([
        gitIntegrationService.getBranches(currentRepository.id),
        gitIntegrationService.getCommits(currentRepository.id),
        gitIntegrationService.getPullRequests(),
        gitIntegrationService.getStatus(),
        gitIntegrationService.getTags()
      ]);

      setBranches(branchesData);
      setCommits(commitsData);
      setPullRequests(prsData);
      setStatus(statusData);
      setTags(tagsData);
    } catch (error: any) {
      setError(`Ошибка загрузки данных репозитория: ${error.message}`);
    }
  }, [currentRepository]);

  // Загрузка репозитория
  const loadRepository = useCallback(async () => {
    if (!repository || !owner) return;

    try {
      setIsLoading(true);
      setError(null);

      const repo = await gitIntegrationService.getRepository(owner, repository);
      setCurrentRepository(repo);
      gitIntegrationService.setCurrentRepository(repo);
      onRepositoryChange?.(repo);

      // Загрузка данных репозитория
      await loadRepositoryData();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [repository, owner, onRepositoryChange]);

  // Создание нового репозитория
  const handleCreateRepository = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const repo = await gitIntegrationService.createRepository(newRepoName, {
        description: 'Новый репозиторий для разработки на 1С',
        private: false,
        autoInit: true
      });

      setCurrentRepository(repo);
      gitIntegrationService.setCurrentRepository(repo);
      setShowNewRepo(false);
      setNewRepoName('');
      
      onRepositoryChange?.(repo);
      await loadRepositoryData();
    } catch (error: any) {
      setError(`Ошибка создания репозитория: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [newRepoName, onRepositoryChange, loadRepositoryData]);

  // Клонирование репозитория
  const handleCloneRepository = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const cloneOptions: GitCloneOptions = {
        branch: currentBranch,
        depth: 1,
        singleBranch: true
      };

      const repo = await gitIntegrationService.cloneRepository(cloneUrl, cloneOptions);
      setCurrentRepository(repo);
      gitIntegrationService.setCurrentRepository(repo);
      setShowCloneModal(false);
      setCloneUrl('');
      
      onRepositoryChange?.(repo);
      await loadRepositoryData();
    } catch (error: any) {
      setError(`Ошибка клонирования репозитория: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [cloneUrl, currentBranch, onRepositoryChange, loadRepositoryData]);

  // Создание новой ветки
  const handleCreateBranch = useCallback(async () => {
    if (!newBranchName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      if (!currentRepository) {
        throw new Error('Репозиторий не выбран');
      }

      const branch = await gitIntegrationService.createBranch(currentRepository.id, newBranchName, baseBranch);
      setBranches((prev: GitBranch[]) => [...prev, branch]);
      setShowNewBranch(false);
      setNewBranchName('');
      setBaseBranch('main');
    } catch (error: any) {
      setError(`Ошибка создания ветки: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [newBranchName, baseBranch, currentRepository]);

  // Переключение ветки
  const handleCheckoutBranch = useCallback(async (branchName: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!currentRepository) {
        throw new Error('Репозиторий не выбран');
      }

      await gitIntegrationService.checkoutBranch(branchName);
      setCurrentBranch(branchName);
      setStatus((prev: GitStatus | null) => prev ? { ...prev, branch: branchName } : null);
      
      onBranchChange?.(branchName);
      await loadRepositoryData();
    } catch (error: any) {
      setError(`Ошибка переключения ветки: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [onBranchChange, currentRepository, loadRepositoryData]);

  // Создание коммита
  const handleCommit = useCallback(async () => {
    if (!commitMessage.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      if (!currentRepository) {
        throw new Error('Репозиторий не выбран');
      }

      const commit = await gitIntegrationService.commit(commitMessage);
      setCommits((prev: GitCommit[]) => [commit, ...prev]);
      setShowCommitModal(false);
      setCommitMessage('');
      
      onCommit?.(commit);
      await loadRepositoryData();
    } catch (error: any) {
      setError(`Ошибка создания коммита: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [commitMessage, onCommit, currentRepository, loadRepositoryData]);

  // Отправка изменений
  const handlePush = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!currentRepository) {
        throw new Error('Репозиторий не выбран');
      }

      const pushOptions: GitPushOptions = {
        force: false
      };

      await gitIntegrationService.push(currentRepository.id, currentBranch);
      
      // Обновление данных после push
      await loadRepositoryData();
    } catch (error: any) {
      setError(`Ошибка отправки изменений: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentBranch, currentRepository, loadRepositoryData]);

  // Получение изменений
  const handlePull = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!currentRepository) {
        throw new Error('Репозиторий не выбран');
      }

      await gitIntegrationService.pull(currentRepository.id, currentBranch);
      
      // Обновление данных после pull
      await loadRepositoryData();
    } catch (error: any) {
      setError(`Ошибка получения изменений: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentBranch, currentRepository, loadRepositoryData]);

  // Создание Pull Request
  const handleCreatePR = useCallback(async () => {
    if (!prTitle.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const pr = await gitIntegrationService.createPullRequest(prTitle, prDescription, {
        head: currentBranch,
        base: baseBranch,
        draft: false
      });

      setPullRequests((prev: GitPullRequest[]) => [pr, ...prev]);
      setShowNewPR(false);
      setPrTitle('');
      setPrDescription('');
    } catch (error: any) {
      setError(`Ошибка создания Pull Request: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [prTitle, prDescription, currentBranch, baseBranch]);

  // Объединение веток
  const handleMerge = useCallback(async () => {
    if (!mergeSource || !mergeTarget) return;

    try {
      setIsLoading(true);
      setError(null);

      if (!currentRepository) {
        throw new Error('Репозиторий не выбран');
      }

      const mergeOptions: GitMergeOptions = {
        fastForward: 'ff',
        commit: true,
        message: `Merge branch '${mergeSource}' into '${mergeTarget}'`
      };

      await gitIntegrationService.merge(mergeSource, mergeTarget, mergeOptions);
      setShowMergeModal(false);
      setMergeSource('');
      setMergeTarget('');
      
      await loadRepositoryData();
    } catch (error: any) {
      setError(`Ошибка объединения веток: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [mergeSource, mergeTarget, currentRepository, loadRepositoryData]);

  // Фильтрация коммитов
  const filteredCommits = useMemo(() => {
    let filtered = [...commits];

    if (searchQuery) {
      filtered = filtered.filter(commit =>
        commit.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commit.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.author) {
      filtered = filtered.filter(commit => commit.author.name === filters.author);
    }

    if (filters.dateRange?.from) {
      filtered = filtered.filter(commit => commit.date >= filters.dateRange!.from!);
    }

    if (filters.dateRange?.to) {
      filtered = filtered.filter(commit => commit.date <= filters.dateRange!.to!);
    }

    return filtered;
  }, [commits, searchQuery, filters]);

  // Статистика репозитория
  const repoStats = useMemo(() => {
    if (!currentRepository) return null;

    return {
      branchesCount: branches.length,
      contributorsCount: currentRepository.collaborators?.length || 0,
      commitsCount: commits.length,
      pullRequestsCount: pullRequests.filter(pr => pr.state === GitPRState.OPEN).length,
      issuesCount: 0, // Можно добавить позже
      size: '2.3 MB', // Заглушка
      lastActivity: commits[0]?.date || currentRepository.updatedAt
    };
  }, [currentRepository, branches, commits, pullRequests]);

  // Приведение статуса к GitFileStatus с проверкой
  const normalizeFileStatus = (status: string | GitFileStatus | undefined): GitFileStatus | null => {
    if (!status) return null;
    
    // Если статус уже является GitFileStatus, возвращаем его
    if (typeof status === 'object' && Object.values(GitFileStatus).includes(status)) {
      return status;
    }
    
    // Если статус является строкой, пытаемся привести к GitFileStatus
    const statusMap: Record<string, GitFileStatus> = {
      'added': GitFileStatus.ADDED,
      'modified': GitFileStatus.MODIFIED,
      'removed': GitFileStatus.REMOVED,
      'renamed': GitFileStatus.RENAMED,
      'unmodified': GitFileStatus.UNMODIFIED
    };
    
    return statusMap[status.toLowerCase()] || null;
  };

  // Приведение GitFile.status к GitFileStatus
  const normalizeGitFileStatus = (status: GitFile['status']): GitFileStatus | null => {
    const statusMap: Record<GitFile['status'], GitFileStatus> = {
      'added': GitFileStatus.ADDED,
      'modified': GitFileStatus.MODIFIED,
      'deleted': GitFileStatus.REMOVED,
      'renamed': GitFileStatus.RENAMED,
      'unmodified': GitFileStatus.UNMODIFIED
    };
    
    return statusMap[status] || null;
  };

  // Получение цвета статуса файла
  const getFileStatusColor = (status: GitFileStatus | null): string => {
    switch (status) {
      case GitFileStatus.ADDED:
        return 'text-green-600 bg-green-100';
      case GitFileStatus.MODIFIED:
        return 'text-blue-600 bg-blue-100';
      case GitFileStatus.REMOVED:
        return 'text-red-600 bg-red-100';
      case GitFileStatus.RENAMED:
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Получение иконки статуса файла
  const getFileStatusIcon = (status: GitFileStatus | null) => {
    switch (status) {
      case GitFileStatus.ADDED:
        return <Plus className="w-3 h-3" />;
      case GitFileStatus.MODIFIED:
        return <Edit className="w-3 h-3" />;
      case GitFileStatus.REMOVED:
        return <Trash2 className="w-3 h-3" />;
      case GitFileStatus.RENAMED:
        return <GitFork className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  // Получение цвета статуса PR
  const getPRStatusColor = (state: GitPRState): string => {
    switch (state) {
      case GitPRState.OPEN:
        return 'text-green-600 bg-green-100';
      case GitPRState.CLOSED:
        return 'text-gray-600 bg-gray-100';
      case GitPRState.MERGED:
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`git-manager ${className}`} style={{ height, width }}>
      {/* Заголовок */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranchIcon className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Git Управление</h2>
              <p className="text-sm text-gray-600">
                {currentRepository ? `${currentRepository.fullName}` : 'Выберите репозиторий для работы'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentRepository && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <GitBranchIcon className="w-4 h-4" />
                  {branches.length} веток
                </span>
                <span className="flex items-center gap-1">
                  <GitCommitIcon className="w-4 h-4" />
                  {commits.length} коммитов
                </span>
                <span className="flex items-center gap-1">
                  <GitPullRequestIcon className="w-4 h-4" />
                  {pullRequests.filter(pr => pr.state === GitPRState.OPEN).length} PR
                </span>
              </div>
            )}

            {!readonly && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCloneModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Клонировать
                </button>

                <button
                  onClick={() => setShowNewRepo(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Новый репозиторий
                </button>

                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  title="Настройки Git"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={loadRepositoryData}
                  disabled={isLoading}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                  title="Обновить"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Отображение ошибки */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Основное содержимое */}
      <div className="flex h-full">
        {/* Левая панель - Навигация */}
        <div className="w-64 bg-gray-50 border-r border-gray-200">
          <div className="p-4">
            {/* Информация о репозитории */}
            {currentRepository && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <RepositoryIcon className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900 text-sm">Репозиторий</span>
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="font-medium text-gray-900">{currentRepository.name}</div>
                  <div className="text-gray-600">{currentRepository.fullName}</div>
                  {currentRepository.description && (
                    <div className="text-gray-500 text-xs">{currentRepository.description}</div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-2">
                    {currentRepository.private ? (
                      <Lock className="w-3 h-3 text-gray-400" />
                    ) : (
                      <Globe className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-500">
                      {currentRepository.private ? 'Приватный' : 'Публичный'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Ветки */}
            {currentRepository && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GitBranchIcon className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900 text-sm">Ветки</span>
                  </div>
                  {!readonly && (
                    <button
                      onClick={() => setShowNewBranch(true)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Новая ветка"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {branches.map((branch: GitBranch) => (
                    <button
                      key={branch.name}
                      onClick={() => handleCheckoutBranch(branch.name)}
                      className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                        currentBranch === branch.name
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{branch.name}</span>
                        {branch.protected && (
                          <Shield className="w-3 h-3 text-yellow-600 ml-1" />
                        )}
                      </div>
                      {branch.ahead !== undefined && branch.behind !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          {branch.ahead} ahead, {branch.behind} behind
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Статус рабочей директории */}
            {status && !status.clean && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900 text-sm">Статус</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Изменений:</span>
                    <span className="text-gray-900">{status.staged + status.unstaged}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Новые файлы:</span>
                    <span className="text-gray-900">{status.untracked}</span>
                  </div>
                  {status.conflicts > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-red-600">Конфликты:</span>
                      <span className="text-red-900">{status.conflicts}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Действия */}
            {currentRepository && !readonly && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowCommitModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Коммит
                </button>

                <button
                  onClick={handlePush}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Push
                </button>

                <button
                  onClick={handlePull}
                  disabled={isLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
                >
                  <Download className="w-4 h-4" />
                  Pull
                </button>

                <button
                  onClick={() => setShowNewPR(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                >
                  <GitPullRequestIcon className="w-4 h-4" />
                  Новый PR
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Правая панель - Основной контент */}
        <div className="flex-1 bg-white">
          {currentRepository ? (
            <div className="h-full flex flex-col">
              {/* Статистика */}
              {repoStats && (
                <div className="p-6 border-b border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900">{repoStats.branchesCount}</div>
                      <div className="text-sm text-gray-600">Веток</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900">{repoStats.contributorsCount}</div>
                      <div className="text-sm text-gray-600">Участников</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900">{repoStats.commitsCount}</div>
                      <div className="text-sm text-gray-600">Коммитов</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900">{repoStats.pullRequestsCount}</div>
                      <div className="text-sm text-gray-600">Открытых PR</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-gray-900">{repoStats.size}</div>
                      <div className="text-sm text-gray-600">Размер</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-900">
                        {repoStats.lastActivity.toLocaleDateString('ru-RU')}
                      </div>
                      <div className="text-sm text-gray-600">Последняя активность</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Содержимое */}
              <div className="flex-1 overflow-y-auto p-6">
                {viewMode.active === 'overview' && (
                  <div className="space-y-6">
                    {/* Последние коммиты */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Последние коммиты</h3>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Поиск коммитов..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
                            />
                          </div>
                          <button
                            onClick={() => setViewMode(prev => ({ ...prev, active: 'commits' }))}
                            className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                          >
                            <History className="w-4 h-4" />
                            Все коммиты
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {filteredCommits.slice(0, 5).map(commit => (
                          <div key={commit.sha} className="border rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Hash className="w-4 h-4 text-gray-400" />
                                  <code className="text-sm text-gray-600 font-mono">
                                    {commit.sha.substring(0, 8)}
                                  </code>
                                </div>
                                <p className="text-gray-900 mb-2">{commit.message}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {commit.author.name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {commit.date.toLocaleDateString('ru-RU')}
                                  </span>
                                  {commit.stats && (
                                    <span className="flex items-center gap-1">
                                      <BarChart3 className="w-3 h-3" />
                                      +{commit.stats.additions}/-{commit.stats.deletions}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Измененные файлы */}
                    {status && status.files.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Измененные файлы</h3>
                        <div className="space-y-2">
                          {status.files.map((file: { path: string; index?: string | GitFileStatus; working_tree?: string | GitFileStatus }, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getFileStatusColor(normalizeFileStatus(file.index))}`}>
                                  {getFileStatusIcon(normalizeFileStatus(file.index))}
                                  {file.index || file.working_tree}
                                </div>
                                <span className="text-gray-900">{file.path}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Открытые Pull Requests */}
                    {pullRequests.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Открытые Pull Requests</h3>
                          <button
                            onClick={() => setViewMode(prev => ({ ...prev, active: 'pulls' }))}
                            className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm"
                          >
                            <GitPullRequestIcon className="w-4 h-4" />
                            Все PR
                          </button>
                        </div>

                        <div className="space-y-3">
                          {pullRequests.filter(pr => pr.state === GitPRState.OPEN).slice(0, 3).map(pr => (
                            <div key={pr.id} className="border rounded-lg p-4 hover:bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getPRStatusColor(pr.state)}`}>
                                      {pr.state}
                                    </div>
                                    <span className="text-sm text-gray-600">#{pr.number}</span>
                                  </div>
                                  <h4 className="font-medium text-gray-900 mb-1">{pr.title}</h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <GitBranchIcon className="w-3 h-3" />
                                      {pr.head.ref} → {pr.base.ref}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {pr.user.name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {pr.created_at.toLocaleDateString('ru-RU')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {viewMode.active === 'commits' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">История коммитов</h3>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Поиск коммитов..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {filteredCommits.map(commit => (
                        <div key={commit.sha} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Hash className="w-4 h-4 text-gray-400" />
                                <code className="text-sm text-gray-600 font-mono">
                                  {commit.sha.substring(0, 8)}
                                </code>
                              </div>
                              <p className="text-gray-900 mb-2">{commit.message}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {commit.author.name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {commit.date.toLocaleString('ru-RU')}
                                </span>
                                {commit.stats && (
                                  <span className="flex items-center gap-1">
                                    <BarChart3 className="w-3 h-3" />
                                    +{commit.stats.additions}/-{commit.stats.deletions}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {commit.files && commit.files.length > 0 && (
                            <div className="border-t pt-3">
                              <div className="text-sm text-gray-700 mb-2">Измененные файлы:</div>
                              <div className="space-y-1">
                                {commit.files.map((file: GitFile, index: number) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <div className={`px-1.5 py-0.5 rounded text-xs ${getFileStatusColor(normalizeGitFileStatus(file.status))}`}>
                                      {file.status}
                                    </div>
                                    <span className="text-gray-900">{file.path}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <GitBranchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Репозиторий не выбран</h3>
                <p className="text-gray-600 mb-4">Выберите существующий репозиторий или создайте новый</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setShowCloneModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4" />
                    Клонировать
                  </button>
                  <button
                    onClick={() => setShowNewRepo(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Новый репозиторий
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальные окна */}
      
      {/* Модальное окно создания репозитория */}
      {showNewRepo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Создать новый репозиторий</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название репозитория</label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="my-1c-project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  value={prDescription}
                  onChange={(e) => setPrDescription(e.target.value)}
                  placeholder="Репозиторий для разработки на 1С:Enterprise"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked={false}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Приватный репозиторий</span>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowNewRepo(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateRepository}
                disabled={!newRepoName.trim() || isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно клонирования */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Клонировать репозиторий</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL репозитория</label>
                <input
                  type="text"
                  value={cloneUrl}
                  onChange={(e) => setCloneUrl(e.target.value)}
                  placeholder="https://github.com/user/repo.git"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ветка</label>
                <input
                  type="text"
                  value={currentBranch}
                  onChange={(e) => setCurrentBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCloneModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCloneRepository}
                disabled={!cloneUrl.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Клонирование...' : 'Клонировать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания ветки */}
      {showNewBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Создать новую ветку</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название ветки</label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="feature/new-feature"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Создать от ветки</label>
                <select
                  value={baseBranch}
                  onChange={(e) => setBaseBranch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {branches.map((branch: GitBranch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowNewBranch(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно коммита */}
      {showCommitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Создать коммит</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сообщение коммита</label>
                <textarea
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Опишите изменения, которые вы внесли"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                />
              </div>
              
              {status && status.files.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Файлы для коммита</label>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                    {status.files.map((file: { path: string; index?: string | GitFileStatus; working_tree?: string | GitFileStatus }, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-2 border-b border-gray-100 last:border-b-0">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm text-gray-900">{file.path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowCommitModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCommit}
                disabled={!commitMessage.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Создание...' : 'Создать коммит'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания PR */}
      {showNewPR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Создать Pull Request</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
                <input
                  type="text"
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  placeholder="Описание изменений"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  value={prDescription}
                  onChange={(e) => setPrDescription(e.target.value)}
                  placeholder="Детальное описание изменений и их влияния"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Из ветки</label>
                  <input
                    type="text"
                    value={currentBranch}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">В ветку</label>
                  <select
                    value={baseBranch}
                    onChange={(e) => setBaseBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {branches.map((branch: GitBranch) => (
                      <option key={branch.name} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowNewPR(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={handleCreatePR}
                disabled={!prTitle.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Создание...' : 'Создать PR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitManager;