import { UserCircle } from "lucide-react";
import logo from "@/assets/logo.png";

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
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {}}
            className="text-accent hover:text-accent/80 transition-colors"
            aria-label="Profile"
          >
            <UserCircle size={28} />
          </button>
          <img
            src={logo}
            alt="Atelier Wealth logo"
            className="w-14 h-14 md:w-20 md:h-20 object-contain"
            style={{ filter: 'sepia(1) saturate(4) hue-rotate(-10deg) brightness(0.8)' }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
