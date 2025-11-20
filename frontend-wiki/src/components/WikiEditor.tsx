import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { WikiViewer } from './WikiViewer';
import { Save, Eye, Code, Split } from 'lucide-react';

interface WikiEditorProps {
  initialContent?: string;
  onSave: (content: string) => void;
  saving?: boolean;
}

type ViewMode = 'edit' | 'preview' | 'split';

export const WikiEditor: React.FC<WikiEditorProps> = ({ initialContent = '', onSave, saving = false }) => {
  const [content, setContent] = useState(initialContent);
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50 dark:bg-gray-950 dark:border-gray-800">
        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('edit')}
            className={`p-1.5 rounded ${viewMode === 'edit' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            title="Edit Code"
          >
            <Code size={16} />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-1.5 rounded ${viewMode === 'split' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            title="Split View"
          >
            <Split size={16} />
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`p-1.5 rounded ${viewMode === 'preview' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            title="Preview"
          >
            <Eye size={16} />
          </button>
        </div>

        <button
          onClick={() => onSave(content)}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`flex-1 border-r border-gray-200 dark:border-gray-800 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <Editor
              height="100%"
              defaultLanguage="markdown"
              value={content}
              onChange={(value) => setContent(value || '')}
              theme="vs-dark" // Dynamic theme switching can be added later
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                fontSize: 14,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`flex-1 overflow-auto bg-white dark:bg-gray-900 p-6 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
             <WikiViewer content={content} />
          </div>
        )}
      </div>
    </div>
  );
};

