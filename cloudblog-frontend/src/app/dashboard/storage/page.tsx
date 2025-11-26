"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { HardDrive, Cloud, Server, Loader, AlertTriangle, ShieldCheck, Zap, TrendingUp, Cpu, RefreshCw, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

// --- INTERFACES & TYPES ---

interface Metric {
    name: string;
    value: number;
    unit: string;
    icon: React.ReactNode;
    threshold: number;
    severity: 'low' | 'high';
    history: number[];
}

interface CdnEdge {
    location: string;
    cacheHitRate: number;
    edgeLatency: number;
    requestsPerSecond: number;
    health: 'Good' | 'Warning' | 'Critical';
}

type SystemHealth = 'Healthy' | 'Warning' | 'Critical';

// --- CONFIGURATION ---
const HISTORY_SIZE = 15;
const SIMULATION_INTERVAL = 4000; // 4 seconds

// --- ANIMATION VARIANTS (Reused from previous) ---
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

const getHealthColors = (health: SystemHealth) => {
    switch (health) {
        case 'Healthy': return { primary: 'text-green-500', bg: 'bg-green-500', shadow: 'shadow-green-500/30', border: 'border-green-500' };
        case 'Warning': return { primary: 'text-yellow-500', bg: 'bg-yellow-500', shadow: 'shadow-yellow-500/30', border: 'border-yellow-500' };
        case 'Critical': return { primary: 'text-red-500', bg: 'bg-red-500', shadow: 'shadow-red-500/30', border: 'border-red-500' };
        default: return { primary: 'text-gray-500', bg: 'bg-gray-500', shadow: 'shadow-gray-500/30', border: 'border-gray-500' };
    }
};

// Sparkline Component
const Sparkline = ({ history, chartColor }: { history: number[], chartColor: string }) => {
    const data = history.map((value, index) => ({
        time: HISTORY_SIZE - 1 - index,
        value: value,
    })).reverse(); 

    const allValues = history.slice(0, history.length);
    const yMin = Math.min(...allValues) * 0.9;
    const yMax = Math.max(...allValues) * 1.1;

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
                    
                    <YAxis 
                        hide 
                        type="number" 
                        domain={[yMin, yMax]} 
                        axisLine={false} 
                        tickLine={false}
                    />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '5px' }} />

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

