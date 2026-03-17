'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Folder, 
  Search, 
  FileCode, 
  FileJson, 
  FileType,
  ChevronRight,
  ChevronDown,
  Clock,
  HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified: string;
  extension?: string;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  md: <FileText className="h-4 w-4 text-blue-400" />,
  json: <FileJson className="h-4 w-4 text-yellow-400" />,
  txt: <FileType className="h-4 w-4 text-gray-400" />,
  ts: <FileCode className="h-4 w-4 text-blue-500" />,
  tsx: <FileCode className="h-4 w-4 text-blue-500" />,
  js: <FileCode className="h-4 w-4 text-yellow-500" />,
  jsx: <FileCode className="h-4 w-4 text-yellow-500" />,
  py: <FileCode className="h-4 w-4 text-green-500" />,
  sh: <FileCode className="h-4 w-4 text-green-400" />,
  default: <FileText className="h-4 w-4 text-gray-400" />,
};

const FILE_FILTERS = {
  all: () => true,
  md: (f: FileItem) => f.extension === 'md',
  json: (f: FileItem) => f.extension === 'json',
  txt: (f: FileItem) => f.extension === 'txt',
  code: (f: FileItem) => ['ts', 'tsx', 'js', 'jsx', 'py', 'sh'].includes(f.extension || ''),
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function DocsPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<keyof typeof FILE_FILTERS>('all');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['~/WORK/GINA']));
  const [loading, setLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/docs/files');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const fetchFileContent = async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/docs/file?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      setFileContent(data.content || '');
    } catch (error) {
      console.error('Failed to fetch file content:', error);
      setFileContent('Error loading file');
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'directory') {
      const newExpanded = new Set(expandedDirs);
      if (newExpanded.has(file.path)) {
        newExpanded.delete(file.path);
      } else {
        newExpanded.add(file.path);
      }
      setExpandedDirs(newExpanded);
    } else {
      setSelectedFile(file);
      fetchFileContent(file.path);
    }
  };

  const filteredFiles = files.filter(f => {
    const matchesFilter = FILE_FILTERS[filter](f);
    const matchesSearch = searchQuery === '' || 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.path.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'directory') {
      return <Folder className="h-4 w-4 text-yellow-400" />;
    }
    return FILE_ICONS[file.extension || ''] || FILE_ICONS.default;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Docs</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HardDrive className="h-4 w-4" />
          <span>~/WORK/GINA</span>
        </div>
      </div>

      <div className="flex gap-4">
        {/* File Browser */}
        <Card className="flex-1 bg-card border-border">
          <CardHeader className="pb-3 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="md">Markdown</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-t border-border">
              {filteredFiles.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No files found
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => handleFileClick(file)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors',
                        selectedFile?.path === file.path && 'bg-primary/10'
                      )}
                    >
                      {file.type === 'directory' && (
                        <span className="text-muted-foreground">
                          {expandedDirs.has(file.path) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </span>
                      )}
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{file.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {file.path}
                        </div>
                      </div>
                      {file.size !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(file.size)}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(file.modified)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Preview */}
        <Card className="flex-1 bg-card border-border">
          <CardHeader className="pb-3">
            {selectedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getFileIcon(selectedFile)}
                  <span className="font-medium">{selectedFile.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {selectedFile.size !== undefined && (
                    <span>{formatBytes(selectedFile.size)}</span>
                  )}
                  <span>{formatDate(selectedFile.modified)}</span>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Select a file to preview</span>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Loading...
              </div>
            ) : selectedFile ? (
              <pre className="text-sm overflow-auto max-h-[600px] p-4 bg-muted rounded-lg font-mono whitespace-pre-wrap">
                {fileContent}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a file from the browser to view its contents</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
