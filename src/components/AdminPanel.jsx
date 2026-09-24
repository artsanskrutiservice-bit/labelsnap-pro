import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { 
  Users, 
  ShieldCheck, 
  Crown, 
  Search, 
  Activity, 
  Globe, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

export default function AdminPanel({ activeCount = 0, guestCount = 0, registeredOnlineCount = 0 }) {
  const [usersList, setUsersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // Firestore mathi badha registered users nu realtime fetching
  useEffect(() => {
    const usersCollection = collection(db, 'users');
    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const users = [];
      snapshot.forEach((docSnap) => {
        users.push({ id: docSnap.id, ...docSnap.data() });
      });
      setUsersList(users);
    });

    return () => unsubscribe();
  }, []);

  // Pro role toggle karva mate
  const toggleUserProStatus = async (user) => {
    setUpdatingId(user.id);
    try {
      const userRef = doc(db, 'users', user.id);
      const isCurrentlyPro = user.role === 'pro';
      
      await updateDoc(userRef, {
        role: isCurrentlyPro ? 'free' : 'pro',
        planExpiresAt: isCurrentlyPro ? null : 'lifetime'
      });
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = usersList.filter(u => 
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-slate-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Admin Control Center</h2>
            <p className="text-xs text-slate-400">Live Traffic, Visitor Insights &amp; User Access Management</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-400">Realtime Monitor Active</span>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Live Users */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Total Live Online</span>
            <span className="text-2xl font-black text-white mt-1">{activeCount}</span>
            <span className="text-[10px] text-slate-500">Login + Guest Traffic</span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Activity size={22} />
          </div>
        </div>

        {/* Live Guests */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Guest Visitors</span>
            <span className="text-2xl font-black text-amber-400 mt-1">{guestCount}</span>
            <span className="text-[10px] text-slate-500">Without Login</span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Globe size={22} />
          </div>
        </div>

        {/* Registered Online */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Members Online</span>
            <span className="text-2xl font-black text-emerald-400 mt-1">{registeredOnlineCount}</span>
            <span className="text-[10px] text-slate-500">Logged-in Users</span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck size={22} />
          </div>
        </div>

        {/* Total Database Users */}
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">Total Members</span>
            <span className="text-2xl font-black text-purple-400 mt-1">{usersList.length}</span>
            <span className="text-[10px] text-slate-500">Saved in Firestore</span>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Users size={22} />
          </div>
        </div>

      </div>

      {/* User Management Section */}
      <div className="flex flex-col gap-4">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            Registered Members List ({filteredUsers.length})
          </h3>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email or name..."
              className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 rounded-xl text-xs text-slate-200 outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Plan Validity</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">
                      No matching registered users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isProUser = user.role === 'pro';
                    return (
                      <tr key={user.id} className="hover:bg-slate-900/40 transition">
                        
                        {/* User details */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-white">{user.name || 'User'}</span>
                            <span className="text-[11px] text-slate-400">{user.email}</span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isProUser 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {isProUser && <Crown size={10} />}
                            {user.role ? user.role.toUpperCase() : 'FREE'}
                          </span>
                        </td>

                        {/* Plan Validity */}
                        <td className="py-3 px-4 text-slate-400">
                          {user.planExpiresAt === 'lifetime' ? (
                            <span className="text-emerald-400 font-semibold">Lifetime Access</span>
                          ) : user.planExpiresAt ? (
                            new Date(user.planExpiresAt).toLocaleDateString()
                          ) : (
                            <span className="text-slate-500">Free Tier</span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>

                        {/* Action Toggle */}
                        <td className="py-3 px-4 text-right">
                          <button
                            disabled={updatingId === user.id}
                            onClick={() => toggleUserProStatus(user)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto ${
                              isProUser
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isProUser ? (
                              <>
                                <XCircle size={13} />
                                <span>Downgrade Free</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Upgrade Pro</span>
                              </>
                            )}
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}