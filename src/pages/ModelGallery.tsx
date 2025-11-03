import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RefreshCw, Download, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ModelViewer from "@/components/ModelViewer";

const BASE_URL = "http://localhost:8000";

interface ModelItem {
  id: string;
  generationType: string;
  status: "COMPLETED" | "PENDING" | "QUEUED";
  modelUrl?: string;
  thumbnailUrl?: string;
  prompt: string;
  creditsUsed: number;
  createdAt: string;
}

interface ModelStats {
  totalGenerations: number;
  completed: number;
  pending: number;
  queued: number;
}

type FilterStatus = "all" | "COMPLETED" | "PENDING" | "QUEUED";
type GenerationType = "TEXT_TO_3D" | "IMAGE_TO_3D" | "POST_PROCESS";

export default function ModelGallery() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [activeTab, setActiveTab] = useState<GenerationType>("TEXT_TO_3D");
  const [token, setToken] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("token");
    setToken(accessToken);
  }, []);

  const fetchData = async () => {
    if (!token) {
      toast({
        title: "No token found",
        description: "Please provide a token in the URL query parameter",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [historyRes, statsRes] = await Promise.all([
        fetch(`${BASE_URL}/model-history?limit=100&offset=0`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/model-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!historyRes.ok || !statsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const historyData = await historyRes.json();
      const statsData = await statsRes.json();

      setModels(historyData.items || []);
      setStats(statsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch model data",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const filteredModels = models.filter((model) => {
    const matchesTab = model.generationType === activeTab;
    const matchesStatus = filter === "all" ? true : model.status === filter;
    return matchesTab && matchesStatus;
  });

  const getTabStats = (genType: GenerationType) => {
    const tabModels = models.filter((m) => m.generationType === genType);
    return {
      total: tabModels.length,
      completed: tabModels.filter((m) => m.status === "COMPLETED").length,
      pending: tabModels.filter((m) => m.status === "PENDING").length,
      queued: tabModels.filter((m) => m.status === "QUEUED").length,
    };
  };

  const currentTabStats = getTabStats(activeTab);

  const handleModelClick = (model: ModelItem) => {
    if (model.status === "COMPLETED" && model.modelUrl) {
      setSelectedModel(model);
      setIsViewerOpen(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "PENDING":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      case "QUEUED":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">3D Model Gallery</h1>
        <Button onClick={fetchData} disabled={loading} size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : !loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{currentTabStats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {currentTabStats.completed}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {currentTabStats.pending}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Queued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {currentTabStats.queued}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GenerationType)} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="TEXT_TO_3D">📝 Text to 3D</TabsTrigger>
          <TabsTrigger value="IMAGE_TO_3D">🖼️ Image to 3D</TabsTrigger>
          <TabsTrigger value="POST_PROCESS">🧰 Post Processing</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "COMPLETED" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("COMPLETED")}
            >
              Completed
            </Button>
            <Button
              variant={filter === "PENDING" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("PENDING")}
            >
              Pending
            </Button>
            <Button
              variant={filter === "QUEUED" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("QUEUED")}
            >
              Queued
            </Button>
          </div>

          {/* Model Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-80 rounded-lg" />
              ))}
            </div>
          ) : filteredModels.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No models found
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredModels.map((model) => (
                <Card key={model.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div
                    className="relative aspect-square bg-muted cursor-pointer"
                    onClick={() => handleModelClick(model)}
                  >
                    {model.thumbnailUrl ? (
                      <img
                        src={model.thumbnailUrl}
                        alt={model.prompt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No thumbnail
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge className={getStatusColor(model.status)}>
                        {model.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm line-clamp-2 min-h-[2.5rem]">{model.prompt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{model.generationType}</span>
                      <span>{model.creditsUsed} credits</span>
                    </div>
                    {model.status === "COMPLETED" && model.modelUrl && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModelClick(model);
                          }}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (model.modelUrl) {
                              window.open(model.modelUrl, "_blank");
                            }
                          }}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 3D Model Viewer Dialog */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          {selectedModel && (
            <ModelViewer
              apiUrl={BASE_URL}
              selectedModel={{
                modelUrl: selectedModel.modelUrl || "",
                thumbnailUrl: selectedModel.thumbnailUrl || "",
                workflow: selectedModel.generationType.toLowerCase().replace("_", "")
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
