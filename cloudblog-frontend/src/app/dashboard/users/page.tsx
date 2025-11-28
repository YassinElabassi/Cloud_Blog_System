"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Search, Filter, Trash2, ToggleRight, Eye, Users, UserCheck, UserX, ChevronLeft, ChevronRight, X, Edit, PlusCircle, Save } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Image from 'next/image';

import { fetchWithAuth } from "@/lib/api";


// --- TYPES (Matching the API) ---
interface User {
    id: number;
    name: string;
    email: string;
    status: "Active" | "Inactive";
    image?: string;
    designation: string;
    registrationDate: string;
    lastLogin: string;
    role: "Admin" | "User";
    password?: string;
}

type ApiUser = {
    id: number; name: string; email: string; status: "Active" | "Inactive";
    image?: string; designation: string | null; created_at: string;
    derniere_connexion: string | null; role: "Admin" | "User";
};

type UserFormData = Omit<User, 'registrationDate' | 'lastLogin'> & { id?: number };


// --- CONFIGURATION ---
const USERS_PER_PAGE = 8;
const defaultNewUser: User = { id: 0, name: '', email: '', status: 'Active', image: '', designation: '', registrationDate: '', lastLogin: '', role: 'User', password: '' };

// --- ANIMATION VARIANTS ---
const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 12 } },
    exit: { opacity: 0, height: 0, padding: 0, margin: 0, transition: { duration: 0.3 } },
    hover: { scale: 1.02, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.05)" },
};

const sectionVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

// --- SUB-COMPONENTS ---

const DetailRow = ({ label, value, color = 'text-gray-900 dark:text-white' }: { label: string, value: string, color?: string }) => (
    <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`font-medium ${color}`}>{value}</span>
    </div>
);

const UserAvatar = ({ user, size = 'small' }: { user: User, size?: 'small' | 'large' }) => {
    const avatarSizeClass = size === 'large' ? 'w-12 h-12 text-xl' : 'w-10 h-10 text-lg';
    return (
        <div className={`flex-shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-4 ${avatarSizeClass}`}>
            {user.image ? <Image 
                src={user.image} 
                alt={user.name}
                width={40}
                height={40}
                className="rounded-full"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { 
                    e.currentTarget.onerror = null; 
                    e.currentTarget.src = 'https://placehold.co/100x100/A855F7/ffffff?text=U'; 
                }}
            /> : (user.name ? user.name[0] : 'U')}
        </div>
    );
};

