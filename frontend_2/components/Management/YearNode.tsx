'use client';

import React from 'react';
import { DocumentNode } from './DocumentNode';
import { YearFolder } from '@/lib/types';
import { cn } from '@/lib/utils';

interface YearNodeProps {
  categoryId: string;
  categoryName: string;
  yearFolder: YearFolder;
  isExpanded: boolean;
  onToggleYear: (categoryId: string, year: string) => void;
  onUploadDocument: (categoryId: string, year: string) => void;
  onDocumentSelect?: (document: any) => void;
  onDocumentDelete?: (documentId: string) => Promise<boolean>;
}

export function YearNode({
  categoryId,
  categoryName,
  yearFolder,
  isExpanded,
  onToggleYear,
  onUploadDocument,
  onDocumentSelect,
  onDocumentDelete
}: YearNodeProps) {
  const handleYearToggle = () => {
    onToggleYear(categoryId, yearFolder.year);
  };

  const handleUploadDocument = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUploadDocument(categoryId, yearFolder.year);
  };

  return (
    <div className="select-none">
      {/* Year Header */}
      <div
        onClick={handleYearToggle}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          isExpanded && 'bg-gray-50 dark:bg-gray-800/50'
        )}
      >
        {/* Expand/Collapse Arrow */}
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {yearFolder.documents.length > 0 && (
            <svg
              className={cn(
                'w-3 h-3 text-gray-500 transition-transform duration-150',
                isExpanded && 'transform rotate-90'
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>

        {/* Year Folder Icon */}
        <div className="flex-shrink-0 text-lg">
          📂
        </div>

        {/* Year and Document Count */}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {yearFolder.year}
          </span>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            ({yearFolder.documentCount} {yearFolder.documentCount === 1 ? 'document' : 'documents'})
          </span>
        </div>

        {/* Upload Document Button */}
        {isExpanded && (
          <button
            onClick={handleUploadDocument}
            className="flex-shrink-0 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
            title="Upload document to this year"
          >
            + Upload Document
          </button>
        )}
      </div>

      {/* Documents */}
      {isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {yearFolder.documents.length > 0 ? (
            yearFolder.documents.map((document, index) => (
              <DocumentNode
                key={document.id || `${categoryId}-${yearFolder.year}-${index}`}
                document={document}
                onSelect={onDocumentSelect}
                onDelete={onDocumentDelete}
              />
            ))
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-4 h-4" /> {/* Spacer for alignment */}
              <div className="text-lg">📄</div>
              <span>No documents in {yearFolder.year}</span>
              <button
                onClick={() => onUploadDocument(categoryId, yearFolder.year)}
                className="ml-auto px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
              >
                Upload Document
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}