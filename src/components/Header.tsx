import { UserCircle, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  clientName: string;
  setClientName: (v: string) => void;
}

const Header = ({ clientName, setClientName }: HeaderProps) => {
  const navigate = useNavigate();
  return (
    <header className="bg-header text-primary-foreground">
      <div className="container mx-auto px-4 py-8 md:py-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-accent/70 hover:text-accent transition-colors"
            aria-label="Back to Dashboard"
          >
            <LayoutDashboard size={28} />
          </button>
          <div>
            <h1 className="text-3xl md:text-5xl font-bold mb-3">
              PPOR Pay Down Goal
            </h1>
            <p className="text-accent text-lg md:text-xl font-light">
              Pay off your home in 10 years, not 30
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <p className="text-accent text-sm tracking-wider mb-1">Atelier Wealth</p>
          <button
            onClick={() => {}}
            className="text-accent hover:text-accent/80 transition-colors"
            aria-label="Profile"
          >
            <UserCircle size={44} />
          </button>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="text-center text-sm text-accent bg-transparent border-b border-transparent hover:border-accent/40 focus:border-accent focus:outline-none transition-colors w-32 md:w-40"
            placeholder="Client name"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
