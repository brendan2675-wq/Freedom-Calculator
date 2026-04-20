import { Eye } from "lucide-react";

interface ReadOnlyBannerProps {
  sharedBy?: string;
}

const ReadOnlyBanner = ({ sharedBy }: ReadOnlyBannerProps) => (
  <div className="bg-accent/10 border-b border-accent/30 text-accent px-4 py-2 text-sm flex items-center justify-center gap-2 font-medium">
    <Eye size={16} />
    Read-only view{sharedBy ? ` — shared by ${sharedBy}` : ""}
  </div>
);

export default ReadOnlyBanner;
