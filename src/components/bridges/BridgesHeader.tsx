import { Link } from "react-router-dom";

export function BridgesHeader() {
  return (
    <div className="text-center mb-8">
      <Link to="/" className="inline-flex items-center justify-center gap-3 hover:opacity-80 transition-opacity">
        <img 
          src="/courtney-list-header-logo.png" 
          alt="The Bridges" 
          className="w-12 h-12 rounded-full object-cover"
        />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          THE BRIDGES
        </h1>
      </Link>
    </div>
  );
}
