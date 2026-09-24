import { useState, useEffect } from 'react';
import { auth, googleProvider, db, rtdb } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect, remove } from 'firebase/database';

const ADMIN_EMAIL = "dhruvusadadiya321@gmail.com";

// Browser mate unique guest session id generator
function getOrCreateSessionId() {
  let sid = localStorage.getItem('labelsnap_guest_sid');
  if (!sid) {
    sid = 'guest_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    localStorage.setItem('labelsnap_guest_sid', sid);
  }
  return sid;
}

export function useAuthPresence() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [guestCount, setGuestCount] = useState(0);
  const [registeredOnlineCount, setRegisteredOnlineCount] = useState(0);

  // 1. Google Login Popup
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
        await set(userStatusRef, { 
          state: 'offline', 
          type: 'registered',
          email: currentUser.email,
          last_changed: Date.now() 
        });
      }
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    const sid = getOrCreateSessionId();
    const guestStatusRef = ref(rtdb, `/status/${sid}`);
    const connectedRef = ref(rtdb, '.info/connected');

    // 3. Visitor / Guest Presence Tracking (Without Login)
    const unsubConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true && !auth.currentUser) {
        onDisconnect(guestStatusRef).remove();
        set(guestStatusRef, {
          state: 'online',
          type: 'guest',
          sid: sid,
          last_changed: Date.now()
        });
      }
    });

    // 4. Firebase Auth State Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Jyare user login thay tyare guest node remove kari nakho
        remove(guestStatusRef).catch(() => {});

        setCurrentUser(user);
        const userIsAdmin = user.email === ADMIN_EMAIL;
        setIsAdmin(userIsAdmin);

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
          await setDoc(userDocRef, {
            email: user.email,
            name: user.displayName || 'User',
            role: userIsAdmin ? 'pro' : 'free',
            planExpiresAt: userIsAdmin ? 'lifetime' : null,
            createdAt: new Date().toISOString()
          });
        }

        // Live Realtime Presence for Logged-In User
        const userStatusRef = ref(rtdb, `/status/${user.uid}`);
        onDisconnect(userStatusRef).set({
          state: 'offline',
          type: 'registered',
          email: user.email,
          name: user.displayName || 'User',
          last_changed: Date.now()
        });

        set(userStatusRef, {
          state: 'online',
          type: 'registered',
          email: user.email,
          name: user.displayName || 'User',
          last_changed: Date.now()
        });

        // Firestore Realtime Role & Expiry Listener
        const unsubscribeDoc = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            if (user.email === ADMIN_EMAIL) {
              setIsPro(true);
              return;
            }

            if (data.role === 'pro') {
              if (data.planExpiresAt === 'lifetime') {
                setIsPro(true);
              } else if (data.planExpiresAt) {
                const now = new Date();
                const expiry = new Date(data.planExpiresAt);

                if (now < expiry) {
                  setIsPro(true);
                } else {
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

        return () => unsubscribeDoc();
      } else {
        setCurrentUser(null);
        setIsPro(false);
        setIsAdmin(false);

        // Logout pachi fari thi guest node activate karo
        set(guestStatusRef, {
          state: 'online',
          type: 'guest',
          sid: sid,
          last_changed: Date.now()
        });
      }
    });

    // 5. Total Online Active Users Listener (Guests + Registered)
    const allStatusRef = ref(rtdb, '/status');
    const unsubscribeStatus = onValue(allStatusRef, (snapshot) => {
      const data = snapshot.val() || {};
      const allOnline = Object.values(data).filter(u => u.state === 'online');
      
      const guests = allOnline.filter(u => u.type === 'guest').length;
      const registered = allOnline.filter(u => u.type === 'registered').length;

      setActiveUsersCount(allOnline.length);
      setGuestCount(guests);
      setRegisteredOnlineCount(registered);
    });

    return () => {
      unsubConnected();
      unsubscribeAuth();
      unsubscribeStatus();
    };
  }, []);

  return {
    currentUser,
    isPro,
    isAdmin,
    activeUsersCount,
    guestCount,
    registeredOnlineCount,
    loginWithGoogle,
    logout
  };
}