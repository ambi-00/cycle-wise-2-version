import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMTTrade, MTTradeEnrichment } from '@/hooks/use-mt-trade';

interface MTTradeEnrichmentDialogProps {
  tradeId: string;
  symbol: string;
  openTime: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function MTTradeEnrichmentDialog({
  tradeId,
  symbol,
  openTime,
  isOpen,
  onClose,
  onSuccess,
}: MTTradeEnrichmentDialogProps) {
  const { enrichMTTrade, uploadScreenshot, isUpdating } = useMTTrade();
  const [formData, setFormData] = useState<MTTradeEnrichment>({
    entry_reason: '',
    rrr: undefined,
    position_size: undefined,
  });
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let screenshotUrl: string | undefined;

      // Upload screenshot if provided
      if (screenshot) {
        const url = await uploadScreenshot(screenshot, tradeId);
        if (!url) {
          setIsUploading(false);
          return;
        }
        screenshotUrl = url;
      }

      // Enrich trade
      const success = await enrichMTTrade(tradeId, {
        ...formData,
        screenshot_url: screenshotUrl,
      });

      if (success) {
        onClose();
        onSuccess?.();
        // Reset form
        setFormData({
          entry_reason: '',
          rrr: undefined,
          position_size: undefined,
        });
        setScreenshot(null);
        setScreenshotPreview(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background border border-border rounded-lg shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold">Enrich MT Trade</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {symbol} · {new Date(openTime).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={isUpdating || isUploading}
                className="p-1 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Entry Reason */}
              <div className="space-y-2">
                <Label htmlFor="entry_reason">Entry Reason</Label>
                <Textarea
                  id="entry_reason"
                  placeholder="e.g., Breakout after consolidation, support bounce, etc."
                  value={formData.entry_reason || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, entry_reason: e.target.value })
                  }
                  className="min-h-20"
                />
              </div>

              {/* RRR */}
              <div className="space-y-2">
                <Label htmlFor="rrr">Risk Reward Ratio (e.g., 1.5)</Label>
                <Input
                  id="rrr"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="1.5"
                  value={formData.rrr || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rrr: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>

              {/* Position Size */}
              <div className="space-y-2">
                <Label htmlFor="position_size">Position Size (Lots)</Label>
                <Input
                  id="position_size"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.1"
                  value={formData.position_size || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      position_size: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-2">
                <Label>Screenshot (Entry point)</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden"
                    id="screenshot"
                  />
                  <label
                    htmlFor="screenshot"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    {screenshotPreview ? (
                      <img
                        src={screenshotPreview}
                        alt="Screenshot preview"
                        className="h-32 w-full object-cover rounded"
                      />
                    ) : (
                      <>
                        <FileImage className="h-5 w-5 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm font-medium">Drop image or click</p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isUpdating || isUploading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating || isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
