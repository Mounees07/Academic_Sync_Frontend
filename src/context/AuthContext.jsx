import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    googleProvider,
    auth,
    authPersistenceReady,
    sendPasswordResetEmail,
} from '../firebase/firebase';
import api from '../utils/api';
import {
    SESSION_EVENT_TYPES,
    SESSION_EXPIRED_MESSAGE,
    broadcastSessionEvent,
    clearSessionClientState,
    getSessionToken,
    setSessionMessage,
    setSessionToken,
    setStoredDeadline,
} from '../utils/session';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sessionConflict, setSessionConflict] = useState(false);

    const applySession = useCallback((sessionPayload = {}) => {
        setSessionToken(sessionPayload.sessionToken || null);
        setStoredDeadline(sessionPayload.expiresAt ? new Date(sessionPayload.expiresAt).getTime() : null);
    }, []);

    const registerSession = useCallback(async () => {
        const res = await api.post('/users/session/register', null, {
            skipSessionActivity: true,
        });
        applySession(res.data);
        return res.data;
    }, [applySession]);

    const restoreSession = useCallback(async () => {
        const res = await api.get('/users/session/check', {
            skipSessionActivity: true,
        });
        applySession(res.data);
        return res.data;
    }, [applySession]);

    const refreshSession = useCallback(async () => {
        if (!getSessionToken()) {
            return null;
        }

        const res = await api.post('/users/session/refresh', null, {
            skipSessionActivity: true,
        });
        applySession(res.data);
        broadcastSessionEvent(SESSION_EVENT_TYPES.REFRESH, {
            expiresAt: res.data?.expiresAt || null,
        });
        return res.data;
    }, [applySession]);

    const loginWithGoogle = async () => {
        setError('');
        try {
            await authPersistenceReady;
            return await signInWithPopup(auth, googleProvider);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const loginWithEmail = async (email, password) => {
        setError('');
        try {
            await authPersistenceReady;
            return await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const signupWithEmail = async (email, password, fullName, role = 'STUDENT') => {
        setError('');
        try {
            await authPersistenceReady;
            let userCredential;
            try {
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } catch (createError) {
                if (createError.code === 'auth/email-already-in-use') {
                    userCredential = await signInWithEmailAndPassword(auth, email, password);
                } else {
                    throw createError;
                }
            }

            const token = await userCredential.user.getIdToken();
            const regData = {
                firebaseUid: userCredential.user.uid,
                email,
                fullName,
                role,
            };

            const response = await api.post('/users/register', regData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                skipSessionActivity: true,
            });

            setUserData(response.data);
            await registerSession();
            return userCredential;
        } catch (err) {
            console.error('Signup Error:', err);
            setError(err.message);
            throw err;
        }
    };

    const logout = useCallback(async ({
        reason,
        broadcastType = SESSION_EVENT_TYPES.LOGOUT,
    } = {}) => {
        setError('');
        setSessionConflict(false);

        try {
            if (getSessionToken()) {
                await api.post('/users/session/logout', null, {
                    skipSessionActivity: true,
                });
            }
        } catch (err) {
            console.warn('Backend session logout failed:', err.message);
        } finally {
            clearSessionClientState();

            if (reason) {
                setSessionMessage(reason);
            }

            broadcastSessionEvent(broadcastType, { reason });
            await signOut(auth);
        }
    }, []);

    useEffect(() => {
        let unsubscribe = () => {};
        let active = true;

        const setupAuthListener = async () => {
            await authPersistenceReady;
            if (!active) {
                return;
            }

            unsubscribe = onAuthStateChanged(auth, async (user) => {
                setCurrentUser(user);

                if (user) {
                    const hadStoredSession = Boolean(getSessionToken());
                    try {
                        if (hadStoredSession) {
                            await restoreSession();
                        } else {
                            await registerSession();
                        }

                        const response = await api.get(`/users/${user.uid}`, {
                            skipSessionActivity: true,
                        });
                        setUserData(response.data);
                    } catch (err) {
                        console.error('Auth state user load error:', err);

                        if (hadStoredSession) {
                            clearSessionClientState();
                            await signOut(auth);
                        } else if (user.providerData[0]?.providerId === 'google.com') {
                            try {
                                const regRes = await api.post('/users/register', {
                                    firebaseUid: user.uid,
                                    email: user.email,
                                    fullName: user.displayName,
                                    profilePictureUrl: user.photoURL,
                                    role: 'STUDENT',
                                }, {
                                    skipSessionActivity: true,
                                });
                                setUserData(regRes.data);
                                await registerSession();
                            } catch (regErr) {
                                console.error('Google auto-registration failed', regErr);
                                clearSessionClientState();
                                await signOut(auth);
                            }
                        } else {
                            clearSessionClientState();
                            await signOut(auth);
                        }
                    }
                } else {
                    setUserData(null);
                    clearSessionClientState();
                }

                setLoading(false);
            });
        };

        setupAuthListener();

        return () => {
            active = false;
            unsubscribe();
        };
    }, [registerSession, restoreSession]);

    useEffect(() => {
        const handleConflict = () => {
            setSessionConflict(true);
            clearSessionClientState();
            signOut(auth);
        };

        window.addEventListener('session-conflict', handleConflict);
        return () => window.removeEventListener('session-conflict', handleConflict);
    }, []);

    useEffect(() => {
        const handleExpired = async () => {
            await logout({
                reason: SESSION_EXPIRED_MESSAGE,
                broadcastType: SESSION_EVENT_TYPES.EXPIRED,
            });
        };

        window.addEventListener('session-expired', handleExpired);
        return () => window.removeEventListener('session-expired', handleExpired);
    }, [logout]);

    const resetPassword = (email) => sendPasswordResetEmail(auth, email);

    const [systemSettings, setSystemSettings] = useState({});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/settings/public/features', {
                    skipSessionActivity: true,
                });
                setSystemSettings(res.data);
            } catch (err) {
                console.error('Failed to fetch system settings', err);
                setSystemSettings({
                    'feature.leave.enabled': 'true',
                    'feature.result.enabled': 'true',
                    'feature.analytics.enabled': 'true',
                    'feature.messaging.enabled': 'true',
                });
            }
        };

        fetchSettings();
    }, []);

    const value = {
        currentUser,
        userData,
        loading,
        error,
        sessionConflict,
        systemSettings,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        resetPassword,
        refreshSession,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
            {sessionConflict && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 99999,
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        background: '#1e1b2e',
                        border: '1px solid rgba(239,68,68,0.5)',
                        borderRadius: 16,
                        padding: '40px 48px',
                        maxWidth: 460,
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>Locked</div>
                        <h2 style={{ color: '#ef4444', marginBottom: 12, fontSize: '1.4rem' }}>
                            Session Ended
                        </h2>
                        <p style={{ color: '#c4b5d0', marginBottom: 24, lineHeight: 1.6 }}>
                            Your account was logged in on another device or browser.
                            For security, this session has been terminated.
                        </p>
                        <button
                            onClick={() => { setSessionConflict(false); window.location.href = '/login'; }}
                            style={{
                                background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
                                color: '#fff', border: 'none', borderRadius: 8,
                                padding: '12px 32px', fontSize: '1rem',
                                fontWeight: 700, cursor: 'pointer',
                            }}
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
};
