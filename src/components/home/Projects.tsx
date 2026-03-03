import { useState, useEffect } from "react";
import { Search, FolderOpen } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import SidebarLayout from "@/components/home/SidebarLayout";
import ProjectCard from "@/components/home/ProjectCard";
import { useProjects } from "@/hooks/use-projects";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

function getInitials(name?: string, email?: string) {
  const source = name || email || "";
  if (!source) return "";
  const [first, second] = source.split(" ");
  if (first && second) {
    return `${first[0]}${second[0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

const filterTabs = ["All", "My Projects", "Shared with Me"] as const;
type FilterTab = (typeof filterTabs)[number];

const Projects = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: userProfile } = useUserProfile();

  // Determine initial filter from URL query param
  const urlFilter = searchParams.get("filter");
  const initialFilter: FilterTab =
    urlFilter === "shared" ? "Shared with Me" : "All";
  const [filter, setFilter] = useState<FilterTab>(initialFilter);

  // Update filter when URL changes
  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    if (urlFilter === "shared") {
      setFilter("Shared with Me");
    } else {
      setFilter("All");
    }
  }, [searchParams]);

  // Debounce search input before hitting the backend
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 2000);
    return () => clearTimeout(handle);
  }, [search]);

  // Fetch projects based on filter
  const {
    data: myProjectsData = [],
    isLoading: isLoadingMy,
    isError: isErrorMy,
  } = useProjects({
    type: "my",
    search: debouncedSearch,
    enabled: filter === "All" || filter === "My Projects",
  });

  const {
    data: sharedProjectsData = [],
    isLoading: isLoadingShared,
    isError: isErrorShared,
  } = useProjects({
    type: "shared",
    search: debouncedSearch,
    enabled: filter === "All" || filter === "Shared with Me",
  });

  const {
    data: allProjectsData = [],
    isLoading: isLoadingAll,
    isError: isErrorAll,
  } = useProjects({
    search: debouncedSearch,
    enabled: filter === "All",
  });

  // Determine which data to use based on filter
  let projectsData: typeof allProjectsData = [];
  let isLoading = false;
  let isError = false;

  if (filter === "My Projects") {
    projectsData = myProjectsData;
    isLoading = isLoadingMy;
    isError = isErrorMy;
  } else if (filter === "Shared with Me") {
    projectsData = sharedProjectsData;
    isLoading = isLoadingShared;
    isError = isErrorShared;
  } else {
    // "All" - use the allProjectsData (which includes both my and shared)
    projectsData = allProjectsData;
    isLoading = isLoadingAll;
    isError = isErrorAll;
  }

  const handleFilterChange = (newFilter: FilterTab) => {
    setFilter(newFilter);
    // Update URL query param
    if (newFilter === "Shared with Me") {
      setSearchParams({ filter: "shared" });
    } else {
      setSearchParams({});
    }
  };

  const currentUserId = userProfile?.id;

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
                onClick={() => handleFilterChange(tab)}
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
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-[180px] rounded-lg border border-border bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        )}
        {!isLoading && !isError && projectsData.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {/* {filter === "My Projects" && <ProjectCard isNew />} */}
            {projectsData.map((p) => {
              const isMyProject = p.creatorId === currentUserId;
              return (
                <ProjectCard
                  key={p.id}
                  id={p.id}
                  title={p.name}
                  lastModified={formatDistanceToNow(new Date(p.updatedAt), {
                    addSuffix: true,
                  })}
                  assetCount={0}
                  assetType="IMG"
                  sharerName={
                    filter === "Shared with Me" || filter === "All"
                      ? p.creator?.name
                      : undefined
                  }
                  sharerInitials={
                    filter === "Shared with Me" || filter === "All"
                      ? getInitials(p.creator?.name, p.creator?.email)
                      : undefined
                  }
                  permission={
                    filter === "Shared with Me" || (filter === "All" && !isMyProject)
                      ? "VIEW"
                      : undefined
                  }
                  canDelete={isMyProject}
                  canEdit={isMyProject}
                  onDeleted={() => {
                    queryClient.invalidateQueries({ queryKey: ["projects", "my"] });
                    queryClient.invalidateQueries({
                      queryKey: ["projects", "shared"],
                    });
                    queryClient.invalidateQueries({ queryKey: ["projects"] });
                  }}
                  onUpdated={() => {
                    queryClient.invalidateQueries({ queryKey: ["projects", "my"] });
                    queryClient.invalidateQueries({
                      queryKey: ["projects", "shared"],
                    });
                    queryClient.invalidateQueries({ queryKey: ["projects"] });
                  }}
                />
              );
            })}
          </div>
        )}
        {!isLoading && !isError && projectsData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === "My Projects"
                ? "No projects yet. Start creating!"
                : filter === "Shared with Me"
                  ? "Nothing shared with you yet."
                  : "No projects found matching your search."}
            </p>
          </div>
        )}
        {isError && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Failed to load projects. Please try again.
            </p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};
export default Projects;