const UserDetailModal = ({ user, onClose }: { user: User; onClose: () => void }) => (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-red-500" title="Close"><X size={20} /></button>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Details</h3>
            <div className="flex items-center space-x-4 border-b dark:border-gray-700 pb-4 mb-4">
                <UserAvatar user={user} size="large" />
                <div>
                    <p className="font-semibold text-lg dark:text-white">{user.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
            </div>
            <div className="space-y-3 text-sm">
                <DetailRow label="Role" value={user.role} />
                <DetailRow label="Designation" value={user.designation} />
                <DetailRow label="Status" value={user.status === "Active" ? "Active" : "Inactive"} color={user.status === "Active" ? "text-green-500" : "text-red-500"} />
                <DetailRow label="Registration Date" value={user.registrationDate} />
                <DetailRow label="Last Login" value={user.lastLogin} />
            </div>
        </motion.div>
    </div>
);

const UserCard = ({ user, handleToggleStatus, handleDelete, onViewDetails, onEdit }: { user: User; handleToggleStatus: (user: User) => void; handleDelete: (user: User) => void; onViewDetails: (user: User) => void; onEdit: (user: User) => void; }) => {
    const isActive = user.status === "Active";
    return (
        <motion.div variants={cardVariants} whileHover="hover" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 flex flex-col justify-between border-t-4 border-primary/50 dark:border-t-primary/70">
            <div className="flex items-start mb-4">
                <UserAvatar user={user} size="small" />
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate dark:text-white">{user.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    <p className="text-xs font-semibold text-primary/70 mt-1">{user.designation}</p>
                </div>
                <span className={`ml-3 px-3 py-1 text-xs font-semibold rounded-full text-white ${isActive ? "bg-green-500" : "bg-red-500"}`}>{isActive ? "Active" : "Inactive"}</span>
            </div>
            <div className="flex justify-around items-center space-x-2 border-t dark:border-gray-700 pt-4">
                <button onClick={() => onViewDetails(user)} title="View Details" className="p-2 text-primary hover:bg-primary/10 rounded-full transition"><Eye size={20} /></button>
                <button onClick={() => onEdit(user)} title="Edit User" className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-full transition"><Edit size={20} /></button>
                <button onClick={() => handleToggleStatus(user)} title={isActive ? "Deactivate" : "Activate"} className={`p-2 rounded-full text-white transition ${isActive ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"}`}><ToggleRight size={20} /></button>
                <button onClick={() => handleDelete(user)} title="Delete User" className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition"><Trash2 size={20} /></button>
            </div>
        </motion.div>
    );
};

const UserFormModal = ({ user, onClose, onSave }: { user: User | null; onClose: () => void; onSave: (user: UserFormData) => void; }) => {
    const isEditing = !!user && user.id !== 0;
    const initialData: UserFormData = user ? { ...user } : defaultNewUser;

    if (isEditing) {
        delete initialData.password; // Do not pre-fill password in edit mode
    }

    const [formData, setFormData] = useState<UserFormData>(initialData);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isEditing && !formData.password) {
            toast.error("Password is required for new users.");
            return;
        }

        const payloadToSend = { ...formData };
        if (isEditing && !payloadToSend.password) {
            delete payloadToSend.password;
        }

        onSave(payloadToSend);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"> 
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg p-6 relative"> 
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-red-500" title="Close"><X size={20} /></button> 
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{isEditing ? "Edit User" : "Add New User"}</h3> 
                <form onSubmit={handleSubmit} className="space-y-4"> 
                    <FormInput label="Full Name" name="name" value={formData.name} onChange={handleChange} required /> 
                    <FormInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required /> 
                    <FormInput label="Designation" name="designation" value={formData.designation} onChange={handleChange} /> 
                    <FormInput 
                        label={isEditing ? "New Password (Optional)" : "Password"} 
                        name="password" 
                        type="password" 
                        value={formData.password || ''} 
                        onChange={handleChange} 
                        required={!isEditing} 
                    /> 
                    <FormSelect label="Role" name="role" value={formData.role} onChange={handleChange} options={["User", "Admin"]} /> 
                    <FormSelect label="Status" name="status" value={formData.status} onChange={handleChange} options={["Active", "Inactive"]} /> 
                    <button type="submit" className="w-full py-3 mt-6 flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition"><Save size={20} className="mr-2" />{isEditing ? "Save Changes" : "Create User"}</button> 
                </form> 
            </motion.div> 
        </div>
    );
};

