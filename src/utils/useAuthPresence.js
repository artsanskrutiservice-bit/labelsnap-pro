// src/utils/useAuthPresence.js
import { useState, useEffect } from 'react';
import { auth, googleProvider, db, rtdb } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect } from 'firebase/database';

// Admin email jene badha rights ane lifetime pro access raheshe
const ADMIN_EMAIL = "dhruvusadadiya321@gmail.com"; 

export function useAuthPresence() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeUsersCount, setActiveUsersCount] = useState(0);

  // 1. Google Sign-in Popup
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  // 2. Sign-out
  const logout = async () => {
    try {
      if (currentUser) {
        const userStatusRef = ref(rtdb, `/status/${currentUser.uid}`);
        await set(userStatusRef, { state: 'offline', last_changed: Date.now() });
      }
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    // 3. Firebase Auth State Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const userIsAdmin = user.email === ADMIN_EMAIL;
        setIsAdmin(userIsAdmin);

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        // Jo navo user hoy to database ma document create karo
        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            name: user.displayName || 'User',
            role: userIsAdmin ? 'pro' : 'free',
            planExpiresAt: userIsAdmin ? 'lifetime' : null,
            createdAt: new Date().toISOString()
          });
        }

        // Realtime Firestore Snapshot Listener (Role ane Expiry Date check karva mate)
        const unsubscribeDoc = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            // Admin mate hamesha Pro raheshe
            if (user.email === ADMIN_EMAIL) {
              setIsPro(true);
              return;
            }

            // Regular users mate role ane plan expiry verify karo
            if (data.role === 'pro') {
              if (data.planExpiresAt === 'lifetime') {
                setIsPro(true);
              } else if (data.planExpiresAt) {
                const now = new Date();
                const expiry = new Date(data.planExpiresAt);

                if (now < expiry) {
                  // Plan chalu che
                  setIsPro(true);
                } else {
                  // Plan no time puro thai gayo -> Aape-aap Free role kari devu
                  await updateDoc(userDocRef, {
                    role: 'free',
                    planExpiresAt: null
                  });
                  setIsPro(false);
                }
              } else {
                setIsPro(false);
              }
            } else {
              setIsPro(false);
            }
          }
        });

        // 4. Live Presence Tracking (Realtime Database Heartbeat)
        const userStatusRef = ref(rtdb, `/status/${user.uid}`);
        const connectedRef = ref(rtdb, '.info/connected');

        onValue(connectedRef, (snapshot) => {
          if (snapshot.val() === true) {
            onDisconnect(userStatusRef).set({
              state: 'offline',
              email: user.email,
              name: user.displayName || 'User',
              last_changed: Date.now()
            });

            set(userStatusRef, {
              state: 'online',
              email: user.email,
              name: user.displayName || 'User',
              last_changed: Date.now()
            });
          }
        });

        return () => {
          unsubscribeDoc();
        };

      } else {
        setCurrentUser(null);
        setIsPro(false);
        setIsAdmin(false);
      }
    });

    // 5. Total Online Active Users Counter Listener
    const allStatusRef = ref(rtdb, '/status');
    const unsubscribeStatus = onValue(allStatusRef, (snapshot) => {
      const data = snapshot.val() || {};
      const onlineCount = Object.values(data).filter(u => u.state === 'online').length;
      setActiveUsersCount(onlineCount);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeStatus();
    };
  }, []);

  return {
    currentUser,
    isPro,
    isAdmin,
    activeUsersCount,
    loginWithGoogle,
    logout
  };
}