// CDN EDGE DETAIL COMPONENT
const CdnEdgeDetail = ({ edge }: { edge: CdnEdge }) => {
    let colorClass;
    let icon;

    switch (edge.health) {
        case 'Good':
            colorClass = 'text-green-500 border-green-500';
            icon = <ShieldCheck size={20} />;
            break;
        case 'Warning':
            colorClass = 'text-yellow-500 border-yellow-500';
            icon = <AlertTriangle size={20} />;
            break;
        case 'Critical':
            colorClass = 'text-red-500 border-red-500';
            icon = <XCircle size={20} />;
            break;
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className={`p-4 rounded-xl border-l-4 shadow-sm bg-white dark:bg-gray-800 transition-shadow duration-300 ${colorClass}`}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    {icon}
                    <span className="ml-2">{edge.location}</span>
                </h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${edge.health === 'Good' ? 'bg-green-100 text-green-800' : edge.health === 'Warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {edge.health}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Cache Hit Rate</p>
                    <p className={`font-extrabold ${edge.cacheHitRate < 80 ? 'text-red-600' : 'text-blue-600'}`}>
                        {edge.cacheHitRate.toFixed(1)}%
                    </p>
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400">Edge Latency</p>
                    <p className={`font-extrabold ${edge.edgeLatency > 150 ? 'text-red-600' : 'text-blue-600'}`}>
                        {edge.edgeLatency.toFixed(0)} ms
                    </p>
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400">RPS</p>
                    <p className="font-extrabold text-gray-900 dark:text-white">
                        {edge.requestsPerSecond.toFixed(0)}
                    </p>
                </div>
            </div>
        </motion.div>
    );
};


// --- MAIN COMPONENT: StorageCdnPage devient Page ---

const StorageCdnPage = () => {
    const [isSimulationActive, setIsSimulationActive] = useState(true);
    const [isCdnVisible, setIsCdnVisible] = useState(true);

    const initialMetrics: Metric[] = [
        { name: "Storage Used", value: 75.2, unit: "TB", icon: <HardDrive size={24} />, threshold: 90, severity: 'high', history: Array(HISTORY_SIZE).fill(75.2) },
        { name: "Database Throughput", value: 4500, unit: "IOPS", icon: <Loader size={24} />, threshold: 6000, severity: 'high', history: Array(HISTORY_SIZE).fill(4500) },
        { name: "Global Cache Hit Rate", value: 98.1, unit: "%", icon: <Cloud size={24} />, threshold: 95, severity: 'low', history: Array(HISTORY_SIZE).fill(98.1) },
        { name: "Global Edge Latency", value: 85, unit: "ms", icon: <Zap size={24} />, threshold: 150, severity: 'high', history: Array(HISTORY_SIZE).fill(85) },
    ];

    const initialEdges: CdnEdge[] = [
        { location: "CDN North America", cacheHitRate: 99.5, edgeLatency: 50, requestsPerSecond: 1200, health: 'Good' },
        { location: "CDN Europe West", cacheHitRate: 96.0, edgeLatency: 80, requestsPerSecond: 850, health: 'Good' },
        { location: "CDN Asia Pacific", cacheHitRate: 85.0, edgeLatency: 180, requestsPerSecond: 400, health: 'Warning' },
    ];

    const [metrics, setMetrics] = useState<Metric[]>(initialMetrics);
    const [cdnEdges, setCdnEdges] = useState<CdnEdge[]>(initialEdges);


    // --- Global Health Calculation ---
    const systemHealth: SystemHealth = useMemo(() => {
        const isMetricCritical = metrics.some(m => m.severity === 'high' ? m.value > m.threshold : m.value < m.threshold);
        const isEdgeCritical = cdnEdges.some(e => e.health === 'Critical');
        const isEdgeWarning = cdnEdges.some(e => e.health === 'Warning');

        if (isEdgeCritical) return 'Critical';
        if (isMetricCritical) return 'Warning';
        if (isEdgeWarning) return 'Warning';
        return 'Healthy';
    }, [metrics, cdnEdges]);

    const currentColors = getHealthColors(systemHealth);


    // --- Simulation Effect ---
    useEffect(() => {
        if (!isSimulationActive) return;

        const interval = setInterval(() => {
            setMetrics(prevMetrics =>
                prevMetrics.map((m) => {
                    let change = (Math.random() * 5 - 2.5) * (m.unit === "ms" ? 5 : m.unit === "%" ? 0.5 : 100);
                    let newValue = m.value + change;

                    if (m.name === "Storage Used") {
                        newValue = Math.min(100, Math.max(70, newValue));
                    }
                    if (m.name === "Global Cache Hit Rate") {
                        if (Math.random() > 0.9) {
                            newValue = Math.max(80, m.value - 5 - Math.random() * 10);
                           // LIGNE CORRIGÉE : Utilisation de toast() avec une icône d'alerte.
                            toast(`⚠️ Cache Miss Peak: ${m.name} dropped to ${newValue.toFixed(1)}%.`, { 
                                duration: 3000, 
                                icon: '⚠️', // Utilisation de l'icône d'avertissement native
                                style: { background: '#fffbe6', color: '#857500', border: '1px solid #ffcc00' } // Style jaune/orange pour l'avertissement
                            });
                        } else {
                            newValue = Math.min(99.9, Math.max(90, newValue));
                        }
                    }

                    const newHistory = [newValue, ...m.history.slice(0, HISTORY_SIZE - 1)];

                    return { ...m, value: newValue, history: newHistory };
                })
            );

            setCdnEdges(prevEdges => prevEdges.map(edge => {
                let newHitRate = edge.cacheHitRate + (Math.random() * 0.4 - 0.2);
                let newLatency = edge.edgeLatency + (Math.random() * 20 - 10);
                let newRPS = Math.max(100, edge.requestsPerSecond + (Math.random() * 50 - 25));

                // Constrain values
                newHitRate = Math.min(99.9, Math.max(70, newHitRate));
                newLatency = Math.min(500, Math.max(30, newLatency));

                let newHealth: 'Good' | 'Warning' | 'Critical' = 'Good';

                if (newHitRate < 85 || newLatency > 150) {
                    newHealth = 'Warning';
                }
                if (newHitRate < 75 || newLatency > 300) {
                    newHealth = 'Critical';
                    if (edge.health !== 'Critical') {
                        toast.error(`🔥 CRITICAL: ${edge.location} Edge Failure. Latency: ${newLatency.toFixed(0)}ms`, { duration: 5000 });
                    }
                }
                
                return { ...edge, cacheHitRate: newHitRate, edgeLatency: newLatency, requestsPerSecond: newRPS, health: newHealth };
            }));

        }, SIMULATION_INTERVAL);

        return () => clearInterval(interval);
    }, [isSimulationActive]); 


    // --- RENDERING ---

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1, when: "beforeChildren" } } }}
            className={`p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-shadow duration-500`}
            style={{ boxShadow: `0 0 30px ${currentColors.shadow}` }}
        >
            {/* Title and Controls */}
            <motion.div variants={sectionVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center mb-4 sm:mb-0">
                    <HardDrive size={32} className={`mr-3 ${currentColors.primary}`} />Storage & CDN
                </h1>

                <div className="flex space-x-4 items-center">
                    <div className="flex items-center space-x-2 text-lg font-bold">
                        <Cpu size={24} className={currentColors.primary} />
                        <span className={`dark:text-white ${currentColors.primary}`}>
                            Global Status: {systemHealth}
                        </span>
                    </div>

                    <button
                        onClick={() => setIsSimulationActive(prev => !prev)}
                        className={`flex items-center px-3 py-1.5 rounded-lg font-semibold transition duration-150 ${isSimulationActive ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white'}`}
                        title={isSimulationActive ? "Simulation Active" : "Simulation Stopped"}
                    >
                        <RefreshCw size={20} className="mr-1" />
                        {isSimulationActive ? 'Sim. ON' : 'Sim. OFF'}
                    </button>
                </div>
            </motion.div>

            {/* Metrics Section: Storage & Global CDN */}
            <motion.div variants={sectionVariants} className="mb-10">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Core Metrics (Storage & Global CDN)
                </h2>
                <motion.div
                    variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                    className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {metrics.map((metric, index) => {
                        // Check if alert threshold is crossed
                        const isCritical = metric.severity === 'high' ? metric.value > metric.threshold : metric.value < metric.threshold;
                        const cardBg = isCritical ? 'bg-red-50 border-2 border-red-500 dark:bg-red-950/50' : 'bg-white dark:bg-gray-800';
                        const chartColor = isCritical ? '#ef4444' : '#3b82f6';

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
                                            { className: isCritical ? 'text-red-500' : currentColors.primary }
                                        )}
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {metric.name}
                                    </h3>
                                </div>
                                <p className={`text-3xl font-extrabold mt-1 ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                    {metric.value.toFixed(metric.unit === '%' || metric.unit === 'TB' ? 1 : 0)}
                                    <span className="text-sm ml-1 font-medium">{metric.unit}</span>
                                </p>
                                <Sparkline history={metric.history} chartColor={chartColor} />
                            </motion.div>
                        );
                    })}
                </motion.div>
            </motion.div>

            {/* CDN Edge Locations Section */}
            <motion.div variants={sectionVariants} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                        <Server size={24} className="mr-2" /> CDN Edge Locations Status
                    </h2>
                    <button
                        onClick={() => setIsCdnVisible(prev => !prev)}
                        className="text-blue-500 hover:text-blue-600 text-sm font-semibold flex items-center"
                    >
                        {isCdnVisible ? 'Hide Details' : 'Show Details'}
                        <TrendingUp size={16} className="ml-1" />
                    </button>
                </div>
                
                <AnimatePresence>
                    {isCdnVisible && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="grid gap-4 lg:grid-cols-3 md:grid-cols-2 overflow-hidden"
                        >
                            {cdnEdges.map((edge) => (
                                <CdnEdgeDetail key={edge.location} edge={edge} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

        </motion.div>
    );
};

export default StorageCdnPage;