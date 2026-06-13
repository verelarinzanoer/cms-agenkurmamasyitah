import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col h-screen">
      <Sidebar />
      <TopBar />
      <main className="md:ml-[240px] flex-1 overflow-auto bg-[#F9FAFB]">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};
