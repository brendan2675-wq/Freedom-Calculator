import { UserCircle } from "lucide-react";

interface HeaderProps {
  clientName: string;
  setClientName: (v: string) => void;
}

const Header = ({ clientName, setClientName }: HeaderProps) => {
  return (
    <header className="bg-header text-primary-foreground">
      <div className="container mx-auto px-4 py-8 md:py-12 flex items-start justify-between">
        <div>
          <p className="text-accent text-lg tracking-wider mb-4">Atelier Wealth</p>
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            PPOR Pay Down Goal
          </h1>
          <p className="text-accent text-lg md:text-xl font-light">
            Pay off your home in 10 years, not 30
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
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
