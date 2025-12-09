/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { Cat, Clover, Film, Home, Search, Star, Tv } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getCustomCategories } from '@/lib/config.client';

import { useNavigationLoading } from './NavigationLoadingProvider';

interface MobileBottomNavProps {
  /**
   * 主动指定当前激活的路径。当未提供时，自动使用 usePathname() 获取的路径。
   */
  activePath?: string;
}

const MobileBottomNav = ({ activePath }: MobileBottomNavProps) => {
  const pathname = usePathname();
  const { startLoading } = useNavigationLoading();

  // 当前激活路径：优先使用传入的 activePath，否则回退到浏览器地址
  const currentActive = activePath ?? pathname;

  const [navItems, setNavItems] = useState([
    { icon: Home, label: '首页', href: '/' },
    { icon: Search, label: '搜索', href: '/search' },
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

  // 检查是否启用简洁模式 - 使用状态管理
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
  }, []);

  useEffect(() => {
    getCustomCategories().then((categories) => {
      if (categories.length > 0) {
        setNavItems((prevItems) => [
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

  const isActive = (href: string) => {
    const typeMatch = href.match(/type=([^&]+)/)?.[1];

    // 解码URL以进行正确的比较
    const decodedActive = decodeURIComponent(currentActive);
    const decodedItemHref = decodeURIComponent(href);

    return (
      decodedActive === decodedItemHref ||
      (decodedActive.startsWith('/douban') &&
        decodedActive.includes(`type=${typeMatch}`))
    );
  };

  return (
    <nav
      className='md:hidden fixed left-4 right-4 z-[600] bg-white/80 dark:bg-black/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-[2rem] shadow-2xl shadow-black/10 overflow-hidden'
      style={{
        bottom: 'calc(1rem + env(safe-area-inset-bottom))',
      }}
    >
      <ul className='flex items-center justify-around w-full h-16 px-2'>
        {navItems.map((item) => {
          const active = isActive(item.href);
          
          // 简洁模式下只显示首页和搜索，但在服务器端渲染时先不渲染
          if (!isClient) {
            return null; // 服务器端渲染时不显示任何内容，避免闪烁
          }
          
          if (simpleMode && !['/', '/search'].includes(item.href)) {
            return null;
          }

          return (
            <li
              key={item.href}
              className='flex-1 flex justify-center'
            >
              <Link
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${
                  active ? 'scale-110' : 'scale-100 opacity-70 hover:opacity-100'
                }`}
                onClick={(e) => {
                  // 如果不是当前激活的链接，则触发加载动画
                  if (!active) {
                    startLoading();
                  }
                }}
              >
                <item.icon
                  className={`h-6 w-6 transition-colors duration-300 ${active
                      ? 'text-gray-900 dark:text-white fill-gray-900/10 dark:fill-white/10'
                      : 'text-gray-500 dark:text-gray-400'
                    }`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={`text-[10px] font-medium transition-colors duration-300 ${
                    active
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
