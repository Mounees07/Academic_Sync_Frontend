import React, { useEffect, useState } from 'react';
import './SessionTimeoutModal.css';

const SessionTimeoutModal = ({ visible, secondsLeft = 60, onStay, onLogout }) => {
    const [count, setCount] = useState(secondsLeft);

    useEffect(() => {
        if (!visible) {
            return undefined;
        }

        setCount(secondsLeft);

        const intervalId = window.setInterval(() => {
            setCount((prev) => {
                if (prev <= 1) {
                    window.clearInterval(intervalId);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [visible, secondsLeft]);

    if (!visible) {
        return null;
    }

    const pct = secondsLeft > 0 ? (count / secondsLeft) * 100 : 0;
    const isUrgent = count <= 15;

    return (
        <div className="sto-backdrop" role="dialog" aria-modal="true" aria-labelledby="sto-title">
            <div className={`sto-modal ${isUrgent ? 'sto-urgent' : ''}`}>
                <div className="sto-ring-wrapper">
                    <svg className="sto-ring" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" className="sto-ring-bg" />
                        <circle
                            cx="60"
                            cy="60"
                            r="52"
                            className="sto-ring-fg"
                            style={{
                                strokeDasharray: `${2 * Math.PI * 52}`,
                                strokeDashoffset: `${2 * Math.PI * 52 * (1 - pct / 100)}`,
                            }}
                        />
                    </svg>
                    <span className="sto-count">{count}</span>
                </div>

                <div className="sto-icon">01:00</div>
                <h2 className="sto-title" id="sto-title">Session Expiring Soon</h2>
                <p className="sto-body">
                    Your session is about to expire. Do you want to continue?
                    <br />
                    <strong>You will be logged out in {count} second{count !== 1 ? 's' : ''}.</strong>
                </p>

                <div className="sto-actions">
                    <button className="sto-btn sto-btn-stay" onClick={onStay}>
                        Continue
                    </button>
                    <button className="sto-btn sto-btn-logout" onClick={onLogout}>
                        Logout Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeoutModal;
