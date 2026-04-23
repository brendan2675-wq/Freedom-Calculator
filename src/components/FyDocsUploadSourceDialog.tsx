import { Camera, Cloud, FileUp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type FyDocsUploadSourceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeviceUpload: () => void;
  onPhoneUpload: () => void;
  onCloudPlaceholder: (service: string) => void;
};

const sourceCardClass = "flex min-h-24 w-full items-start gap-3 rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-accent/60 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const FyDocsUploadSourceDialog = ({ open, onOpenChange, onDeviceUpload, onPhoneUpload, onCloudPlaceholder }: FyDocsUploadSourceDialogProps) => {
  const chooseSource = (action: () => void) => {
    onOpenChange(false);
    window.setTimeout(action, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Choose document source</DialogTitle>
          <DialogDescription>Select where the FY documents should be imported from.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => chooseSource(onDeviceUpload)} className={sourceCardClass}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><FileUp size={20} /></span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">Computer or device</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">Upload PDFs, images, spreadsheets or receipts from this device.</span>
            </span>
          </button>

          <button type="button" onClick={() => chooseSource(onPhoneUpload)} className={sourceCardClass}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"><Camera size={20} /></span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">Phone camera or files</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">Take a photo of a receipt or choose a bill from your phone.</span>
            </span>
          </button>

          <button type="button" onClick={() => chooseSource(() => onCloudPlaceholder("Google Drive"))} className={sourceCardClass}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Cloud size={20} /></span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">Google Drive</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">Coming soon — cloud import will be connected later.</span>
            </span>
          </button>

          <button type="button" onClick={() => chooseSource(() => onCloudPlaceholder("OneDrive"))} className={sourceCardClass}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Cloud size={20} /></span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-foreground">OneDrive</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">Coming soon — cloud import will be connected later.</span>
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FyDocsUploadSourceDialog;