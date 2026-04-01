import { useEffect, useRef, useCallback, useState } from 'react';

const isDev = import.meta.env.DEV;

/**
 * Owns the session deadline and security callbacks.
 * UI components can render their own live countdown from deadlineAt.
 */
const useSessionTimeout = ({
    timeout = 5 * 60 * 1000,
    warnBefore = 1 * 60 * 1000,
    onWarn,
    onTimeout,
    enabled = true,
}) => {
    const warnTimeoutRef = useRef(null);
    const logoutTimeoutRef = useRef(null);
    const onWarnRef = useRef(onWarn);
    const onTimeoutRef = useRef(onTimeout);
    const [deadlineAt, setDeadlineAt] = useState(null);

    useEffect(() => {
        onWarnRef.current = onWarn;
    }, [onWarn]);

    useEffect(() => {
        onTimeoutRef.current = onTimeout;
    }, [onTimeout]);

    const clearTimers = useCallback(() => {
        clearTimeout(warnTimeoutRef.current);
        clearTimeout(logoutTimeoutRef.current);
        warnTimeoutRef.current = null;
        logoutTimeoutRef.current = null;
    }, []);

    const scheduleSession = useCallback(() => {
        clearTimers();

        const nextDeadlineAt = Date.now() + timeout;
        setDeadlineAt(nextDeadlineAt);

        const warnDelay = Math.max(0, timeout - warnBefore);
        warnTimeoutRef.current = setTimeout(() => {
            if (isDev) {
                console.debug('[session-timeout] warning threshold reached');
            }
            onWarnRef.current?.();
        }, warnDelay);

        logoutTimeoutRef.current = setTimeout(() => {
            if (isDev) {
                console.debug('[session-timeout] timeout reached, logging out');
            }
            onTimeoutRef.current?.();
        }, timeout);

        if (isDev) {
            console.debug('[session-timeout] deadlineAt:', nextDeadlineAt);
        }
    }, [clearTimers, timeout, warnBefore]);

    useEffect(() => {
        clearTimers();

        if (!enabled) {
            setDeadlineAt(null);
            return undefined;
        }

        scheduleSession();

        return () => clearTimers();
    }, [enabled, scheduleSession, clearTimers]);

    const refresh = useCallback(() => {
        if (!enabled) {
            return;
        }

        scheduleSession();
        if (isDev) {
            console.debug('[session-timeout] timer refreshed');
        }
    }, [enabled, scheduleSession]);

    return { refresh, deadlineAt };
};

export default useSessionTimeout;
