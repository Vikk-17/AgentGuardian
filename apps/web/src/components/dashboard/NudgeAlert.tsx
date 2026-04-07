import { useState, useEffect } from 'react';
import { useNudges } from '../../hooks/useNudges';
import { Check, X, Clock } from 'lucide-react';

export function NudgeAlert() {
  const { pendingActions, approveAction, denyAction } = useNudges();

  // Only show NUDGE tier actions (STEP_UP actions use StepUpModal)
  const nudgeActions = pendingActions.filter((action) => action.tier === 'NUDGE');

  if (!nudgeActions.length) return null;

  return (
    <div className="space-y-3">
      {nudgeActions.map((action) => (
        <NudgeCard
          key={action.id}
          action={action}
          onApprove={() => approveAction(action.id)}
          onDeny={() => denyAction(action.id)}
        />
      ))}
    </div>
  );
}

function NudgeCard({ action, onApprove, onDeny }: any) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState<'approve' | 'deny' | null>(null);

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, new Date(action.expiresAt).getTime() - Date.now());
      setTimeLeft(Math.ceil(remaining / 1000));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [action.expiresAt]);

  const handleApprove = async () => {
    setLoading('approve');
    try { await onApprove(); } catch { setLoading(null); }
  };

  const handleDeny = async () => {
    setLoading('deny');
    try { await onDeny(); } catch { setLoading(null); }
  };

  if (timeLeft <= 0) {
    return (
      <div className="card border-l-4 border-l-gray-300 p-4 opacity-50 transition-opacity duration-2000">
        <p className="text-sm text-text-muted">⏰ Expired: {action.displaySummary}</p>
      </div>
    );
  }

  return (
    <div className="nudge-card">
      <div className="flex items-start gap-4">
        {/* Pulsing indicator */}
        <div className="mt-1">
          <div className="w-3 h-3 rounded-full bg-tier-nudge animate-pulse-slow ring-4 ring-amber-100" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary mb-1">
            🤖 Agent wants to perform an action
          </p>
          <p className="text-sm text-text-primary">{action.displaySummary}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
            <Clock className="w-3 h-3" />
            <span className={`font-mono font-semibold ${timeLeft <= 10 ? 'text-red-500' : 'text-amber-600'}`}>
              {timeLeft}s remaining
            </span>
          </div>

          {/* Countdown bar */}
          <div className="mt-2 h-1 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-tier-nudge rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleApprove}
            disabled={loading !== null}
            className="btn-approve !py-1.5 !px-3 !text-xs"
          >
            {loading === 'approve' ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Approve
              </>
            )}
          </button>
          <button
            onClick={handleDeny}
            disabled={loading !== null}
            className="btn-deny !py-1.5 !px-3 !text-xs"
          >
            {loading === 'deny' ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <X className="w-3.5 h-3.5" />
                Deny
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
