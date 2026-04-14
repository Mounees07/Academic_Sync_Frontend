import React from 'react';
import { formatSessionClock } from '../utils/session';

const SessionCountdown = ({ deadlineAt, fallbackMs = 0, className = '' }) => {
    const [now, setNow] = React.useState(() => Date.now());
    const [fallbackDeadlineAt, setFallbackDeadlineAt] = React.useState(() => (
        deadlineAt ?? (fallbackMs > 0 ? Date.now() + fallbackMs : null)
    ));

    React.useEffect(() => {
        setNow(Date.now());

        const intervalId = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [deadlineAt]);

    React.useEffect(() => {
        if (deadlineAt) {
            setFallbackDeadlineAt(deadlineAt);
            return;
        }

        setFallbackDeadlineAt(fallbackMs > 0 ? Date.now() + fallbackMs : null);
    }, [deadlineAt, fallbackMs]);

    const effectiveDeadlineAt = deadlineAt ?? fallbackDeadlineAt;
    const remainingMs = Math.max(0, effectiveDeadlineAt ? effectiveDeadlineAt - now : 0);

    return (
        <span className={className}>
            {formatSessionClock(remainingMs)}
        </span>
    );
};

export default SessionCountdown;
