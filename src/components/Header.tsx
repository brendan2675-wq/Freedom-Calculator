import { UserCircle } from "lucide-react";

const Header = () => {
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
        <button
          onClick={() => {}}
          className="text-accent hover:text-accent/80 transition-colors flex-shrink-0"
          aria-label="Profile"
        >
          <UserCircle size={44} />
        </button>
      </div>
    </header>
  );
};

export default Header;
