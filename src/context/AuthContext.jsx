import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  USER_ROLES,
  USER_STATUSES,
  getPermissionsByRole,
} from "../constants/roles";
import {
  ACCOUNT_STATUS,
  MEMBER_STATUS,
} from "../constants/champions";
import { COLLECTIONS } from "../constants/collections";
import { createUser } from "../entities";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setAuthLoading(true);

        if (!user) {
          setFirebaseUser(null);
          setAppUser(null);
          return;
        }

        if (!user.email?.endsWith("@brac.net")) {
          // Not BRAC staff — check whether this is an approved Champion
          // (Selection Committee/Facilitator/Co-Facilitator/Mentor/YCN — a
          // separate account type, stored outside the `users` collection)
          // before rejecting the sign-in outright.
          const championRef = doc(
            db,
            COLLECTIONS.CHAMPIONS_POOL,
            user.uid
          );
          const championSnap = await getDoc(championRef);

          if (championSnap.exists()) {
            setFirebaseUser(user);
            setAppUser({
              userType: "champion",
              ...championSnap.data(),
              id: championSnap.id,
            });
            return;
          }

          // Not a Champion either — check whether this is a Participant
          // session (only reachable today via admin "Login as" impersonation,
          // since participants have no self-service registration/login of
          // their own yet).
          const participantRef = doc(db, COLLECTIONS.PARTICIPANTS, user.uid);
          const participantSnap = await getDoc(participantRef);

          if (participantSnap.exists()) {
            setFirebaseUser(user);
            setAppUser({
              userType: "participant",
              ...participantSnap.data(),
              id: participantSnap.id,
            });
            return;
          }

          setFirebaseUser(null);
          setAppUser(null);
          await signOut(auth);
          return;
        }

        setFirebaseUser(user);

        const userRef = doc(db, COLLECTIONS.USERS, user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const newUser = createUser({
            id: user.uid,
            uid: user.uid,
            name: user.displayName || "",
            email: user.email,
            photo_url: user.photoURL || "",
            role: USER_ROLES.PENDING,
            status: USER_STATUSES.PENDING,
            permissions: getPermissionsByRole(USER_ROLES.PENDING),
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });

          await setDoc(userRef, newUser);

          setAppUser(newUser);

          return;
        }

        setAppUser({
          ...userSnap.data(),
          id: userSnap.id,
        });
      } catch (error) {
        console.error("Auth context failed:", error);
        setFirebaseUser(null);
        setAppUser(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setAppUser(null);
  };

  const hasPermission = (key) => {
    return appUser?.permissions?.[key] === true;
  };

  const isChampion = appUser?.userType === "champion";
  const isParticipant = appUser?.userType === "participant";

  const isActive = isChampion
    ? appUser?.member_status === MEMBER_STATUS.ACTIVE &&
      appUser?.account_status === ACCOUNT_STATUS.ACTIVE
    : isParticipant
    ? true // no separate account-activation lifecycle for participants
    : appUser?.status === USER_STATUSES.ACTIVE;

  const isAdmin = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(
    appUser?.role
  );

  const isSuperAdmin = appUser?.role === USER_ROLES.SUPER_ADMIN;

  const isViewer = appUser?.role === USER_ROLES.VIEWER;

  return (
    <AuthContext.Provider
      value={{
        authLoading,
        firebaseUser,
        appUser,
        isActive,
        isAdmin,
        isSuperAdmin,
        isViewer,
        isChampion,
        isParticipant,
        hasPermission,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}