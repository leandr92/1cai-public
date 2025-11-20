import React from 'react';
import { ChevronRight, ChevronDown, FileText, Folder } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';

interface TreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  slug?: string;
  children?: TreeNode[];
}

// Mock Tree Data
const MOCK_TREE: TreeNode[] = [
  {
    id: 'root',
    name: 'Codebase',
    type: 'folder',
    children: [
      {
        id: 'src',
        name: 'src',
        type: 'folder',
        children: [
          {
            id: 'services',
            name: 'services',
            type: 'folder',
            children: [
                { id: 'wiki-service', name: 'wiki', type: 'file', slug: 'codebase-src-services-wiki' }
            ]
          },
          { id: 'main-py', name: 'main.py', type: 'file', slug: 'codebase-src-main' }
        ]
      },
      {
          id: 'docs',
          name: 'Documentation',
          type: 'folder',
          children: [
              { id: 'arch', name: 'Architecture Overview', type: 'file', slug: 'architecture-overview' },
              { id: 'start', name: 'Getting Started', type: 'file', slug: 'getting-started' }
          ]
      }
    ]
  }
];

const TreeItem = ({ node, depth = 0 }: { node: TreeNode; depth?: number }) => {
  const [isOpen, setIsOpen] = React.useState(true); // Default open for demo
  const location = useLocation();
  const isActive = node.slug && location.pathname === `/pages/${node.slug}`;

  if (node.type === 'file') {
    return (
      <Link
        to={`/pages/${node.slug}`}
        className={clsx(
          "flex items-center gap-2 py-1 pr-2 text-sm rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
          isActive ? "text-blue-600 font-medium bg-blue-50 dark:bg-blue-900/20" : "text-gray-600 dark:text-gray-400"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FileText size={14} />
        <span className="truncate">{node.name}</span>
      </Link>
    );
  }

  return (
    <div>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 py-1 pr-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Folder size={14} className="text-blue-400" />
        <span className="font-medium truncate">{node.name}</span>
      </div>
      {isOpen && node.children && (
        <div className="mt-0.5">
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const NamespaceTree = () => {
  return (
    <div className="py-2">
      <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Explorer
      </div>
      <div className="space-y-0.5">
        {MOCK_TREE.map((node) => (
          <TreeItem key={node.id} node={node} />
        ))}
      </div>
    </div>
  );
};

