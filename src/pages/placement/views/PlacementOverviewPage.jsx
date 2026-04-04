import React from 'react';
import { ArrowRight, Briefcase, ClipboardCheck, GraduationCap, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const PlacementOverviewPage = ({
    analyticsSummary,
    departmentOptions,
    drives,
    navigate,
    placementStatsData,
    skillsDistributionData,
    studentManagementMetrics
}) => (
    <>
        <div className="pc-section-grid">
            <section className="pc-panel highlighted">
                <div className="pc-panel-header">
                    <div>
                        <h2>Readiness Distribution</h2>
                        <p>See how students are spread across readiness bands.</p>
                    </div>
                    <PieChartIcon size={18} />
                </div>
                <div className="pc-chart-wrap">
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={skillsDistributionData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                                {skillsDistributionData.map((entry) => (
                                    <Cell key={entry.name} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <section className="pc-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>Placement Activity</h2>
                        <p>Track ongoing company and drive activity.</p>
                    </div>
                    <Briefcase size={18} />
                </div>
                <div className="pc-chart-wrap">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={placementStatsData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#6366f1" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>

        <div className="pc-overview-grid">
            <section className="pc-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>Student Snapshot</h2>
                        <p>Use the students page for detailed records and readiness updates.</p>
                    </div>
                    <GraduationCap size={18} />
                </div>
                <div className="pc-overview-card-list">
                    <article className="pc-overview-mini-card">
                        <span>Students in view</span>
                        <strong>{studentManagementMetrics.visibleCount}</strong>
                    </article>
                    <article className="pc-overview-mini-card">
                        <span>Placement ready</span>
                        <strong>{studentManagementMetrics.placementReadyCount}</strong>
                    </article>
                    <article className="pc-overview-mini-card">
                        <span>Departments tracked</span>
                        <strong>{Math.max(0, departmentOptions.length - 1)}</strong>
                    </article>
                </div>
                <button className="pc-inline-link" onClick={() => navigate('/placement-coordinator/students')}>
                    Open Student Management
                    <ArrowRight size={16} />
                </button>
            </section>

            <section className="pc-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>Assessment Studio</h2>
                        <p>Track mock interviews, training attendance, vendor assessments, and custom placement rounds.</p>
                    </div>
                    <ClipboardCheck size={18} />
                </div>
                <div className="pc-overview-card-list">
                    <article className="pc-overview-mini-card">
                        <span>Mock interview focus</span>
                        <strong>{studentManagementMetrics.mockInterviewAttentionCount}</strong>
                    </article>
                    <article className="pc-overview-mini-card">
                        <span>Average aptitude</span>
                        <strong>{Math.round(studentManagementMetrics.averageAptitude)}%</strong>
                    </article>
                    <article className="pc-overview-mini-card">
                        <span>Ready for review</span>
                        <strong>{studentManagementMetrics.visibleCount}</strong>
                    </article>
                </div>
                <button className="pc-inline-link" onClick={() => navigate('/placement-coordinator/assessments')}>
                    Open Assessments
                    <ArrowRight size={16} />
                </button>
            </section>

            <section className="pc-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>Drive Snapshot</h2>
                        <p>Use the drives page to manage recruiters, applicants, and drive setup.</p>
                    </div>
                    <Briefcase size={18} />
                </div>
                <div className="pc-overview-card-list">
                    <article className="pc-overview-mini-card">
                        <span>Active drives</span>
                        <strong>{drives.filter((drive) => String(drive.status || '').toUpperCase() === 'ACTIVE').length}</strong>
                    </article>
                    <article className="pc-overview-mini-card">
                        <span>Total drives</span>
                        <strong>{drives.length}</strong>
                    </article>
                    <article className="pc-overview-mini-card">
                        <span>Highest package</span>
                        <strong>{analyticsSummary.highestPackage.toFixed(1)} LPA</strong>
                    </article>
                </div>
                <button className="pc-inline-link" onClick={() => navigate('/placement-coordinator/drives')}>
                    Open Drive Management
                    <ArrowRight size={16} />
                </button>
            </section>

            <section className="pc-panel">
                <div className="pc-panel-header">
                    <div>
                        <h2>Analytics Snapshot</h2>
                        <p>Use the analytics page for placement trends and recruiter breakdowns.</p>
                    </div>
                    <TrendingUp size={18} />
                </div>
                <div className="pc-overview-card-list">
                    <article className="pc-overview-mini-card">
                        <span>Overall placement</span>
                        <strong>{analyticsSummary.overallPlacement.toFixed(1)}%</strong>
                    </article>
                    <article className="pc-overview-mini-card">
                        <span>Average package</span>
                        <strong>{analyticsSummary.averagePackage.toFixed(1)} LPA</strong>
                    </article>
                    <article className="pc-overview-mini-card">
                        <span>Top offer source</span>
                        <strong>{analyticsSummary.highestPackageCompany}</strong>
                    </article>
                </div>
                <button className="pc-inline-link" onClick={() => navigate('/placement-coordinator/analytics')}>
                    Open Analytics
                    <ArrowRight size={16} />
                </button>
            </section>
        </div>
    </>
);

export default PlacementOverviewPage;
