import { useState } from "react";
import { Bell, ChevronDown, Sparkles, Zap, LogOut, Settings, CreditCard, Key, HelpCircle, Newspaper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationMenu from "@/components/home/NotificationMenu";
import { LocalStorageKeys } from "@/enums/localstorage";

const TopBar = () => {
  const navigate = useNavigate();
  const [scopeOpen, setScopeOpen] = useState(false);
  const [scope, setScope] = useState<"my" | "team">("my");
  const [assistActive, setAssistActive] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const userStr = localStorage.getItem(LocalStorageKeys.User);
  const user = userStr ? JSON.parse(userStr) : null;

  const handleSignOut = () => {
    localStorage.removeItem(LocalStorageKeys.AccessToken);
    localStorage.removeItem(LocalStorageKeys.User);
    localStorage.removeItem("dev_bypass_auth");
    window.location.href = "/";
  };

  return (
    <header className="fixed top-0 left-[54px] right-0 h-[52px] bg-background border-b border-border z-40 flex items-center justify-between px-4">
      {/* Left group */}
      <div className="flex items-center gap-3">
        <span className="font-bold text-sm text-foreground">Rapid Assets</span>

        {/* Scope switcher */}
        <div className="relative">
          <button
            onClick={() => setScopeOpen(!scopeOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            {scope === "my" ? "My Creations" : "All team creations"}
            <ChevronDown className="w-3 h-3" />
          </button>
          {scopeOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setScopeOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-48 bg-popover border border-border rounded-xl shadow-xl z-50 py-1">
                <button
                  onClick={() => { setScope("my"); setScopeOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${scope === "my" ? "text-primary" : "text-foreground"}`}
                >
                  {scope === "my" && "✓ "}My Creations
                </button>
                <button
                  onClick={() => { setScope("team"); setScopeOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors ${scope === "team" ? "text-primary" : "text-foreground"}`}
                >
                  {scope === "team" && "✓ "}All team creations
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center tabs */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setAssistActive(false)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !assistActive
              ? "text-foreground border border-border"
              : "text-muted-foreground"
          }`}
        >
          Default
        </button>
        <button
          onClick={() => setAssistActive(!assistActive)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${
            assistActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          Assist
        </button>
      </div>

      {/* Right group */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate("/pricing")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Zap className="w-3 h-3" />
          Upgrade
        </button>

        <NotificationMenu />
        <ThemeToggle />

        {/* Avatar */}
        <div className="relative">
          <button
            onClick={() => setAvatarOpen(!avatarOpen)}
            className="w-7 h-7 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center hover:bg-primary/30 transition-colors"
          >
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
          </button>

          {avatarOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl z-50 py-2">
                {/* User info */}
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-foreground truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
                  <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary">Free</span>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-white/5 transition-colors">
                    <Settings className="w-3.5 h-3.5" /> Profile & Settings
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-white/5 transition-colors">
                    <CreditCard className="w-3.5 h-3.5" /> Billing & Credits
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-white/5 transition-colors">
                    <Key className="w-3.5 h-3.5" /> API Keys
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-white/5 transition-colors">
                    <HelpCircle className="w-3.5 h-3.5" /> Help Center
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-white/5 transition-colors">
                    <Newspaper className="w-3.5 h-3.5" /> What's New
                  </button>
                </div>

                <div className="border-t border-border pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-white/5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
