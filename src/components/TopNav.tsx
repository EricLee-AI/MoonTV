/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Cat, Clover, Film, History, Home, Search, Star, Trash2, Tv, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { getCustomCategories } from '@/lib/config.client';
import {
  addSearchHistory,
  clearSearchHistory,
  deleteSearchHistory,
  getSearchHistory,
  subscribeToDataUpdates,
} from '@/lib/db.client';

import { useNavigationLoading } from './NavigationLoadingProvider';
import SearchSuggestions from './SearchSuggestions';
import { useSite } from './SiteProvider';
import SourceSelector from './SourceSelector';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface TopNavProps {
  activePath?: string;
}

const TopNav = ({ activePath = '/' }: TopNavProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { siteName } = useSite();
  const { startLoading } = useNavigationLoading();

  const [active, setActive] = useState(activePath);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 搜索源选择器状态
  const [searchSources, setSearchSources] = useState<string[]>([]);
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  // 历史记录状态
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const historyButtonRef = useRef<HTMLButtonElement>(null);
  const historyPopupRef = useRef<HTMLDivElement>(null);

  // 滚动状态
  const [isScrolled, setIsScrolled] = useState(false);

  const handleSearch = (e: React.FormEvent | string) => {
    if (typeof e !== 'string') {
      e.preventDefault();
    }
    const query = typeof e === 'string' ? e : searchQuery;
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      // 添加到搜索历史
      addSearchHistory(trimmedQuery);
      
      // 如果不在搜索页面，触发加载动画
      if (pathname !== '/search') {
        startLoading();
      }
      
      const params = new URLSearchParams();
      params.set('q', trimmedQuery);
      if (searchSources.length > 0) {
        params.set('sources', searchSources.join(','));
      }
      router.push(`/search?${params.toString()}`);
      setShowSuggestions(false);
      setShowHistory(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(value.trim().length > 0);
    setShowHistory(false); // 输入时关闭历史记录
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setShowHistory(false); // 选择建议时关闭历史记录
    
    // 添加到搜索历史
    addSearchHistory(suggestion);
    
    // 如果不在搜索页面，触发加载动画
    if (pathname !== '/search') {
      startLoading();
    }
    
    const params = new URLSearchParams();
    params.set('q', suggestion);
    if (searchSources.length > 0) {
      params.set('sources', searchSources.join(','));
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim().length > 0) {
      setShowSuggestions(true);
    }
    setShowHistory(false); // 聚焦输入框时关闭历史记录
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleHistoryClick = (item: string) => {
    setSearchQuery(item);
    setShowHistory(false);
    
    // 添加到搜索历史（更新时间戳）
    addSearchHistory(item);
    
    // 如果不在搜索页面，触发加载动画
    if (pathname !== '/search') {
      startLoading();
    }
    
    const params = new URLSearchParams();
    params.set('q', item);
    if (searchSources.length > 0) {
      params.set('sources', searchSources.join(','));
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleDeleteHistory = async (item: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteSearchHistory(item);
  };

  const handleClearAllHistory = async () => {
    await clearSearchHistory();
    setShowHistory(false);
  };

  // 点击外部关闭历史弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showHistory &&
        historyPopupRef.current &&
        historyButtonRef.current &&
        !historyPopupRef.current.contains(event.target as Node) &&
        !historyButtonRef.current.contains(event.target as Node)
      ) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistory]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 检查是否启用简洁模式
  const [simpleMode, setSimpleMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const savedSimpleMode = localStorage.getItem('simpleMode');
      if (savedSimpleMode !== null) {
        setSimpleMode(JSON.parse(savedSimpleMode));
      }
    }

    // 加载搜索历史
    getSearchHistory().then(setSearchHistory);
    const unsubscribe = subscribeToDataUpdates('searchHistoryUpdated', setSearchHistory);
    
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (activePath) {
      setActive(activePath);
    } else {
      const queryString = searchParams.toString();
      const fullPath = queryString ? `${pathname}?${queryString}` : pathname;
      setActive(fullPath);
    }
  }, [activePath, pathname, searchParams]);

  // 同步 URL 中的搜索查询和搜索源到搜索框
  useEffect(() => {
    if (pathname === '/search') {
      const query = searchParams.get('q');
      if (query) {
        setSearchQuery(decodeURIComponent(query));
      } else {
        setSearchQuery('');
      }
      
      const sources = searchParams.get('sources');
      if (sources) {
        setSearchSources(sources.split(','));
      }
    }
  }, [pathname, searchParams]);

  const [menuItems, setMenuItems] = useState([
    {
      icon: Film,
      label: '电影',
      href: '/douban?type=movie',
    },
    {
      icon: Tv,
      label: '剧集',
      href: '/douban?type=tv',
    },
    {
      icon: Cat,
      label: '动漫',
      href: '/douban?type=anime',
    },
    {
      icon: Clover,
      label: '综艺',
      href: '/douban?type=show',
    },
  ]);

  useEffect(() => {
    getCustomCategories().then((categories) => {
      if (categories.length > 0) {
        setMenuItems((prevItems) => [
          ...prevItems,
          {
            icon: Star,
            label: '自定义',
            href: '/douban?type=custom',
          },
        ]);
      }
    });
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'glass-effect border-b border-gray-200/50 dark:border-gray-800/50 py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-12'>
          {/* Logo */}
          <div className='flex-shrink-0 flex items-center'>
            <Link
              href='/'
              className='flex items-center gap-2 group'
              onClick={() => setActive('/')}
            >
              <div className='w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300'>
                <Tv size={18} className='group-hover:scale-110 transition-transform' />
              </div>
              <span className='text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 hidden sm:block'>
                {siteName}
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className='flex-1 max-w-2xl mx-4 sm:mx-8 relative'>
            <div className={`relative group transition-all duration-300 ${showSuggestions || showHistory ? 'scale-[1.02]' : ''}`}>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Search className='h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors' />
              </div>
              <input
                ref={searchInputRef}
                type='text'
                className='block w-full pl-10 pr-20 py-2.5 border-0 rounded-2xl bg-gray-100/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 glass-button'
                placeholder='搜索影视...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery) setShowSuggestions(true);
                  else setShowHistory(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                    setShowSuggestions(false);
                    setShowHistory(false);
                  }
                }}
              />
              {/* ...existing code... */}
            </div>
          </div>

          {/* Right Actions */}
          <div className='flex items-center gap-2 sm:gap-4'>
            <Link
              href='/favorites'
              className={`p-2 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 group ${
                active === '/favorites' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
              }`}
              onClick={() => setActive('/favorites')}
            >
              <Star size={20} className='group-hover:scale-110 transition-transform' />
            </Link>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;

