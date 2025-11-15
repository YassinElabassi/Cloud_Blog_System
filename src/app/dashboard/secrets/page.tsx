"use client";
import React, { useState, useMemo } from "react";
import { Plus, X, Eye, EyeOff, Key, Clock, AlertTriangle, Trash2, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// --- INTERFACES ---

interface Secret {
    id: number;
    name: string;
    value: string; // The actual value (masked in the UI)
    expiryDate: Date | null;
}

// --- LOGIC HELPER ---

const maskSecret = (value: string): string => "•".repeat(12);

// --- MAIN COMPONENT ---

const SecretsPage = () => {
    // State for the list of secrets
    const [secrets, setSecrets] = useState<Secret[]>([
        { id: 1, name: "API_KEY_MAPS", value: "sk_live_map123xyz", expiryDate: new Date(Date.now() + 86400000 * 30) }, // 30 days
        { id: 2, name: "STRIPE_SECRET", value: "sk_live_stripe987abc", expiryDate: new Date(Date.now() + 86400000 * 7) }, // 7 days (soon to expire)
        { id: 3, name: "DB_PASSWORD", value: "SuperSecurePwd!456", expiryDate: null }, // Never expires
    ]);

    // States for adding a new secret
    const [newSecret, setNewSecret] = useState({ name: "", value: "", expiryDays: "" });

    // State for showing/hiding values
    const [visibleSecrets, setVisibleSecrets] = useState<number[]>([]);

    // Function to add a secret
    const handleAddSecret = () => {
        if (!newSecret.name || !newSecret.value) {
            toast.error("Please fill in both the secret name and value.");
            return;
        }

        const expiryDate = newSecret.expiryDays 
            ? new Date(Date.now() + parseInt(newSecret.expiryDays) * 86400000)
            : null;

        setSecrets((prev) => [
            ...prev,
            { id: Date.now(), name: newSecret.name, value: newSecret.value, expiryDate: expiryDate },
        ]);
        
        toast.success(`Secret '${newSecret.name}' added successfully!`);
        setNewSecret({ name: "", value: "", expiryDays: "" });
    };

    // Function to handle deletion with confirmation
    const handleDelete = (id: number, name: string) => {
        // --- ADDED CONFIRMATION DIALOG ---
        if (window.confirm(`Are you sure you want to delete the secret: ${name}? This action cannot be undone.`)) {
            setSecrets((prev) => prev.filter((s) => s.id !== id));
            toast.error(`Secret '${name}' deleted.`);
        }
    };

    // Function to toggle visibility
    const toggleVisibility = (id: number) => {
        setVisibleSecrets(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // --- RENDERING HELPERS ---

    const getExpirationStatus = (date: Date | null) => {
        if (date === null) {
            return { text: "Never", color: "text-green-500", icon: <Key size={16} /> };
        }
        const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 3600 * 24));
        
        if (diffDays <= 0) {
            return { text: "EXPIRED", color: "text-red-500", icon: <AlertTriangle size={16} /> };
        } else if (diffDays < 10) {
            return { text: `Expires in ${diffDays} days`, color: "text-yellow-500", icon: <Clock size={16} /> };
        } else {
            return { text: `Expires in ${diffDays} days`, color: "text-gray-500", icon: <Clock size={16} /> };
        }
    };
    
    const handleCopy = (value: string, name: string) => {
        navigator.clipboard.writeText(value);
        // --- ADDED TOAST NOTIFICATION FOR COPY ---
        // Correct: Utilise des backticks (`) pour l'interpolation de variables
        toast.success(`Code copied to clipboard: ${name}`);
    };

    return (
        <div className="p-4 sm:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <h1 className="text-3xl font-extrabold mb-8 text-gray-900 dark:text-white flex items-center">
                <Key size={32} className="mr-3 text-blue-500" />Secrets Management
            </h1>

            {/* Add Secret Form */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 mb-10 border border-blue-200 dark:border-blue-800/50"
            >
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                    <Plus size={20} className="mr-2 text-blue-500" /> Add New Secret
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Secret Name (e.g., AWS_BUCKET_KEY)"
                        value={newSecret.name}
                        onChange={(e) => setNewSecret({ ...newSecret, name: e.target.value })}
                        className="col-span-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition duration-150"
                    />
                    <input
                        type="password"
                        placeholder="Secret Value"
                        value={newSecret.value}
                        onChange={(e) => setNewSecret({ ...newSecret, value: e.target.value })}
                        className="col-span-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition duration-150"
                    />
                    <div className="relative col-span-1">
                        <input
                            type="number"
                            placeholder="Expiry Days (optional)"
                            value={newSecret.expiryDays}
                            onChange={(e) => setNewSecret({ ...newSecret, expiryDays: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 transition duration-150"
                            min="1"
                        />
                        {newSecret.expiryDays && <span className="absolute right-3 top-3.5 text-sm text-gray-500 dark:text-gray-400">days</span>}
                    </div>

                    <button
                        onClick={handleAddSecret}
                        disabled={!newSecret.name || !newSecret.value}
                        className="col-span-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        <Plus size={20} className="mr-2" />
                        Add Secret
                    </button>
                </div>
            </motion.div>

            {/* Secrets List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Secret Name</th>
                            <th scope="col" className="px-6 py-3">Value</th>
                            <th scope="col" className="px-6 py-3">Status/Expiration</th>
                            <th scope="col" className="px-6 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <AnimatePresence initial={false}>
                        <tbody>
                            {secrets.map((secret) => {
                                const isVisible = visibleSecrets.includes(secret.id);
                                const status = getExpirationStatus(secret.expiryDate);
                                
                                return (
                                    <motion.tr 
                                        key={secret.id} 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {secret.name}
                                        </th>
                                        <td className="px-6 py-4 font-mono text-gray-700 dark:text-gray-200">
                                            {isVisible ? secret.value : maskSecret(secret.value)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`flex items-center font-semibold ${status.color}`}>
                                                {status.icon}
                                                <span className="ml-1">{status.text}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center space-x-2">
                                                {/* Toggle Visibility Button */}
                                                <button
                                                    onClick={() => toggleVisibility(secret.id)}
                                                    title={isVisible ? "Hide" : "Show"}
                                                    className="p-2 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                                                >
                                                    {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                                
                                                {/* Copy Button */}
                                                <button
                                                    onClick={() => handleCopy(secret.value, secret.name)}
                                                    title="Copy Value"
                                                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                                    
                                                >
                                                    <Copy size={18} />
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDelete(secret.id, secret.name)}
                                                    title="Delete Secret"
                                                    className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </AnimatePresence>
                </table>
                
                {secrets.length === 0 && (
                    <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                        No secrets registered. Add one to start!
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecretsPage;