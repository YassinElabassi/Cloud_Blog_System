"use client";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Cpu, Zap, XCircle, Database, MessageSquare, AlertTriangle, ChevronDown, ChevronUp, Bell, Search, Filter, Gauge, ToggleLeft, ToggleRight, Loader } from "lucide-react";
import toast from "react-hot-toast";
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

// Interface for metric data
interface Metric {
    name: string;
    value: number;
    unit: string;
    icon: React.ReactNode;
    threshold: number;
    severity: 'low' | 'high';
    history: number[]; // History of values for the sparkline
}

type SystemHealth = 'Healthy' | 'Warning' | 'Critical';
type LogSeverity = 'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'CRIT';

// --- CONFIGURATION ---
const HISTORY_SIZE = 15;
const SIMULATION_INTERVAL = 3000; // 3 seconds
const MAX_LOG_COUNT = 15;

// --- ANIMATION VARIANTS ---
const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
        opacity: 1,
        scale: 1,
        transition: { delay: i * 0.1, type: "spring", stiffness: 100, damping: 15 },
    }),
};

// --- LOGIC HELPERS ---

// Helper component for Log coloring
const LogLine = ({ log }: { log: string }) => {
    let colorClass = "text-gray-800 dark:text-gray-300";

    if (log.includes("[ERROR]")) {
        colorClass = "text-red-600 dark:text-red-400 font-semibold";
    } else if (log.includes("[WARN]")) {
        colorClass = "text-yellow-600 dark:text-yellow-400";
    } else if (log.includes("[CRIT]")) {
        colorClass = "text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-950 px-1 rounded";
    }

    const logWithTime = log.includes("]") ? log : `[${new Date().toLocaleTimeString('en-US')}] ${log}`;

    return (
        <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
            className={`text-sm font-mono mb-1 ${colorClass} whitespace-pre-wrap`}
        >
            {logWithTime}
        </motion.p>
    );
};

// Sparkline Component using Recharts
const Sparkline = ({ history, isCritical }: { history: number[], isCritical: boolean }) => {
    // Recharts data format requires an array of objects
    const data = history.map((value, index) => ({
        time: HISTORY_SIZE - 1 - index,
        value: value,
    })).reverse(); 

    // Determine min/max values for scale
    const allValues = history.slice(0, history.length);
    const yMin = Math.min(...allValues) * 0.9;
    const yMax = Math.max(...allValues) * 1.1;

    // Determine the color
    const chartColor = isCritical ? '#ef4444' : '#3b82f6';

    return (
        <div className="h-10 w-full mt-2 -mb-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                    data={data} 
                    margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id={`colorValue-${chartColor}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0.1}/>
                        </linearGradient>
                    </defs>
                    
                    {/* SOLUTION: Add a HIDDEN YAxis to enforce the domain */}
                    <YAxis 
                        hide 
                        type="number" 
                        domain={[yMin, yMax]} 
                        axisLine={false} 
                        tickLine={false}
                    />

                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={chartColor}
                        fillOpacity={1}
                        fill={`url(#colorValue-${chartColor})`}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};


const MetricsPage = () => {
    const [isSimulationActive, setIsSimulationActive] = useState(true); // Simulation Toggle
    const [isCompactMode, setIsCompactMode] = useState(false); // Compact Mode Toggle
    const [logSearchTerm, setLogSearchTerm] = useState(""); // Text Log Filter
    const [logSeverityFilter, setLogSeverityFilter] = useState<LogSeverity>('ALL'); // Severity Filter

    const initialMetrics: Metric[] = [
        { name: "CPU Utilization", value: 35, unit: "%", icon: <Cpu size={24} />, threshold: 80, severity: 'high', history: Array(HISTORY_SIZE).fill(35) },
        { name: "Avg API Latency", value: 180, unit: "ms", icon: <Zap size={24} />, threshold: 500, severity: 'high', history: Array(HISTORY_SIZE).fill(180) },
        { name: "API Requests / min", value: 124, unit: "", icon: <Loader size={24} />, threshold: 50, severity: 'low', history: Array(HISTORY_SIZE).fill(124) },
        { name: "Errors / min", value: 3, unit: "", icon: <XCircle size={24} />, threshold: 5, severity: 'high', history: Array(HISTORY_SIZE).fill(3) },
        { name: "Active DB Connections", value: 8, unit: "", icon: <Database size={24} />, threshold: 20, severity: 'high', history: Array(HISTORY_SIZE).fill(8) },
        { name: "New Comments / hr", value: 15, unit: "", icon: <MessageSquare size={24} />, threshold: 5, severity: 'low', history: Array(HISTORY_SIZE).fill(15) },
    ];

    const [metrics, setMetrics] = useState<Metric[]>(initialMetrics);
    const [logs, setLogs] = useState<string[]>([
        "[INFO] Server started on port 3000",
        "[INFO] New request: GET /api/users",
        "[WARN] Slow response on /api/articles (1.2s)",
        "[ERROR] User ID 45 authentication failed",
    ]);

    // Calculate Global Health & Dynamic Theme
    const systemHealth: SystemHealth = useMemo(() => {
        let criticalCount = 0;
        let warningCount = 0;

        metrics.forEach(m => {
            const isAlert = m.severity === 'high' ? m.value > m.threshold : m.value < m.threshold;

            if (isAlert) {
                if ((m.name === "Errors / min" && m.value > 10) || (m.name === "CPU Utilization" && m.value > 90)) {
                    criticalCount++;
                } else {
                    warningCount++;
                }
            }
        });

        if (criticalCount > 0) return 'Critical';
        if (warningCount > 0) return 'Warning';
        return 'Healthy';
    }, [metrics]);

    const healthColors = {
        'Healthy': { primary: 'text-green-500', bg: 'bg-green-500', shadow: 'shadow-green-500/30', border: 'border-green-500' },
        'Warning': { primary: 'text-yellow-500', bg: 'bg-yellow-500', shadow: 'shadow-yellow-500/30', border: 'border-yellow-500' },
        'Critical': { primary: 'text-red-500', bg: 'bg-red-500', shadow: 'shadow-red-500/30', border: 'border-red-500' },
    };
    const currentColors = healthColors[systemHealth];

    // Automatic Anomaly Detection (Simulation)
    useEffect(() => {
        if (!isSimulationActive) return;

        const interval = setInterval(() => {
            setMetrics((prevMetrics) =>
                prevMetrics.map((m) => {
                    let change = (Math.random() * 10 - 5) * (m.unit === "ms" ? 10 : 1);
                    let newValue = Math.floor(m.value + change);

                    if (m.unit === "%") {
                        newValue = Math.min(100, Math.max(0, newValue));
                    }
                    if (m.name === "API Requests / min") {
                        newValue = Math.max(50, newValue);
                    }

                    const newHistory = [newValue, ...m.history.slice(0, HISTORY_SIZE - 1)];

                    return { ...m, value: newValue, history: newHistory };
                })
            );

            // Simulate new logs
            const logType = Math.random() < 0.1 ? "ERROR" : (Math.random() < 0.3 ? "WARN" : "INFO");
            const newLog = `[${new Date().toLocaleTimeString('en-US')}] [${logType}] Request processed for /api/articles in ${metrics[1].value}ms.`;
            setLogs(prev => [newLog, ...prev.slice(0, MAX_LOG_COUNT - 1)]);

            // Simulate critical error log (rare)
            if (Math.random() > 0.95) {
                const criticalLog = `[${new Date().toLocaleTimeString('en-US')}] [CRIT] CloudBees deployment unit unresponsive.`;
                setLogs(prev => [criticalLog, ...prev.slice(0, MAX_LOG_COUNT - 1)]);
            }

        }, SIMULATION_INTERVAL);

        return () => clearInterval(interval);
    }, [isSimulationActive, metrics]); 

    // Alert Logic (Toast Notifications)
    useEffect(() => {
        metrics.forEach(m => {
            const isAlert = m.severity === 'high' ? m.value > m.threshold : m.value < m.threshold;

            if (isAlert) {
                toast.error(`⚠️ Alert: ${m.name} (${m.value}${m.unit}) is outside the safe threshold (${m.threshold}${m.unit}).`, {
                    duration: 5000,
                    icon: <Bell className={currentColors.primary} size={24} />,
                });
            }
        });
    }, [metrics]);

    // Advanced Log Filtering
    const filteredLogs = useMemo(() => {
        let currentLogs = logs;

        // 1. Filter by text search
        if (logSearchTerm) {
            const lowerCaseTerm = logSearchTerm.toLowerCase();
            currentLogs = currentLogs.filter(log => log.toLowerCase().includes(lowerCaseTerm));
        }

        // 2. Filter by severity level
        if (logSeverityFilter !== 'ALL') {
            const severityTag = `[${logSeverityFilter}]`;
            currentLogs = currentLogs.filter(log => log.includes(severityTag));
        }

        return currentLogs;
    }, [logs, logSearchTerm, logSeverityFilter]);
    
    // Helper for severity button colors
    const getSeverityColor = (severity: LogSeverity) => {
        switch (severity) {
            case 'CRIT': return 'bg-red-600 hover:bg-red-700';
            case 'ERROR': return 'bg-red-500 hover:bg-red-600';
            case 'WARN': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'INFO': return 'bg-green-500 hover:bg-green-600';
            case 'ALL': return 'bg-gray-500 hover:bg-gray-600';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };


    // --- COMPONENT RENDER ---
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{
                visible: {
                    transition: {
                        staggerChildren: 0.1,
                        when: "beforeChildren"
                    }
                }
            }}
            // Dynamic Theme
            className={`p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-shadow duration-500`}
            style={{ boxShadow: `0 0 30px ${currentColors.shadow}` }}
        >
            {/* Title and Controls */}
            <motion.div variants={sectionVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center mb-4 sm:mb-0">
                    <AlertTriangle size={32} className={`mr-3 ${currentColors.primary}`} />APM Performances
                </h1>

                <div className="flex space-x-4 items-center">
                    {/* Global Health Indicator */}
                    <div className="flex items-center space-x-2 text-lg font-bold">
                        <Gauge size={24} className={currentColors.primary} />
                        <span className={`dark:text-white ${currentColors.primary}`}>
                            Health: {systemHealth}
                        </span>
                    </div>

                    {/* Simulation Toggle */}
                    <button
                        onClick={() => setIsSimulationActive(prev => !prev)}
                        className={`flex items-center px-3 py-1.5 rounded-lg font-semibold transition duration-150 ${isSimulationActive ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'}`}
                        title={isSimulationActive ? "Simulation Active" : "Simulation Stopped"}
                    >
                        {isSimulationActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        <span className="ml-2 hidden sm:inline">{isSimulationActive ? 'Sim. ON' : 'Sim. OFF'}</span>
                    </button>

                    {/* Compact / Extended Mode Toggle */}
                    <button
                        onClick={() => setIsCompactMode(prev => !prev)}
                        className="flex items-center px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition duration-150"
                    >
                        {isCompactMode ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                        <span className="ml-2 hidden sm:inline">{isCompactMode ? 'Extended View' : 'Compact View'}</span>
                    </button>
                </div>
            </motion.div>

            {/* Metrics Section (Staggered Cards) */}
            <motion.div variants={sectionVariants} className="mb-10">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    System & Cloud Metrics
                </h2>
                <motion.div
                    variants={{
                        visible: { transition: { staggerChildren: 0.1 } }
                    }}
                    className={`grid gap-6 ${isCompactMode ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'}`}
                >
                    {metrics.map((metric, index) => {
                        const isCritical = metric.severity === 'high' ? metric.value > metric.threshold : metric.value < metric.threshold;
                        const cardBg = isCritical ? 'bg-red-50 border-2 border-red-500 dark:bg-red-950/50' : 'bg-white dark:bg-gray-800';

                        return (
                            <motion.div
                                key={metric.name}
                                custom={index}
                                variants={cardVariants}
                                whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)" }}
                                className={`rounded-xl shadow-lg p-4 flex flex-col justify-between transition-all duration-300 ${cardBg}`}
                            >
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                                        {React.cloneElement(
                                            metric.icon as React.ReactElement<React.HTMLAttributes<HTMLElement>>,
                                            {
                                                className: isCritical ? 'text-red-500' : currentColors.primary
                                            }
                                        )}
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {metric.name}
                                    </h3>
                                </div>
                                <p className={`text-3xl font-extrabold mt-1 ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {metric.value}
                                    <span className="text-sm ml-1 font-medium">{metric.unit}</span>
                                </p>
                                {/* Sparkline Graphs */}
                                {!isCompactMode && (
                                    <Sparkline history={metric.history} isCritical={isCritical} />
                                )}
                            </motion.div>
                        );
                    })}
                </motion.div>
            </motion.div>

            {/* Log Filtering and Search Section */}
            <motion.div variants={sectionVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                    Recent Logs (CloudWatch Simulation)
                </h2>
                
                {/* Log Filter Controls */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
                    <div className="relative flex-grow">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter logs (e.g., DB, 1.2s)..."
                            value={logSearchTerm}
                            onChange={(e) => setLogSearchTerm(e.target.value)}
                            className="w-full py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>
                    
                    <div className="flex space-x-2">
                        {(['ALL', 'CRIT', 'ERROR', 'WARN', 'INFO'] as LogSeverity[]).map(severity => (
                            <button
                                key={severity}
                                onClick={() => setLogSeverityFilter(severity)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition duration-150 ${getSeverityColor(severity)} ${logSeverityFilter === severity ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                            >
                                {severity}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <AnimatePresence initial={false}>
                        {filteredLogs.map((log) => (
                            // Use the index of the original log for a stable key if necessary, or simply use `log` if its content is unique enough
                            <LogLine key={logs.indexOf(log)} log={log} /> 
                        ))}
                    </AnimatePresence>
                    {filteredLogs.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400">No logs match your search and filter criteria.</p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MetricsPage;