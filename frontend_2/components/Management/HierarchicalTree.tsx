'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { CategoryNode } from './CategoryNode';
import { CreateYearModal } from './CreateYearModal';
import { useManagement } from '@/context/ManagementContext';
import { TreeExpandedState, YearFolder, CategoryTreeNode, CreateYearData } from '@/lib/types';
import { cn } from '@/lib/utils';

interface HierarchicalTreeProps {
  className?: string;
  onDocumentSelect?: (document: any) => void;
  onDocumentDelete?: (documentId: string) => Promise<boolean>;
  onUploadDocument?: (categoryId: string, year?: string) => void;
  onUploadNewVersion?: (document: any) => void;
}

export function HierarchicalTree({ 
  className, 
  onDocumentSelect, 
  onDocumentDelete,
  onUploadDocument,
  onUploadNewVersion
}: HierarchicalTreeProps) {
  const { 
    categories, 
    getDocumentsByCategory, 
    addCategory,
    addYearFolder,
    removeYearFolder,
    deleteCategory,
    syncYearFolders,
    getSyncedYearFolders,
    syncAllYearFolders
  } = useManagement();

  const [expandedState, setExpandedState] = useState<TreeExpandedState>({});
  const [showCreateYearModal, setShowCreateYearModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Transform categories into tree nodes with year folders
  const treeNodes: CategoryTreeNode[] = useMemo(() => {
    return categories.map(category => {
      const documents = getDocumentsByCategory(category.id);
      
      // Group documents by year
      const yearGroups: { [year: string]: any[] } = {};
      documents.forEach(doc => {
        // Prefer explicit year if provided, else derive from issueDate, else fallback
        const explicitYear = (doc as any).year ? String((doc as any).year) : undefined;
        const derivedYear = doc.issueDate ? new Date(doc.issueDate).getFullYear().toString() : undefined;
        const year = explicitYear || derivedYear || '2024';
        if (!yearGroups[year]) {
          yearGroups[year] = [];
        }
        yearGroups[year].push(doc);
      });

      // Include explicit year folders from category state
      const allYears = new Set([
        ...Object.keys(yearGroups),
        ...(category.yearFolders || [])
      ]);

      // Create year folders, sorted by year (descending)
      const yearFolders: YearFolder[] = Array.from(allYears)
        .map(year => ({
          year,
          documents: yearGroups[year] || [],
          documentCount: (yearGroups[year] || []).length
        }))
        .sort((a, b) => parseInt(b.year) - parseInt(a.year));

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        documentCount: documents.length,
        yearFolders,
        isExpanded: expandedState[category.id]?.isExpanded || false
      };
    });
  }, [categories, getDocumentsByCategory, expandedState]);

  const handleToggleCategory = useCallback((categoryId: string) => {
    setExpandedState(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        isExpanded: !prev[categoryId]?.isExpanded,
        years: prev[categoryId]?.years || {}
      }
    }));
  }, []);

  const handleToggleYear = useCallback((categoryId: string, year: string) => {
    setExpandedState(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        isExpanded: prev[categoryId]?.isExpanded || false,
        years: {
          ...prev[categoryId]?.years,
          [year]: !prev[categoryId]?.years?.[year]
        }
      }
    }));
  }, []);

  const handleCreateYear = useCallback(async (data: CreateYearData) => {
    console.log('Creating year folder:', data);
    addYearFolder(data.categoryId, data.year);
    setShowCreateYearModal(false);
  }, [addYearFolder]);

  const handleNewYearFolder = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    setShowCreateYearModal(true);
  }, []);

  const handleUploadDocument = useCallback((categoryId: string, year?: string) => {
    // Pass the upload request up to the parent component
    onUploadDocument?.(categoryId, year);
  }, [onUploadDocument]);

  const handleDeleteYearFolder = useCallback((categoryId: string, year: string) => {
    console.log('🗑️ Deleting year folder:', year, 'from category:', categoryId);
    removeYearFolder(categoryId, year);
  }, [removeYearFolder]);

  const handleDeleteCategory = useCallback((categoryId: string) => {
    console.log('🗑️ Deleting category:', categoryId);
    deleteCategory(categoryId);
  }, [deleteCategory]);

  const handleSyncYearFolders = useCallback(async (categoryId: string) => {
    console.log('🔄 Syncing year folders for category:', categoryId);
    try {
      const syncedYears = await syncYearFolders(categoryId);
      console.log('✅ Synced years:', syncedYears);
    } catch (error) {
      console.error('❌ Error syncing year folders:', error);
    }
  }, [syncYearFolders]);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Sync Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={async () => {
            // Sync all categories at once
            await syncAllYearFolders();
          }}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync Year Folders
        </button>
      </div>
      
      {/* Tree Nodes */}
      <div className="space-y-1">
        {treeNodes.map(node => (
          <CategoryNode
            key={node.id}
            node={node}
            isExpanded={node.isExpanded}
            yearExpandedState={expandedState[node.id]?.years || {}}
            onToggleCategory={handleToggleCategory}
            onToggleYear={handleToggleYear}
            onNewYearFolder={handleNewYearFolder}
            onUploadDocument={handleUploadDocument}
            onDocumentSelect={onDocumentSelect}
            onDocumentDelete={onDocumentDelete}
            onDeleteYearFolder={handleDeleteYearFolder}
            onUploadNewVersion={onUploadNewVersion}
            onDeleteCategory={handleDeleteCategory}
          />
        ))}
      </div>

      {/* Modals */}
      <CreateYearModal
        isOpen={showCreateYearModal}
        onClose={() => setShowCreateYearModal(false)}
        onCreate={handleCreateYear}
        categoryId={activeCategory}
        categories={categories}
      />
    </div>
  );
}