const FormInput = ({ label, name, value, onChange, type = 'text', required = false }: any) => (<div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label><input type={type} name={name} value={value || ''} onChange={onChange} required={required} className="w-full py-2 px-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-lg focus:ring-primary focus:border-primary transition" /></div>);
const FormSelect = ({ label, name, value, onChange, options }: any) => (<div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label><select name={name} value={value} onChange={onChange} className="w-full py-2 px-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-lg focus:ring-primary focus:border-primary transition appearance-none">{options.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}</select></div>);
const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: number, color: string }) => (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 flex items-center space-x-4 border-l-4 border-primary"><div className={`p-3 rounded-full ${color}/10 ${color}`}>{icon}</div><div><p className="text-sm text-gray-500 dark:text-gray-400">{title}</p><p className="text-2xl font-extrabold dark:text-white">{value}</p></div></motion.div>);


// --- Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, confirmColor }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void, confirmText: string, confirmColor: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6 relative text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={onCancel} className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition">Cancel</button>
                    <button onClick={onConfirm} className={`flex-1 py-2 px-4 text-white font-semibold rounded-lg transition bg-${confirmColor}-500 hover:bg-${confirmColor}-600`}>{confirmText}</button>
                </div>
            </motion.div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
const UsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [activeUsers, setActiveUsers] = useState(0);
    const [inactiveUsers, setInactiveUsers] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    
    // State for confirmation modals
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);


    // Fetch users logic
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: String(currentPage), per_page: String(USERS_PER_PAGE) });
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter !== "All") params.append('status', statusFilter);
            
            const data = await fetchWithAuth(`users?${params.toString()}`);
            
            // Handle case where data might be null (e.g., if API returns 204 unexpectedly on GET, though unlikely)
            if (data && data.users) {
                const formattedUsers = data.users.map((user: ApiUser): User => ({
                    id: user.id, name: user.name, email: user.email, status: user.status, image: user.image,
                    designation: user.designation || '', role: user.role,
                    registrationDate: new Date(user.created_at).toLocaleDateString('en-US'),
                    lastLogin: user.derniere_connexion ? new Date(user.derniere_connexion).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never',
                }));
                
                setUsers(formattedUsers);
                setTotalPages(data.last_page);
                setTotalUsers(data.stats.total_users);
                setActiveUsers(data.stats.active_users);
                setInactiveUsers(data.stats.inactive_users);
            } else {
                setUsers([]);
                setTotalPages(0);
                setTotalUsers(0);
                setActiveUsers(0);
                setInactiveUsers(0);
            }
        } catch (err: any) {
            console.error("Fetch Error:", err);
            setError(err.message || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, statusFilter]);

    useEffect(() => {
        const handler = setTimeout(() => fetchUsers(), 300);
        return () => clearTimeout(handler);
    }, [fetchUsers]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);


    // Opens the status change confirmation modal
    const handleToggleStatus = (user: User) => {
        setUserToToggleStatus(user);
    };

    // Executes the status change after confirmation
    const confirmToggleStatus = async () => {
        const user = userToToggleStatus;
        if (!user) return;

        setUserToToggleStatus(null); // Close modal

        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        const action = newStatus === 'Active' ? 'activated' : 'deactivated';
        
        // Optimistic update for quick feedback
        const originalStatus = user.status;
        setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? { ...u, status: newStatus } : u));

        try {
            await fetchWithAuth(`users/${user.id}/status`, { 
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            toast.success(`User ${user.name} successfully ${action}.`);
            // RE-FETCH to synchronize and update stats
            fetchUsers();
        } catch (err: any) {
            // On failure, revert the optimistic change
            setUsers(prevUsers => prevUsers.map(u => u.id === user.id ? { ...u, status: originalStatus } : u));
            toast.error(`Failed to update status for ${user.name}: ${err.message}.`);
            // In case of error, a full re-fetch ensures synchronization
            fetchUsers(); 
        }
    };


    // Opens the delete confirmation modal
    const handleDelete = (user: User) => {
        setUserToDelete(user);
    };

    // Executes the deletion after confirmation
    const confirmDelete = async () => {
        const user = userToDelete;
        if (!user) return;
        
        setUserToDelete(null); // Close modal

        // Optimistic UI removal
        const originalUsers = users;
        setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id));

        try {
            // This API call now correctly handles 204 No Content response
            await fetchWithAuth(`users/${user.id}`, { method: 'DELETE' }); 
            
            // FIX 2: Success message and full re-fetch to ensure the front-end list and statistics are fully synchronized and up-to-date.
            toast.success(`User ${user.name} successfully deleted.`);
            fetchUsers(); // Re-fetch data to synchronize list and totals
        } catch (err: any) {
            toast.error(`Failed to delete ${user.name}: ${err.message}.`);
            // On failure, restore the original state and refresh the list
            setUsers(originalUsers); 
            fetchUsers();
        }
    };


    const handleSaveUser = async (data: UserFormData) => {
        const isEditing = !!data.id && data.id !== 0;
        const endpoint = isEditing ? `users/${data.id}` : 'users';
        const method = isEditing ? 'PUT' : 'POST';
        const successMessage = `User ${data.name} successfully ${isEditing ? 'updated' : 'created'}.`;
        const errorMessage = `Failed to ${isEditing ? 'update' : 'create'} user.`;
        
        const payload = { ...data };
        if (isEditing && !payload.password) {
            delete payload.password;
        }

        try {
            await fetchWithAuth(endpoint, { method, body: JSON.stringify(payload) });
            toast.success(successMessage);
            setUserToEdit(null);
            // RE-FETCH data after success
            fetchUsers();
        } catch (err: any) {
            toast.error(`${errorMessage}: ${err.message}`);
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

   
    return (
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="p-4 sm:p-8 min-h-screen bg-gray-50 dark:bg-gray-900 font-inter">
            <motion.div variants={sectionVariants} className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center"><Users size={28} className="mr-3 text-primary" /> User Management</h1>
                <button onClick={() => setUserToEdit(defaultNewUser)} className="flex items-center mt-4 sm:mt-0 px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-md transition transform hover:scale-[1.02] active:scale-[0.98]"><PlusCircle size={20} className="mr-2" /> Add User</button>
            </motion.div>

            <motion.div variants={sectionVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard icon={<UserCheck size={24} />} title="Active Users" value={activeUsers} color="text-green-500" />
                <StatCard icon={<UserX size={24} />} title="Inactive Users" value={inactiveUsers} color="text-red-500" />
                <StatCard icon={<Users size={24} />} title="Total Users" value={totalUsers} color="text-primary" />
            </motion.div>

            <motion.div variants={sectionVariants} className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <div className="relative flex-1"><Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search by name, email, or designation..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-lg focus:ring-primary focus:border-primary transition" /></div>
                <div className="relative"><Filter size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "All" | "Active" | "Inactive")} className="w-full md:w-48 appearance-none py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-lg focus:ring-primary focus:border-primary transition">
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select></div>
            </motion.div>

            <motion.section variants={sectionVariants} className="min-h-[400px]">
                {loading ? <div className="text-center p-10 dark:text-white">
                    <svg className="animate-spin h-8 w-8 text-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="mt-2 text-primary/70">Loading users...</p>
                </div>
                : error ? <div className="text-center p-10 text-red-500">Error: {error}</div>
                : users.length > 0 ? (
                    <motion.div variants={{ visible: { transition: { staggerChildren: 0.08 } } }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {users.map(user => <UserCard key={user.id} user={user} handleToggleStatus={handleToggleStatus} handleDelete={handleDelete} onViewDetails={setSelectedUser} onEdit={setUserToEdit} />)}
                    </motion.div>
                ) : <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg"><p className="text-lg text-gray-500 dark:text-gray-400">No users found matching these criteria.</p></div>}
            </motion.section>

            <motion.div variants={sectionVariants} className="mt-8 flex flex-col sm:flex-row justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">Showing {users.length} of {totalUsers} users</p>
                <div className="flex items-center space-x-2">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 border dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Previous Page"><ChevronLeft size={20} /></button>
                    <span className="text-sm font-semibold dark:text-white">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border dark:border-gray-700 rounded-lg disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="Next Page"><ChevronRight size={20} /></button>
                </div>
            </motion.div>

            {/* Modals for view, edit, and create */}
            <AnimatePresence>{selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}</AnimatePresence>
            <AnimatePresence>{userToEdit && <UserFormModal user={userToEdit} onClose={() => setUserToEdit(null)} onSave={handleSaveUser} />}</AnimatePresence>

            {/* Confirmation Modal for Delete */}
            <AnimatePresence>
                {userToDelete && (
                    <ConfirmationModal
                        isOpen={!!userToDelete}
                        title="Deletion Confirmation"
                        message={`Are you absolutely sure you want to permanently delete user ${userToDelete.name}? This action is irreversible.`}
                        onConfirm={confirmDelete}
                        onCancel={() => setUserToDelete(null)}
                        confirmText="Delete User"
                        confirmColor="red"
                    />
                )}
            </AnimatePresence>

            {/* Confirmation Modal for Status Toggle */}
            <AnimatePresence>
                {userToToggleStatus && (
                    <ConfirmationModal
                        isOpen={!!userToToggleStatus}
                        title={`Confirm ${userToToggleStatus.status === 'Active' ? 'Deactivation' : 'Activation'}`}
                        message={`Do you want to change the status of user ${userToToggleStatus.name} from ${userToToggleStatus.status === 'Active' ? 'Active' : 'Inactive'} to ${userToToggleStatus.status === 'Active' ? 'Inactive' : 'Active'}?`}
                        onConfirm={confirmToggleStatus}
                        onCancel={() => setUserToToggleStatus(null)}
                        confirmText={userToToggleStatus.status === 'Active' ? 'Deactivate' : 'Activate'}
                        confirmColor={userToToggleStatus.status === 'Active' ? 'yellow' : 'green'}
                    />
                )}
            </AnimatePresence>
            
            {/* Toast messages container */}
            <Toaster position="bottom-right" />
        </motion.div>
    );
};

export default UsersPage;