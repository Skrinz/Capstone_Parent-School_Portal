import { CheckCircle2, Minus, Plus, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import type { ImportSummaryData } from '@/lib/importSummary';

interface ImportResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ImportSummaryData | null;
}

const summaryItems = (summary: ImportSummaryData) => [
  {
    label: `${summary.replaced} record${summary.replaced === 1 ? '' : 's'} replaced`,
    value: summary.replaced,
    icon: RefreshCw,
    className: 'text-emerald-500',
  },
  {
    label: `${summary.added} record${summary.added === 1 ? '' : 's'} added`,
    value: summary.added,
    icon: Plus,
    className: 'text-emerald-500',
  },
  {
    label: `${summary.unchanged} record${summary.unchanged === 1 ? '' : 's'} unchanged`,
    value: summary.unchanged,
    icon: Minus,
    className: 'text-gray-500',
  },
  {
    label: `${summary.failed} record${summary.failed === 1 ? '' : 's'} failed`,
    value: summary.failed,
    icon: XCircle,
    className: 'text-red-500',
  },
];

export const ImportResultModal = ({
  isOpen,
  onClose,
  summary,
}: ImportResultModalProps) => {
  if (!summary) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[540px] border border-gray-200 bg-white p-0" showCloseButton={false}>
        <div className="px-8 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <h2 className="text-[2rem] leading-none font-bold text-gray-900">Import Completed</h2>
          </div>

          <div className="mt-7 grid gap-8 md:grid-cols-[1fr_1fr]">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Summary</h3>
              <div className="mt-4 space-y-3">
                {summaryItems(summary).map(({ label, icon: Icon, className }) => (
                  <div key={label} className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 shrink-0 ${className}`} />
                    <p className={`text-[1.05rem] ${className}`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-gray-900">Failed Records</h3>
              <div className="mt-4 max-h-56 space-y-4 overflow-y-auto pr-1">
                {summary.failures.length > 0 ? (
                  summary.failures.map((failure, index) => (
                    <div key={`${failure.input}-${index}`} className="text-[1.05rem] leading-8 text-gray-900">
                      <p>{failure.input}</p>
                      <p>&ndash; {failure.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-[1.05rem] text-gray-500">No failed records.</p>
                )}
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-[1.9rem] font-bold text-gray-900">
            Total processed: {summary.totalProcessed}
          </p>

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={onClose}
              className="h-14 rounded-xl bg-[#58af7b] px-10 text-2xl font-semibold text-white hover:bg-[#4ca16f]"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
