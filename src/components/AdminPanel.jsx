import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Shield, Search, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function AdminPanel({ activeCount }) {
  const [usersList, setUsersList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDays, setSelectedDays] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setUsersList(list);
    });
    return () => unsub();
  }, []);

  // Pro Plan Expiry Set Karva nu Function
  const handleSetPlan = async (userId, days) => {
    const userRef = doc(db, 'users', userId);

    if (days === 0) {
      // Demote to Free
      await updateDoc(userRef, {
        role: 'free',
        planExpiresAt: null,
      });
      return;
    }

    if (days === -1) {
      // Lifetime / Unlimited
      await updateDoc(userRef, {
        role: 'pro',
        planExpiresAt: 'lifetime',
      });
      return;
    }

    // Days calculate karva
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    await updateDoc(userRef, {
      role: 'pro',
      planExpiresAt: expiryDate.toISOString(),
    });
  };

  // Search filter
  const filteredUsers = usersList.filter((u) =>
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Expiry date format karva
  const formatExpiry = (expiresAt) => {
    if (!expiresAt) return '—';
    if (expiresAt === 'lifetime') return 'Lifetime';
    const d = new Date(expiresAt);
    return d.toLocaleDateString('en-GB') + ' (' + Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24)) + ' days left)';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Shield size={22} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Admin Control Center</h2>
            <p className="text-xs text-slate-500">User search, Pro plan duration &amp; active status</p>
          </div>
        </div>

        {/* Live Active Counter */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl self-start md:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-emerald-800">{activeCount} Users Online Right Now</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="User Email athva Naam search karo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b text-slate-400 font-semibold uppercase text-[11px]">
              <th className="py-2.5">User Details</th>
              <th className="py-2.5">Plan</th>
              <th className="py-2.5">Expiry Date</th>
              <th className="py-2.5 text-right">Assign Plan Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-6 text-center text-slate-400 text-xs">
                  Koi user malyo nathi.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const daysVal = selectedDays[u.id] || '30';
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3">
                      <p className="font-semibold text-slate-800">{u.name || 'User'}</p>
                      <p className="text-[11px] text-slate-500">{u.email}</p>
                    </td>

                    <td className="py-3">
                      <span
                        className={`px-2.5 py-1 rounded-md font-bold uppercase text-[10px] ${
                          u.role === 'pro'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.role || 'free'}
                      </span>
                    </td>

                    <td className="py-3 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400" />
                        <span>{formatExpiry(u.planExpiresAt)}</span>
                      </div>
                    </td>

                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Days Dropdown */}
                        <select
                          value={daysVal}
                          onChange={(e) =>
                            setSelectedDays({ ...selectedDays, [u.id]: e.target.value })
                          }
                          className="bg-slate-50 border border-slate-200 text-slate-700 text-xs py-1.5 px-2 rounded-lg focus:outline-none"
                        >
                          <option value="7">7 Days</option>
                          <option value="15">15 Days</option>
                          <option value="30">1 Month (30 Days)</option>
                          <option value="90">3 Months (90 Days)</option>
                          <option value="365">1 Year (365 Days)</option>
                          <option value="-1">Lifetime (Unlimited)</option>
                        </select>

                        {/* Apply Plan Button */}
                        <button
                          onClick={() => handleSetPlan(u.id, daysVal)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition shadow-sm"
                        >
                          Activate
                        </button>

                        {/* Demote to Free Button */}
                        {u.role === 'pro' && (
                          <button
                            onClick={() => handleSetPlan(u.id, 0)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold px-2.5 py-1.5 rounded-lg text-xs transition"
                            title="Plan cancel kari Free karo"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}