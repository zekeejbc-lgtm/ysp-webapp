import { useState } from 'react';
import { systemAPI } from '../services/api';
import { toast } from 'sonner';
import { Wrench, RefreshCw, Clock } from 'lucide-react';

interface SystemToolsProps {
  currentUser: { id: string; role: string; username?: string };
}

export default function SystemTools({ currentUser }: SystemToolsProps) {
  const [busy, setBusy] = useState(false);

  const requireAuditor = () => {
    if (!currentUser || currentUser.role !== 'Auditor') {
      toast.error('Only the Auditor can perform this action.');
      return false;
    }
    return true;
  };

  const handleRecalc = async () => {
    if (!requireAuditor()) return;
    try {
      setBusy(true);
      const res = await systemAPI.recalcAgesNow(currentUser.id);
      if (res.success) {
        toast.success(`Recalculated ages. Updated ${res.updated ?? 0} row(s).`);
      } else {
        toast.error(res.message || 'Failed to recalculate ages');
      }
    } catch (e: any) {
      toast.error(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const handleInstallTrigger = async () => {
    if (!requireAuditor()) return;
    try {
      setBusy(true);
      const res = await systemAPI.installAgeRecalcTrigger(currentUser.id);
      if (res.success) {
        toast.success(res.message || 'Installed daily trigger');
      } else {
        toast.error(res.message || 'Failed to install trigger');
      }
    } catch (e: any) {
      toast.error(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="ysp-card">
        <h3 className="text-xl font-semibold text-[#f6421f] dark:text-[#ee8724] mb-2 flex items-center gap-2">
          <Wrench size={22} />
          System Tools (Auditor)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          These tools are restricted to the Auditor account. Actions call secured backend endpoints.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRecalc}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(90deg,#f6421f,#ee8724)' }}
          >
            <RefreshCw size={18} className={busy ? 'animate-spin' : ''} />
            <span>Recalculate All Ages</span>
          </button>
          <button
            onClick={handleInstallTrigger}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white shadow-md hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Clock size={18} />
            <span>Install Daily Trigger</span>
          </button>
        </div>
      </div>

      <div className="ysp-card">
        <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">Notes</h4>
        <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>Ages are computed from Date of Birth (Column E) and written to Column F.</li>
          <li>Trigger runs daily at 00:05 Asia/Manila.</li>
          <li>If dates don’t parse, check that Column E contains real dates (Format → Number → Date).</li>
        </ul>
      </div>
    </div>
  );
}
