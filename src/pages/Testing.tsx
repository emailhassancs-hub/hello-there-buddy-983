import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Testing() {
  const [models, setModels] = useState([]);
  const [thumbnails, setThumbnails] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const BASE_URL = "http://localhost"; // Change to your EC2/Flask server URL

  // Extract token from URL on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token") || (window as any).authToken || localStorage.getItem("auth_token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  const fetchData = async () => {
    if (!token) {
      alert("Please enter your access token.");
      return;
    }
    setLoading(true);

    try {
      const [modelsRes, thumbsRes, statsRes] = await Promise.all([
        fetch(`${BASE_URL}/models`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/thumbnails`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BASE_URL}/model-stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const modelsData = await modelsRes.json();
      const thumbsData = await thumbsRes.json();
      const statsData = await statsRes.json();

      setModels(modelsData.models || []);
      setThumbnails(thumbsData.thumbnails || []);
      setStats(statsData || {});
    } catch (err) {
      console.error(err);
      alert("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-6">
      <h1 className="text-3xl font-semibold mb-4">3D Model Dashboard</h1>

      {/* Token Input */}
      <div className="flex mb-4 gap-2">
        <Input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter Access Token"
          className="w-80"
        />
        <Button onClick={fetchData}>
          Fetch
        </Button>
      </div>

      {loading && <p className="text-muted-foreground mt-4">Loading...</p>}

      {/* Stats */}
      {stats && (
        <div className="bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm rounded-full px-8 py-6 shadow-lg border border-primary/20 mb-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Total Generations</p>
            <p className="text-4xl font-bold text-primary">{stats.totalGenerations || 0}</p>
          </div>
        </div>
      )}

      {/* Models */}
      <section className="w-full max-w-5xl">
        <h2 className="text-xl font-semibold mb-6 text-center">Completed Models</h2>
        <div className="flex flex-wrap gap-6 justify-center">
          {models.map((model: any) => (
            <div
              key={model.id}
              className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-xl border border-border/50 p-4 hover:scale-105 transition-transform duration-300 w-64"
            >
              <div className="relative rounded-2xl overflow-hidden mb-3 aspect-square">
                <img
                  src={model.thumbnailUrl}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="font-semibold text-sm mb-1">{model.name}</p>
              <p className="text-xs text-muted-foreground mb-3">{model.type}</p>
              <a
                href={model.modelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full text-xs font-medium transition-colors"
              >
                View Model
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Thumbnails */}
      <section className="w-full max-w-5xl mt-12">
        <h2 className="text-xl font-semibold mb-6 text-center">Thumbnails</h2>
        <div className="flex flex-wrap gap-4 justify-center">
          {thumbnails.map((thumb: any) => (
            <div
              key={thumb.id}
              className="bg-card/80 backdrop-blur-sm rounded-full shadow-lg border border-border/50 p-3 hover:scale-110 transition-transform duration-300 w-40 h-40 flex flex-col items-center justify-center"
            >
              <div className="relative rounded-full overflow-hidden w-28 h-28 mb-2">
                <img
                  src={thumb.path}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center truncate w-full px-2">
                {thumb.prompt}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Testing;
