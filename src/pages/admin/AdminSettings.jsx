import React, { useState } from 'react';
import {
    Save,
    Server,
    Shield,
    Database,
    Bell,
    Globe,
    ToggleLeft,
    ToggleRight,
    ClipboardList,
    Mail,
    Lock,
    Clock,
    User,
    FileText,
    AlertCircle,
    Users,
    LogOut,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import './AdminSettings.css';
import api from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';

const AdminSettings = () => {
    const { refreshSettings } = useSettings();
    const [settings, setSettings] = useState({
        siteName: 'AcaSync Platform',
        adminEmail: 'admin@acasync.edu',
        maintenanceMode: false,
        allowRegistration: true,
        emailNotifications: true,
        smsNotifications: true,
        defaultLanguage: 'English',
        sessionTimeout: '30',
        'app.sms.twilio.account-sid': '',
        'app.sms.twilio.auth-token': '',
        'app.sms.twilio.from-number': '',
        // Features
        'feature.leave.enabled': true,
        'feature.result.enabled': true,
        'feature.messaging.enabled': true,
        'feature.analytics.enabled': true,
        'feature.courseRegistration.enabled': true,
        'feature.assignments.enabled': true,
        'feature.finance.enabled': true,
        'feature.examSeating.enabled': true,
        // Security
        'security.captcha.enabled': false,
        'security.login.maxAttempts': 5,
        'security.singleSession.enabled': false,
        // Policies
        'policy.attendance.threshold': 75,
        'policy.attendance.detain': 65,
        'policy.attendance.semesterStartDate': '',
        'policy.leave.maxDays': 10,
        'policy.dataRetention': 365,
        'policy.password.minLength': 8,
        'policy.password.complexity': 'strong',
        // Reports
        'report.export.enabled': true,
        // Environment
        'env.label': 'Production',
        'env.debugMode': false,
    });

    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);

    // Fetch settings on mount
    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/admin/settings');

                if (response.data) {
                    const d = response.data;

                    // Helper – parse a backend string to boolean
                    const bool = (key, fallback = true) =>
                        d[key] !== undefined ? d[key] === 'true' : fallback;

                    // Helper – parse to number, keep as number
                    const num = (key, fallback) =>
                        d[key] !== undefined ? Number(d[key]) : fallback;

                    setSettings(prev => ({
                        ...prev,
                        // String fields (keep as string)
                        siteName: d.siteName ?? prev.siteName,
                        adminEmail: d.adminEmail ?? prev.adminEmail,
                        defaultLanguage: d.defaultLanguage ?? prev.defaultLanguage,
                        sessionTimeout: d.sessionTimeout ?? prev.sessionTimeout,
                        'app.sms.twilio.account-sid': d['app.sms.twilio.account-sid'] ?? prev['app.sms.twilio.account-sid'],
                        'app.sms.twilio.auth-token': d['app.sms.twilio.auth-token'] ?? prev['app.sms.twilio.auth-token'],
                        'app.sms.twilio.from-number': d['app.sms.twilio.from-number'] ?? prev['app.sms.twilio.from-number'],
                        'env.label': d['env.label'] ?? prev['env.label'],
                        'policy.password.complexity': d['policy.password.complexity'] ?? prev['policy.password.complexity'],

                        // Boolean fields
                        maintenanceMode: bool('maintenanceMode', false),
                        allowRegistration: bool('allowRegistration', true),
                        emailNotifications: bool('emailNotifications', true),
                        smsNotifications: bool('smsNotifications', true),
                        'report.export.enabled': bool('report.export.enabled', true),
                        'env.debugMode': bool('env.debugMode', false),
                        'feature.leave.enabled': bool('feature.leave.enabled', true),
                        'feature.result.enabled': bool('feature.result.enabled', true),
                        'feature.messaging.enabled': bool('feature.messaging.enabled', true),
                        'feature.analytics.enabled': bool('feature.analytics.enabled', true),
                        'feature.courseRegistration.enabled': bool('feature.courseRegistration.enabled', true),
                        'feature.assignments.enabled': bool('feature.assignments.enabled', true),
                        'feature.finance.enabled': bool('feature.finance.enabled', true),
                        'feature.examSeating.enabled': bool('feature.examSeating.enabled', true),

                        // Security booleans
                        'security.captcha.enabled': bool('security.captcha.enabled', false),
                        'security.singleSession.enabled': bool('security.singleSession.enabled', false),

                        // Number / mixed fields
                        'policy.attendance.threshold': num('policy.attendance.threshold', 75),
                        'policy.attendance.detain': num('policy.attendance.detain', 65),
                        'policy.attendance.semesterStartDate': d['policy.attendance.semesterStartDate'] ?? prev['policy.attendance.semesterStartDate'],
                        'policy.leave.maxDays': num('policy.leave.maxDays', 10),
                        'policy.dataRetention': num('policy.dataRetention', 365),
                        'policy.password.minLength': num('policy.password.minLength', 8),
                        'security.login.maxAttempts': num('security.login.maxAttempts', 5),
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch settings', error);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                // preserve all string-valued settings as-is
                ...settings,
                // coerce booleans → 'true' / 'false'
                maintenanceMode: String(settings.maintenanceMode),
                allowRegistration: String(settings.allowRegistration),
                emailNotifications: String(settings.emailNotifications),
                smsNotifications: String(settings.smsNotifications),
                'report.export.enabled': String(settings['report.export.enabled']),
                'security.captcha.enabled': String(settings['security.captcha.enabled']),
                'security.singleSession.enabled': String(settings['security.singleSession.enabled']),
                'env.debugMode': String(settings['env.debugMode']),
                'feature.leave.enabled': String(settings['feature.leave.enabled']),
                'feature.result.enabled': String(settings['feature.result.enabled']),
                'feature.messaging.enabled': String(settings['feature.messaging.enabled']),
                'feature.analytics.enabled': String(settings['feature.analytics.enabled']),
                'feature.courseRegistration.enabled': String(settings['feature.courseRegistration.enabled']),
                'feature.assignments.enabled': String(settings['feature.assignments.enabled']),
                'feature.finance.enabled': String(settings['feature.finance.enabled']),
                'feature.examSeating.enabled': String(settings['feature.examSeating.enabled']),
                // coerce numbers → string (backend stores everything as String)
                'policy.attendance.threshold': String(settings['policy.attendance.threshold']),
                'policy.attendance.detain': String(settings['policy.attendance.detain']),
                'policy.attendance.semesterStartDate': String(settings['policy.attendance.semesterStartDate']),
                'policy.leave.maxDays': String(settings['policy.leave.maxDays']),
                'policy.dataRetention': String(settings['policy.dataRetention']),
                'policy.password.minLength': String(settings['policy.password.minLength']),
                'security.login.maxAttempts': String(settings['security.login.maxAttempts']),
            };

            const response = await api.post('/admin/settings', payload);

            if (response.status === 200) {
                await refreshSettings();
                alert('Settings saved successfully! Changes are now enforced across the platform.');
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || error.message;
            alert('Error saving settings: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    const ToggleSwitch = ({ name, checked, onChange }) => (
        <div className="switch-wrapper">
            <input
                type="checkbox"
                name={name}
                id={`switch-${name}`}
                checked={checked}
                onChange={onChange}
            />
        </div>
    );

    const tabs = [
        { id: 'general', label: 'General', icon: <Globe size={20} /> },
        { id: 'security', label: 'Security', icon: <Shield size={20} /> },
        { id: 'features', label: 'Features', icon: <Database size={20} /> },
        { id: 'env', label: 'Environment', icon: <Server size={20} /> },
        { id: 'sessions', label: 'Active Sessions', icon: <Users size={20} /> },
        { id: 'logs', label: 'Audit Logs', icon: <ClipboardList size={20} /> }
    ];

    const InputField = ({ label, name, type = "text", value, onChange, icon: Icon, placeholder }) => (
        <div className="form-group-styled">
            <label className="input-label">{label}</label>
            <div className="input-wrapper">
                {Icon && <Icon size={20} className="input-icon" />}
                <input
                    type={type}
                    name={name}
                    className="styled-input"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    style={{ paddingLeft: Icon ? '48px' : '20px' }}
                />
            </div>
        </div>
    );

    const SelectField = ({ label, name, value, onChange, options }) => (
        <div className="form-group-styled">
            <label className="input-label">{label}</label>
            <div className="env-select-container">
                <select
                    name={name}
                    className="styled-select"
                    value={value}
                    onChange={onChange}
                >
                    {options.map(opt => (
                        <option key={opt}>{opt}</option>
                    ))}
                </select>
                <div className="select-arrow">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.41 0.589996L6 5.17L10.59 0.589996L12 2L6 8L0 2L1.41 0.589996Z" fill="currentColor" />
                    </svg>
                </div>
            </div>
        </div>
    );

    return (
        <div className="settings-container">
            {/* Header */}
            <div className="settings-header">
                <div className="settings-title">
                    <h2>System Configuration</h2>
                    <p>Manage platform-wide settings and preferences</p>
                </div>
                <button
                    className="save-btn"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? (
                        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                    ) : (
                        <Save size={20} />
                    )}
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>

            {/* Main Content Card */}
            <div className="settings-main-card">
                {/* Tabs */}
                <div className="settings-tabs-container">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <div className="tab-icon-box">
                                {tab.icon}
                            </div>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="settings-content-area">
                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="section-grid animate-fade-in">
                            <div>
                                <div className="settings-section-header">
                                    <Globe size={24} color="#4D44B5" />
                                    <h3>Platform Identity</h3>
                                </div>
                                <div className="form-content">
                                    <InputField
                                        label="Platform Name"
                                        name="siteName"
                                        value={settings.siteName}
                                        onChange={handleChange}
                                        placeholder="e.g. AcaSync Platform"
                                        icon={Server}
                                    />
                                    <InputField
                                        label="Admin Contact Email"
                                        name="adminEmail"
                                        type="email"
                                        value={settings.adminEmail}
                                        onChange={handleChange}
                                        placeholder="admin@school.edu"
                                        icon={Mail}
                                    />
                                    <SelectField
                                        label="Default Language"
                                        name="defaultLanguage"
                                        value={settings.defaultLanguage}
                                        onChange={handleChange}
                                        options={['English', 'Spanish', 'French', 'German']}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="settings-section-header">
                                    <Bell size={24} color="#FB7D5B" />
                                    <h3>Notifications</h3>
                                </div>
                                <div className="form-content">
                                    <div className="toggle-row">
                                        <div className="toggle-info">
                                            <label>Email Notifications
                                                {!settings.emailNotifications && (
                                                    <span style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700 }}>DISABLED</span>
                                                )}
                                            </label>
                                            <p>Send system alerts and reports via email.{!settings.emailNotifications && <strong style={{ color: '#ef4444' }}> Emails are currently blocked.</strong>}</p>
                                        </div>
                                        <ToggleSwitch name="emailNotifications" checked={settings.emailNotifications} onChange={handleChange} />
                                    </div>
                                    <div className="toggle-row">
                                        <div className="toggle-info">
                                            <label>SMS Notifications
                                                {!settings.smsNotifications && (
                                                    <span style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700 }}>DISABLED</span>
                                                )}
                                            </label>
                                            <p>Send leave updates and approval requests to the parent's registered mobile number.{!settings.smsNotifications && <strong style={{ color: '#ef4444' }}> Parent SMS delivery is currently blocked.</strong>}</p>
                                        </div>
                                        <ToggleSwitch name="smsNotifications" checked={settings.smsNotifications} onChange={handleChange} />
                                    </div>
                                    <div className="toggle-row">
                                        <div className="toggle-info">
                                            <label>Export Features
                                                {!settings['report.export.enabled'] && (
                                                    <span style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700 }}>DISABLED</span>
                                                )}
                                            </label>
                                            <p>Allow exporting reports to CSV/PDF.{!settings['report.export.enabled'] && <strong style={{ color: '#ef4444' }}> Export buttons are currently hidden/disabled.</strong>}</p>
                                        </div>
                                        <ToggleSwitch name="report.export.enabled" checked={settings['report.export.enabled']} onChange={handleChange} />
                                    </div>
                                    <div style={{ marginTop: '24px' }}>
                                        <InputField
                                            label="Twilio Account SID"
                                            name="app.sms.twilio.account-sid"
                                            value={settings['app.sms.twilio.account-sid']}
                                            onChange={handleChange}
                                            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                        />
                                    </div>
                                    <div className="section-grid" style={{ gap: '24px', marginTop: '24px' }}>
                                        <InputField
                                            label="Twilio Auth Token"
                                            name="app.sms.twilio.auth-token"
                                            type="password"
                                            value={settings['app.sms.twilio.auth-token']}
                                            onChange={handleChange}
                                            placeholder="Enter Twilio auth token"
                                        />
                                        <InputField
                                            label="Twilio From Number"
                                            name="app.sms.twilio.from-number"
                                            value={settings['app.sms.twilio.from-number']}
                                            onChange={handleChange}
                                            placeholder="+1xxxxxxxxxx"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="section-grid animate-fade-in">
                            <div>
                                <div className="settings-section-header">
                                    <Lock size={24} color="#4D44B5" />
                                    <h3>Access Control</h3>
                                </div>
                                <div className="form-content">
                                    <div className="toggle-row">
                                        <div className="toggle-info">
                                            <label>Allow Registration
                                                {!settings.allowRegistration && (
                                                    <span style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700 }}>CLOSED</span>
                                                )}
                                            </label>
                                            <p>Enable public user signup pages.{!settings.allowRegistration && <strong style={{ color: '#ef4444' }}> Login page will show a registration-disabled notice.</strong>}</p>
                                        </div>
                                        <ToggleSwitch name="allowRegistration" checked={settings.allowRegistration} onChange={handleChange} />
                                    </div>
                                    <div className="toggle-row">
                                        <div className="toggle-info">
                                            <label>Maintenance Mode</label>
                                            <p>Restrict access to administrators only.</p>
                                        </div>
                                        <ToggleSwitch name="maintenanceMode" checked={settings.maintenanceMode} onChange={handleChange} />
                                    </div>
                                    <div style={{ marginTop: '24px' }}>
                                        <InputField
                                            label="Session Timeout (minutes)"
                                            name="sessionTimeout"
                                            type="number"
                                            value={settings.sessionTimeout}
                                            onChange={handleChange}
                                            icon={Clock}
                                            placeholder="30"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="settings-section-header">
                                    <Shield size={24} color="#FCC43E" />
                                    <h3>Security Policies</h3>
                                </div>
                                <div className="form-content">
                                    <div className="section-grid" style={{ gap: '24px' }}>
                                        <InputField
                                            label="Min Password Length"
                                            name="policy.password.minLength"
                                            type="number"
                                            value={settings['policy.password.minLength'] || 8}
                                            onChange={handleChange}
                                            placeholder="8"
                                        />
                                        <InputField
                                            label="Max Login Attempts"
                                            name="security.login.maxAttempts"
                                            type="number"
                                            value={settings['security.login.maxAttempts'] || 5}
                                            onChange={handleChange}
                                            placeholder="5"
                                        />
                                    </div>
                                    <div className="toggle-row" style={{ marginTop: '24px' }}>
                                        <div className="toggle-info">
                                            <label>Enforce CAPTCHA</label>
                                            <p>Require CAPTCHA on login page.</p>
                                        </div>
                                        <ToggleSwitch name="security.captcha.enabled" checked={settings['security.captcha.enabled']} onChange={handleChange} />
                                    </div>
                                    <div className="toggle-row" style={{ marginTop: '24px' }}>
                                        <div className="toggle-info">
                                            <label>Restrict to Single Session
                                                {settings['security.singleSession.enabled'] && (
                                                    <span style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700 }}>ACTIVE</span>
                                                )}
                                            </label>
                                            <p>Allow only one active login per user at a time. Logging in on a new device instantly logs out the previous session.</p>
                                        </div>
                                        <ToggleSwitch name="security.singleSession.enabled" checked={settings['security.singleSession.enabled']} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FEATURES TAB */}
                    {activeTab === 'features' && (
                        <div className="animate-fade-in">
                            {/* Module Management */}
                            <div className="settings-section-header" style={{ marginBottom: '20px' }}>
                                <Database size={24} color="#7c6bdc" />
                                <h3>Module Management</h3>
                            </div>
                            <div className="section-grid" style={{ gap: '12px', marginBottom: '40px' }}>
                                {[
                                    { key: 'feature.leave.enabled', label: 'Leave Management', desc: 'Student leave requests & mentor approvals.', icon: '🏖️' },
                                    { key: 'feature.result.enabled', label: 'Results Module', desc: 'COE publishes exam results for students.', icon: '📊' },
                                    { key: 'feature.analytics.enabled', label: 'Analytics Dashboard', desc: 'HOD / Admin advanced usage stats.', icon: '📈' },
                                    { key: 'feature.messaging.enabled', label: 'Messaging System', desc: 'Internal chat & broadcast announcements.', icon: '💬' },
                                    { key: 'feature.courseRegistration.enabled', label: 'Course Registration', desc: 'Students self-select faculty per course.', icon: '📚' },
                                    { key: 'feature.assignments.enabled', label: 'Assignment Submission', desc: 'Teachers post tasks & students submit.', icon: '📝' },
                                    { key: 'feature.finance.enabled', label: 'Finance Module', desc: 'Fee records and payment tracking.', icon: '💰' },
                                    { key: 'feature.examSeating.enabled', label: 'Exam Seating', desc: 'COE publishes seating chart for students.', icon: '🪑' },
                                ].map(item => (
                                    <div key={item.key} className="toggle-row">
                                        <div className="toggle-info">
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span>{item.icon}</span> {item.label}
                                                {!settings[item.key] && (
                                                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 700 }}>OFF</span>
                                                )}
                                            </label>
                                            <p>{item.desc}</p>
                                        </div>
                                        <ToggleSwitch name={item.key} checked={!!settings[item.key]} onChange={handleChange} />
                                    </div>
                                ))}
                            </div>

                            {/* Academic Policies */}
                            <div className="settings-section-header" style={{ marginBottom: '20px' }}>
                                <AlertCircle size={24} color="#FB7D5B" />
                                <h3>Academic Policies</h3>
                            </div>
                            <div className="section-grid" style={{ gap: '24px', marginBottom: '24px' }}>
                                <InputField
                                    label="Minimum Attendance Threshold (%)"
                                    name="policy.attendance.threshold"
                                    type="number"
                                    value={settings['policy.attendance.threshold'] || 75}
                                    onChange={handleChange}
                                    placeholder="75"
                                    icon={Shield}
                                />
                                <InputField
                                    label="Detain Below Attendance (%)"
                                    name="policy.attendance.detain"
                                    type="number"
                                    value={settings['policy.attendance.detain'] || 65}
                                    onChange={handleChange}
                                    placeholder="65"
                                    icon={Shield}
                                />
                                <InputField
                                    label="Attendance Start Date"
                                    name="policy.attendance.semesterStartDate"
                                    type="date"
                                    value={settings['policy.attendance.semesterStartDate'] || ''}
                                    onChange={handleChange}
                                    placeholder="YYYY-MM-DD"
                                    icon={Clock}
                                />
                                <InputField
                                    label="Max Leave Days Per Semester"
                                    name="policy.leave.maxDays"
                                    type="number"
                                    value={settings['policy.leave.maxDays'] || 10}
                                    onChange={handleChange}
                                    placeholder="10"
                                    icon={Clock}
                                />
                                <InputField
                                    label="Data Retention Period (Days)"
                                    name="policy.dataRetention"
                                    type="number"
                                    value={settings['policy.dataRetention'] || 365}
                                    onChange={handleChange}
                                    placeholder="365"
                                    icon={Clock}
                                />
                                <InputField
                                    label="Min Password Length"
                                    name="policy.password.minLength"
                                    type="number"
                                    value={settings['policy.password.minLength'] || 8}
                                    onChange={handleChange}
                                    placeholder="8"
                                    icon={Shield}
                                />
                                <SelectField
                                    label="Password Strength"
                                    name="policy.password.complexity"
                                    value={settings['policy.password.complexity'] || 'strong'}
                                    onChange={handleChange}
                                    options={['basic', 'medium', 'strong']}
                                />
                            </div>

                            <div className="alert-box">
                                <AlertCircle size={24} color="#FB7D5B" style={{ flexShrink: 0 }} />
                                <div className="alert-content">
                                    <h4>Important Notice</h4>
                                    <p>Toggling a module OFF immediately prevents students and faculty from accessing that page. Changing attendance or retention policies takes effect on the next scheduled report cycle.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACTIVE SESSIONS TAB */}
                    {activeTab === 'sessions' && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
                            <ActiveSessionsViewer singleSessionEnabled={settings['security.singleSession.enabled']} />
                        </div>
                    )}

                    {/* ENV TAB */}
                    {activeTab === 'env' && (
                        <div style={{ maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
                            <div className="settings-section-header">
                                <Server size={24} color="#7c6bdc" />
                                <h3>Environment Configuration</h3>
                            </div>

                            <div className="env-config-card">
                                <SelectField
                                    label="Environment Label"
                                    name="env.label"
                                    value={settings['env.label'] || 'Production'}
                                    onChange={handleChange}
                                    options={['Development', 'Testing', 'Staging', 'Production']}
                                />

                                <div className="toggle-row" style={{ marginTop: '24px' }}>
                                    <div className="toggle-info">
                                        <label>Debug Mode</label>
                                        <p>Enable verbose logging for system diagnostics.</p>
                                    </div>
                                    <ToggleSwitch name="env.debugMode" checked={settings['env.debugMode']} onChange={handleChange} />
                                </div>

                                <div className="env-info-banner">
                                    <Server size={18} />
                                    <p>Current Server Version: <strong>v2.4.0-stable</strong> (Build 20240215)</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LOGS TAB */}
                    {activeTab === 'logs' && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }} className="animate-fade-in">
                            <div className="settings-header" style={{ marginBottom: '24px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <ClipboardList size={24} color="#7c6bdc" />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>System Audit Trail</h3>
                                </div>
                                <button style={{ border: 'none', background: 'none', color: '#7c6bdc', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                    <FileText size={16} />
                                    Export Logs
                                </button>
                            </div>
                            <div style={{ flex: 1 }}>
                                <AuditLogViewer />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Active Sessions Viewer ─────────────────────────────────────────────────────
const ActiveSessionsViewer = ({ singleSessionEnabled }) => {
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [kicking, setKicking] = useState({});
    const [kickMsg, setKickMsg] = useState('');

    const fetchSessions = async () => {
        setLoadingSessions(true);
        try {
            const res = await api.get('/users/session/active');
            setSessions(res.data || []);
        } catch (err) {
            console.error('Failed to fetch active sessions', err);
            setSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    };

    React.useEffect(() => { fetchSessions(); }, []);

    const handleForceLogout = async (uid, email) => {
        if (!window.confirm(`Force-logout ${email}? Their current session will be immediately terminated.`)) return;
        setKicking(prev => ({ ...prev, [uid]: true }));
        try {
            await api.delete(`/users/session/${uid}`);
            setKickMsg(`✔ Session terminated for ${email}`);
            setSessions(prev => prev.filter(s => s.uid !== uid));
        } catch (err) {
            setKickMsg(`✗ Failed: ${err.response?.data?.error || err.message}`);
        } finally {
            setKicking(prev => ({ ...prev, [uid]: false }));
            setTimeout(() => setKickMsg(''), 4000);
        }
    };

    const roleBadgeColor = (role) => ({
        ADMIN: '#7c3aed',
        TEACHER: '#0891b2',
        STUDENT: '#059669',
        HOD: '#d97706',
        MENTOR: '#2563eb',
    }[role] || '#6b7280');

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--glass-border)', paddingBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Users size={24} color="#7c6bdc" />
                    <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Active Sessions</h3>
                        <p style={{ color: '#A098AE', fontSize: '0.82rem', margin: '4px 0 0' }}>
                            {sessions.length} user{sessions.length !== 1 ? 's' : ''} currently logged in
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchSessions}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--glass-border)', background: 'var(--card-bg)', color: '#7c6bdc', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                    <RefreshCw size={15} /> Refresh
                </button>
            </div>

            {!singleSessionEnabled && (
                <div style={{ background: 'rgba(251,125,91,0.1)', border: '1px solid rgba(251,125,91,0.35)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <AlertCircle size={18} color="#FB7D5B" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ margin: 0, color: '#FB7D5B', fontSize: '0.88rem', lineHeight: 1.5 }}>
                        <strong>Single Session Restriction is OFF.</strong> Users may be logged in on multiple devices simultaneously.
                        Enable "Restrict to Single Session" in the Security tab to enforce one session per user.
                    </p>
                </div>
            )}

            {kickMsg && (
                <div style={{ background: kickMsg.startsWith('✔') ? 'rgba(5,150,105,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${kickMsg.startsWith('✔') ? 'rgba(5,150,105,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, color: kickMsg.startsWith('✔') ? '#059669' : '#ef4444', fontWeight: 600, fontSize: '0.88rem' }}>
                    {kickMsg}
                </div>
            )}

            {loadingSessions ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#A098AE' }}>Loading active sessions...</div>
            ) : sessions.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#A098AE' }}>
                    <Users size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ margin: 0 }}>No active sessions found. Users must log in with single-session support enabled.</p>
                </div>
            ) : (
                <div className="audit-table-wrapper">
                    <table className="audit-table">
                        <thead>
                            <tr>
                                <th width="25%">User</th>
                                <th width="30%">Email</th>
                                <th width="15%">Role</th>
                                <th width="20%">Login Time</th>
                                <th width="10%">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(s => (
                                <tr key={s.uid}>
                                    <td style={{ fontWeight: 600 }}>{s.fullName || '—'}</td>
                                    <td style={{ color: '#A098AE', fontSize: '0.88rem' }}>{s.email}</td>
                                    <td>
                                        <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 6, background: `${roleBadgeColor(s.role)}22`, color: roleBadgeColor(s.role), fontWeight: 700 }}>
                                            {s.role}
                                        </span>
                                    </td>
                                    <td style={{ color: '#A098AE', fontSize: '0.82rem' }}>
                                        {s.sessionLoginAt ? new Date(s.sessionLoginAt).toLocaleString() : '—'}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleForceLogout(s.uid, s.email)}
                                            disabled={kicking[s.uid]}
                                            title="Force Logout"
                                            style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                        >
                                            <LogOut size={13} />
                                            {kicking[s.uid] ? '...' : 'Kick'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 10;

    React.useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('/admin/auditlogs');
                if (response.data) {
                    setLogs(response.data);
                }
            } catch (err) {
                console.error("Error fetching logs", err);
                setLogs([
                    { id: 1, action: "UPDATE_SETTINGS", actorEmail: "admin@acasync.edu", details: "Changed site name", ipAddress: "192.168.1.1", timestamp: new Date().toISOString() },
                    { id: 2, action: "LOGIN_SUCCESS", actorEmail: "teacher@acasync.edu", details: "Web login", ipAddress: "10.0.0.5", timestamp: new Date(Date.now() - 3600000).toISOString() },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    React.useEffect(() => {
        const totalPages = Math.max(1, Math.ceil(logs.length / logsPerPage));
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, logs.length]);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#A098AE' }}>Loading ClipboardList logs...</div>;

    if (logs.length === 0) return <div style={{ padding: '40px', textAlign: 'center', color: '#A098AE' }}>No recent ClipboardList found.</div>;

    const totalPages = Math.ceil(logs.length / logsPerPage);
    const startIndex = (currentPage - 1) * logsPerPage;
    const paginatedLogs = logs.slice(startIndex, startIndex + logsPerPage);
    const showingFrom = startIndex + 1;
    const showingTo = Math.min(startIndex + logsPerPage, logs.length);

    const getPageNumbers = () => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        if (currentPage <= 3) {
            return [1, 2, 3, 4, totalPages];
        }

        if (currentPage >= totalPages - 2) {
            return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }

        return [1, currentPage - 1, currentPage, currentPage + 1, totalPages];
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className="audit-log-section">
            <div className="audit-table-wrapper">
                <table className="audit-table">
                    <thead>
                        <tr>
                            <th width="15%">Action</th>
                            <th width="20%">User</th>
                            <th width="30%">Details</th>
                            <th width="15%">IP Address</th>
                            <th width="20%">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedLogs.map(log => (
                            <tr key={log.id}>
                                <td><span className="action-badge">{log.action}</span></td>
                                <td style={{ fontWeight: '500' }}>{log.actorEmail}</td>
                                <td>{log.details}</td>
                                <td><span className="code-text">{log.ipAddress}</span></td>
                                <td style={{ color: '#A098AE' }}>{new Date(log.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="audit-pagination">
                <p className="audit-pagination-text">
                    Showing {showingFrom}-{showingTo} of {logs.length} logs
                </p>
                <div className="audit-pagination-controls">
                    <button
                        type="button"
                        className="audit-pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    {pageNumbers.map((page, index) => {
                        const previousPage = pageNumbers[index - 1];
                        const showEllipsis = previousPage && page - previousPage > 1;

                        return (
                            <React.Fragment key={page}>
                                {showEllipsis && <span className="audit-pagination-ellipsis">...</span>}
                                <button
                                    type="button"
                                    className={`audit-pagination-number ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            </React.Fragment>
                        );
                    })}
                    <button
                        type="button"
                        className="audit-pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
