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
        <Card className="w-full max-w-2xl mb-6">
          <CardHeader>
            <CardTitle>Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Total Generations: {stats.totalGenerations || 0}</p>
          </CardContent>
        </Card>
      )}

      {/* Models */}
      <section className="w-full max-w-5xl">
        <h2 className="text-xl font-semibold mb-3">Completed Models</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {models.map((model: any) => (
            <Card key={model.id} className="flex flex-col">
              <CardContent className="p-3">
                <img
                  src={model.thumbnailUrl}
                  alt="Thumbnail"
                  className="rounded-lg h-40 object-cover mb-2 w-full"
                />
                <p className="font-semibold text-sm">{model.name}</p>
                <p className="text-xs text-muted-foreground">{model.type}</p>
                <a
                  href={model.modelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-sm mt-2 inline-block hover:underline"
                >
                  View Model
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Thumbnails */}
      <section className="w-full max-w-5xl mt-10">
        <h2 className="text-xl font-semibold mb-3">Thumbnails</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {thumbnails.map((thumb: any) => (
            <Card key={thumb.id} className="flex flex-col items-center">
              <CardContent className="p-2">
                <img
                  src={thumb.path}
                  alt="Thumbnail"
                  className="rounded-lg h-32 object-cover"
                />
                <p className="text-xs text-muted-foreground mt-1 text-center truncate w-full">
                  {thumb.prompt}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Testing;
