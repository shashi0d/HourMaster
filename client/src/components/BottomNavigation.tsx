import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: "fas fa-home", path: "/" },
  { id: "planning", label: "Planning", icon: "fas fa-calendar-alt", path: "/planning" },
  { id: "entry", label: "Log Hours", icon: "fas fa-plus-circle", path: "/entry" },
  { id: "analytics", label: "Analytics", icon: "fas fa-chart-bar", path: "/analytics" },
];

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const getActiveNavId = () => {
    const currentPath = location;
    const activeItem = navItems.find(item => item.path === currentPath);
    return activeItem?.id || "dashboard";
  };

  const activeNavId = getActiveNavId();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-secondary border-t border-dark-tertiary px-4 py-2 glass-effect z-50">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setLocation(item.path)}
            className={cn(
              "nav-item flex flex-col items-center py-2 px-3 transition-colors",
              activeNavId === item.id
                ? "active text-study-blue"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <i className={`${item.icon} text-lg mb-1`}></i>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
