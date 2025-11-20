import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WikiEditor } from '../components/WikiEditor';
import { WikiApi } from '../api';
import { ArrowLeft } from 'lucide-react';

export const PageCreate = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  // Simple slug generator
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleSave = async (content: string) => {
    if (!title || !slug) return alert('Title and Slug are required');
    
    try {
      setSaving(true);
      await WikiApi.createPage({
        title,
        slug,
        content,
        namespace: 'default' // TODO: Select namespace
      });
      navigate(`/pages/${slug}`);
    } catch (error) {
      console.error('Failed to create page', error);
      alert('Failed to create page');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Page Title"
            className="w-full text-2xl font-bold bg-transparent border-none focus:ring-0 placeholder-gray-400 dark:text-white"
            autoFocus
          />
          <div className="flex items-center text-sm text-gray-500 ml-1">
            <span className="mr-2">Slug:</span>
            <input 
                type="text" 
                value={slug} 
                onChange={(e) => setSlug(e.target.value)}
                className="bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none text-gray-600 dark:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="flex-1">
        <WikiEditor 
          onSave={handleSave} 
          saving={saving} 
          initialContent="# New Page\n\nStart writing here..."
        />
      </div>
    </div>
  );
};

