import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getStoredDeadline,
    setStoredDeadline,
    SESSION_DEADLINE_KEY,
    SESSION_DEADLINE_UPDATED_EVENT,
    SESSION_EVENT_KEY,
    SESSION_EVENT_TYPES,
} from '../utils/session';

const useSessionTimeout = ({
    timeout = 5 * 60 * 1000,
    warnBefore = 60 * 1000,
    onWarn,
    onTimeout,
    enabled = true,
}) => {
    const [deadlineAt, setDeadlineAt] = useState(() => getStoredDeadline());
    const warnTimeoutRef = useRef(null);
    const logoutTimeoutRef = useRef(null);
    const warningShownRef = useRef(false);
    const onWarnRef = useRef(onWarn);
    const onTimeoutRef = useRef(onTimeout);

    useEffect(() => {
        onWarnRef.current = onWarn;
    }, [onWarn]);

    useEffect(() => {
        onTimeoutRef.current = onTimeout;
    }, [onTimeout]);

    const clearTimers = useCallback(() => {
        window.clearTimeout(warnTimeoutRef.current);
        window.clearTimeout(logoutTimeoutRef.current);
        warnTimeoutRef.current = null;
        logoutTimeoutRef.current = null;
    }, []);

    const applyDeadline = useCallback((nextDeadlineAt) => {
        setDeadlineAt(nextDeadlineAt);
        setStoredDeadline(nextDeadlineAt);
        warningShownRef.current = false;
    }, []);

    const refresh = useCallback(async ({
        nextDeadlineAt,
    } = {}) => {
        if (!enabled) {
            return null;
        }

        const resolvedDeadline = nextDeadlineAt ?? Date.now() + timeout;
        applyDeadline(resolvedDeadline);
        return resolvedDeadline;
    }, [applyDeadline, enabled, timeout]);

    useEffect(() => {
        clearTimers();

        if (!enabled || !deadlineAt) {
            warningShownRef.current = false;
            return undefined;
        }

        const remainingMs = Math.max(0, deadlineAt - Date.now());
        const warnDelay = Math.max(0, remainingMs - warnBefore);

        if (remainingMs <= warnBefore && !warningShownRef.current) {
            warningShownRef.current = true;
            onWarnRef.current?.();
        } else if (remainingMs > warnBefore) {
            warnTimeoutRef.current = window.setTimeout(() => {
                warningShownRef.current = true;
                onWarnRef.current?.();
            }, warnDelay);
        }

        logoutTimeoutRef.current = window.setTimeout(() => {
            applyDeadline(Date.now());
            onTimeoutRef.current?.();
        }, remainingMs);

        return () => clearTimers();
    }, [applyDeadline, clearTimers, deadlineAt, enabled, warnBefore]);

    useEffect(() => {
        if (!enabled) {
            clearTimers();
            setDeadlineAt(null);
            setStoredDeadline(null);
            return undefined;
        }

        const storedDeadline = getStoredDeadline();
        if (storedDeadline && storedDeadline > Date.now()) {
            setDeadlineAt(storedDeadline);
            return undefined;
        }

        if (!storedDeadline) {
            const initialDeadline = Date.now() + timeout;
            setDeadlineAt(initialDeadline);
            setStoredDeadline(initialDeadline);
        }

        return undefined;
    }, [clearTimers, enabled, refresh]);

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        const syncDeadline = () => {
            setDeadlineAt(getStoredDeadline());
        };

        const handleStorage = (event) => {
            if (event.key === SESSION_DEADLINE_KEY) {
                syncDeadline();
            }

            if (event.key === SESSION_EVENT_KEY && event.newValue) {
                try {
                    const parsed = JSON.parse(event.newValue);
                    if (parsed?.type === SESSION_EVENT_TYPES.LOGOUT || parsed?.type === SESSION_EVENT_TYPES.EXPIRED) {
                        setDeadlineAt(null);
                        setStoredDeadline(null);
                    }
                } catch {
                    // Ignore malformed sync payloads.
                }
            }
        };

        window.addEventListener(SESSION_DEADLINE_UPDATED_EVENT, syncDeadline);
        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener(SESSION_DEADLINE_UPDATED_EVENT, syncDeadline);
            window.removeEventListener('storage', handleStorage);
        };
    }, [enabled]);

    return { deadlineAt, refresh };
};

export default useSessionTimeout;
