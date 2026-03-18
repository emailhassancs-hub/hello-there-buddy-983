import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <TopBar />
      <main className="ml-[54px] mt-[52px] min-h-[calc(100vh-52px)] overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
