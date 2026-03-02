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
        <img src={logo} alt="Atelier Wealth logo" className="w-14 h-14 md:w-20 md:h-20 object-contain flex-shrink-0" />
      </div>
    </header>
  );
};

export default Header;
