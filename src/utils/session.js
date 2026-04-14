export const SESSION_DURATION_MS = 5 * 60 * 1000;
export const SESSION_WARNING_MS = 60 * 1000;
export const SESSION_TOKEN_KEY = 'sessionToken';
export const SESSION_DEADLINE_KEY = 'sessionDeadlineAt';
export const SESSION_EVENT_KEY = 'sessionEvent';
export const SESSION_MESSAGE_KEY = 'sessionMessage';
export const SESSION_DEADLINE_UPDATED_EVENT = 'session-deadline-updated';

export const SESSION_EVENT_TYPES = {
    REFRESH: 'refresh',
    LOGOUT: 'logout',
    EXPIRED: 'expired',
};

export const SESSION_EXPIRED_MESSAGE = 'Session expired. Please login again.';

export const getSessionToken = () => sessionStorage.getItem(SESSION_TOKEN_KEY);

export const setSessionToken = (token) => {
    if (token) {
        sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
};

export const getStoredDeadline = () => {
    const rawValue = sessionStorage.getItem(SESSION_DEADLINE_KEY);
    if (!rawValue) {
        return null;
    }

    const deadline = Number(rawValue);
    return Number.isFinite(deadline) ? deadline : null;
};

export const setStoredDeadline = (deadlineAt) => {
    if (deadlineAt) {
        sessionStorage.setItem(SESSION_DEADLINE_KEY, String(deadlineAt));
    } else {
        sessionStorage.removeItem(SESSION_DEADLINE_KEY);
    }

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(SESSION_DEADLINE_UPDATED_EVENT, {
            detail: { deadlineAt: deadlineAt ?? null },
        }));
    }
};

export const setSessionMessage = (message) => {
    if (message) {
        sessionStorage.setItem(SESSION_MESSAGE_KEY, message);
    } else {
        sessionStorage.removeItem(SESSION_MESSAGE_KEY);
    }
};

export const consumeSessionMessage = () => {
    const message = sessionStorage.getItem(SESSION_MESSAGE_KEY);
    sessionStorage.removeItem(SESSION_MESSAGE_KEY);
    return message;
};

export const clearSessionClientState = () => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_DEADLINE_KEY);
    sessionStorage.removeItem(SESSION_EVENT_KEY);
};

export const broadcastSessionEvent = (type, payload = {}) => {
    sessionStorage.setItem(
        SESSION_EVENT_KEY,
        JSON.stringify({
            type,
            payload,
            at: Date.now(),
        }),
    );
};

export const formatSessionClock = (remainingMs) => {
    const safeMs = Math.max(0, remainingMs);
    const totalSeconds = Math.floor(safeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
