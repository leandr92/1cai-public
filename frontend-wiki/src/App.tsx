import { PagesList } from './pages/PagesList';
import { PageDetail } from './pages/PageDetail';
import { PageCreate } from './pages/PageCreate';
import { Layout } from './components/Layout';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Placeholder Pages
const HomePage = () => (
  <div className="max-w-3xl mx-auto">
    <h1 className="text-3xl font-bold mb-6">Welcome to 1cAI Wiki</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-6 border rounded-lg bg-blue-50 border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">Quick Start</h3>
        <p className="text-sm text-blue-800">Learn how to use the platform and integrate with your 1C projects.</p>
      </div>
      <div className="p-6 border rounded-lg bg-purple-50 border-purple-100">
        <h3 className="font-semibold text-purple-900 mb-2">Code Explorer</h3>
        <p className="text-sm text-purple-800">Browse generated documentation for your codebase.</p>
      </div>
    </div>
  </div>
);

const CodeExplorer = () => <div>Code Explorer Component</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="pages" element={<PagesList />} />
          <Route path="pages/new" element={<PageCreate />} />
          <Route path="pages/:slug" element={<PageDetail />} />
          <Route path="code/*" element={<CodeExplorer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
