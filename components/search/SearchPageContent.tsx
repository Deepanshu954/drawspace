'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UniversalSearchResult } from '@/types/database';
import { formatDate } from '@/lib/utils';
import {
  Search,
  Layout,
  FileText,
  Code2,
  MessageSquare,
  Tag as TagIcon,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface SearchPageContentProps {
  initialResults: UniversalSearchResult[];
}

export function SearchPageContent({ initialResults }: SearchPageContentProps) {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<string>('all');
  const [results, setResults] = useState<UniversalSearchResult[]>(initialResults);
  const [isSearching, setIsSearching] = useState(false);

  const TAGS = ['dsa', 'system-design', 'backend', 'frontend', 'architecture', 'important'];

  useEffect(() => {
    const handleSearch = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeType}`);
        const data = await res.json();
        if (res.ok) {
          setResults(data.results || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      handleSearch();
    }, 200);

    return () => clearTimeout(timer);
  }, [query, activeType]);

  const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
    board: { label: 'Whiteboard', icon: Layout, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-400' },
    document: { label: 'Document', icon: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400' },
    snippet: { label: 'Code Snippet', icon: Code2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400' },
    message: { label: 'Chat Message', icon: MessageSquare, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400' },
    asset: { label: 'File Asset', icon: TagIcon, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400' },
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Search Bar & Title */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
          Universal Search
        </h1>
        <p className="text-sm text-zinc-500 max-w-lg mx-auto">
          Instantly search across your boards, code snippets, knowledge docs, and team chats.
        </p>

        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search keywords, e.g. binary search, graph, caching, redis..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl border border-zinc-300 bg-white pl-12 pr-4 py-3.5 text-base shadow-sm placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            autoFocus
          />
        </div>

        {/* Quick Tag filters */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs text-zinc-400 font-medium mr-1">Tags:</span>
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-800 overflow-x-auto">
        {[
          { key: 'all', label: 'All Results' },
          { key: 'board', label: 'Whiteboards' },
          { key: 'document', label: 'Documents' },
          { key: 'snippet', label: 'Code Snippets' },
          { key: 'message', label: 'Chat Messages' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveType(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors shrink-0 ${
              activeType === tab.key
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Results List */}
      <div className="space-y-3">
        {results.map((item) => {
          const config = typeConfig[item.type] || typeConfig.board;
          const Icon = config.icon;

          return (
            <Link
              key={`${item.type}-${item.id}`}
              href={item.url}
              className="group flex items-start justify-between rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xs hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800 transition-all"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 truncate">
                      {item.title}
                    </span>
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 uppercase dark:bg-zinc-800 dark:text-zinc-400">
                      {config.label}
                    </span>
                  </div>

                  {item.snippet && (
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                      {item.snippet}
                    </p>
                  )}

                  <span className="text-[10px] text-zinc-400 block pt-1">
                    Updated {formatDate(item.created_at)}
                  </span>
                </div>
              </div>

              <div className="shrink-0 p-1 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </Link>
          );
        })}

        {results.length === 0 && !isSearching && (
          <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center text-sm text-zinc-400 dark:border-zinc-800">
            No results found for &ldquo;{query}&rdquo;. Try another keyword or remove filters.
          </div>
        )}
      </div>
    </div>
  );
}
