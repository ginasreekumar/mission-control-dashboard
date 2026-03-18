import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, FileText, Database, History } from 'lucide-react';

function MemoryContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Memory</h1>
        <p className="text-muted-foreground text-sm mt-1">Agent memories and logs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">Agent Memories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Daily Logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">2.4 MB</p>
                <p className="text-sm text-muted-foreground">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          <p className="text-muted-foreground">
            Memory management interface coming soon. This will show agent memories, 
            daily logs, and long-term storage.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function MemoryPage() {
  return (
    <DashboardLayout>
      <MemoryContent />
    </DashboardLayout>
  );
}
