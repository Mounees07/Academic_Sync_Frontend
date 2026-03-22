import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Award, BookOpen, TrendingUp } from 'lucide-react';
import FeatureGate from '../../components/FeatureGate';
import './StudentResults.css';
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css';

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const convertSemesterMarksToSixty = (semesterMarks) => {
    if (semesterMarks === null || semesterMarks === undefined || semesterMarks === '') return 0;
    return round2((Number(semesterMarks) / 100) * 60);
};

const getGradePoints = (grade) => {
    switch (grade) {
        case 'O': return 10;
        case 'A+': return 9;
        case 'A': return 8;
        case 'B+': return 7;
        case 'B': return 6;
        default: return 0;
    }
};

const getGrade = (totalMarks, semesterMarks) => {
    if (semesterMarks === null || semesterMarks === undefined || semesterMarks === '') return 'AB';
    if (totalMarks >= 91) return 'O';
    if (totalMarks >= 81) return 'A+';
    if (totalMarks >= 71) return 'A';
    if (totalMarks >= 61) return 'B+';
    if (totalMarks >= 50) return 'B';
    return 'RA';
};

const normalizeResult = (result) => {
    const internalMarks = round2(result.internalMarks);
    const semesterMarks = result.semesterMarks === null || result.semesterMarks === undefined || result.semesterMarks === ''
        ? null
        : round2(result.semesterMarks);
    const totalMarks = round2(internalMarks + convertSemesterMarksToSixty(semesterMarks));
    const grade = getGrade(totalMarks, semesterMarks);
    const resultStatus = grade === 'AB' ? 'Absent' : grade === 'RA' ? 'RA' : 'Pass';

    return {
        ...result,
        internalMarks,
        semesterMarks,
        totalMarks,
        grade,
        gradePoints: getGradePoints(grade),
        resultStatus
    };
};

const StudentResults = () => {
    const { currentUser } = useAuth();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ sgpa: 0, cgpa: 0, totalCredits: 0 });

    useEffect(() => {
        fetchResults();
    }, [currentUser]);

    const fetchResults = async () => {
        if (!currentUser) return;
        try {
            const res = await api.get(`/results/student/${currentUser.uid}`);
            const normalizedResults = (res.data || []).map(normalizeResult);
            setResults(normalizedResults);
            calculateStats(normalizedResults);
        } catch (err) {
            console.error('Failed to fetch results', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const semesterGroups = data.reduce((acc, result) => {
            const sem = result.semester || 'Unknown';
            if (!acc[sem]) acc[sem] = [];
            acc[sem].push(result);
            return acc;
        }, {});

        let totalPoints = 0;
        let totalCredits = 0;

        Object.values(semesterGroups).forEach((semesterResults) => {
            const hasArrear = semesterResults.some((result) => result.grade === 'RA');
            if (hasArrear) {
                return;
            }

            semesterResults.forEach((result) => {
                if (result.credits > 0 && result.grade !== 'AB') {
                    totalPoints += result.gradePoints * result.credits;
                    totalCredits += result.credits;
                }
            });
        });

        setStats({
            totalCredits,
            cgpa: totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 'N/A',
            totalSubjects: data.length
        });
    };

    const getGradeColor = (grade) => {
        if (grade === 'O') return 'text-purple-500';
        if (grade === 'A+' || grade === 'A') return 'text-green-500';
        if (grade === 'B+' || grade === 'B') return 'text-blue-500';
        return 'text-red-500';
    };

    if (loading) {
        return <div className="loading-screen"><Hourglass size="40" bgOpacity="0.1" speed="1.75" color="black" /></div>;
    }

    const groupedResults = results.reduce((acc, curr) => {
        const sem = curr.semester || 'Unknown';
        if (!acc[sem]) acc[sem] = [];
        acc[sem].push(curr);
        return acc;
    }, {});

    return (
        <FeatureGate featureKey="feature.result.enabled" title="Results Module">
            <div className="student-results-page">
                <header className="page-header">
                    <div>
                        <h1>My Results</h1>
                        <p>Academic performance and grade history</p>
                    </div>
                </header>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon bg-purple-100 text-purple-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3>CGPA</h3>
                            <p className="stat-value">{stats.cgpa}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon bg-blue-100 text-blue-600">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h3>Total Credits</h3>
                            <p className="stat-value">{stats.totalCredits}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon bg-green-100 text-green-600">
                            <Award size={24} />
                        </div>
                        <div>
                            <h3>Subjects Cleared</h3>
                            <p className="stat-value">{results.filter((result) => result.grade !== 'RA' && result.grade !== 'AB').length}</p>
                        </div>
                    </div>
                </div>

                <div className="semesters-container">
                    {Object.keys(groupedResults).sort().reverse().map((sem) => (
                        <div key={sem} className="semester-section glass-card">
                            <div className="sem-header">
                                <h2>Semester {sem}</h2>
                                <span className="sem-badge">Completed</span>
                            </div>
                            <div className="results-table-wrapper">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Subject Code</th>
                                            <th>Subject Name</th>
                                            <th>Internal</th>
                                            <th>Semester</th>
                                            <th>Total</th>
                                            <th>Credits</th>
                                            <th>Grade</th>
                                            <th>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedResults[sem].map((result, idx) => (
                                            <tr key={idx}>
                                                <td className="font-mono">{result.subjectCode}</td>
                                                <td>{result.subjectName}</td>
                                                <td>{result.internalMarks ?? '-'}</td>
                                                <td>{result.semesterMarks ?? 'AB'}</td>
                                                <td>{result.totalMarks ?? '-'}</td>
                                                <td>{result.credits}</td>
                                                <td className={`font-bold ${getGradeColor(result.grade)}`}>{result.grade}</td>
                                                <td>
                                                    <span className={`status-pill ${result.grade === 'RA' || result.grade === 'AB' ? 'fail' : 'pass'}`}>
                                                        {result.resultStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {results.length === 0 && (
                        <div className="empty-state">
                            <BookOpen size={48} className="text-gray-300 mb-4" />
                            <h3>No results published yet.</h3>
                            <p>Check back later after the exam results are announced.</p>
                        </div>
                    )}
                </div>
            </div>
        </FeatureGate>
    );
};

export default StudentResults;
