import { useState } from "react";
import { Search, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import SidebarLayout from "@/components/layout/SidebarLayout";
import ProjectCard from "@/components/home/ProjectCard";

const allProjects = [
  { title: "Dark Fantasy Pack", lastModified: "2h ago", assetCount: 12, assetType: "IMG" as const, gradientFrom: "from-muted", gradientTo: "to-accent" },
  { title: "Sci-fi Props", lastModified: "1d ago", assetCount: 8, assetType: "3D" as const, gradientFrom: "from-accent", gradientTo: "to-muted" },
  { title: "Stone Textures", lastModified: "3d ago", assetCount: 24, assetType: "TEX" as const, gradientFrom: "from-muted", gradientTo: "to-background" },
  { title: "Character Concepts", lastModified: "1w ago", assetCount: 5, assetType: "IMG" as const, gradientFrom: "from-accent", gradientTo: "to-muted" },
];

const sharedProjects = [
  {
    title: "Team Environment",
    lastModified: "5h ago",
    assetCount: 6,
    assetType: "IMG" as const,
    sharerName: "Alex",
    sharerInitials: "AK",
    permission: "EDIT" as const,
    gradientFrom: "from-accent",
    gradientTo: "to-muted",
  },
];

const filterTabs = ["All", "My Projects", "Shared with Me"] as const;
type FilterTab = (typeof filterTabs)[number];

const Projects = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("All");

  const sourceProjects = filter === "Shared with Me" ? sharedProjects : allProjects;

  const filtered = sourceProjects.filter((p) => {
    return p.title.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <SidebarLayout>
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-5">All Projects</h1>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="pl-9"
          />
        </div>

        {/* Filters row */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  filter === tab
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filtered.map((p, i) => (
              <ProjectCard key={i} {...p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No projects found matching your search.
            </p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default Projects;
