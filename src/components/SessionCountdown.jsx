import React from 'react';
import { formatSessionClock } from '../utils/session';

const SessionCountdown = ({ deadlineAt, fallbackMs = 0, className = '' }) => {
    const [now, setNow] = React.useState(() => Date.now());

    React.useEffect(() => {
        setNow(Date.now());

        const intervalId = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [deadlineAt]);

    const remainingMs = Math.max(0, deadlineAt ? deadlineAt - now : fallbackMs);

    return (
        <span className={className}>
            {formatSessionClock(remainingMs)}
        </span>
    );
};

export default SessionCountdown;
