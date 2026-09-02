'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Document } from '@/types/database';
import { CreateDocumentModal } from '@/components/documents/CreateDocumentModal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  ExternalLink,
  Clock,
  User,
} from 'lucide-react';

interface DocumentListProps {
  initialDocuments: Document[];
  currentUserId: string;
  currentUserRole?: string;
}

export function DocumentList({
  initialDocuments,
  currentUserId,
  currentUserRole,
}: DocumentListProps) {
  const { error, success } = useToast();
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleDelete = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      success('Document deleted');
    } catch (err: any) {
      error(err.message || 'Error deleting document');
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Knowledge Documents
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Lightweight technical documentation, project specs, and revision notes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>

          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Document
          </Button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDocs.map((doc) => {
          const isOwner = doc.owner_id === currentUserId;
          const isAdmin = currentUserRole === 'admin';

          return (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs transition-all hover:border-indigo-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-800"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="font-semibold text-sm text-zinc-900 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 truncate">
                      {doc.title}
                    </h3>
                  </div>

                  {(isOwner || isAdmin) && (
                    <button
                      onClick={(e) => handleDelete(doc.id, e)}
                      className="rounded p-1 text-zinc-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-all"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="mt-3 text-xs text-zinc-500 line-clamp-3 leading-relaxed">
                  {doc.content.replace(/[#*`_]/g, '').trim() || 'No content yet...'}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(doc.updated_at)}</span>
                </div>
                <span>By {isOwner ? 'You' : doc.owner?.name || 'Teammate'}</span>
              </div>
            </Link>
          );
        })}

        {filteredDocs.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center text-sm text-zinc-400 dark:border-zinc-800">
            {searchQuery ? 'No documents match your query.' : 'No knowledge documents created yet. Start by clicking "New Document"!'}
          </div>
        )}
      </div>

      <CreateDocumentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
