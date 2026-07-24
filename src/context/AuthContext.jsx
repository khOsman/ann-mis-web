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
} from "../constants/selectionCommittee";
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
          // Not BRAC staff — check whether this is an approved Selection
          // Committee member (a separate account type, stored outside the
          // `users` collection) before rejecting the sign-in outright.
          const memberRef = doc(
            db,
            COLLECTIONS.SELECTION_COMMITTEE_MEMBERS,
            user.uid
          );
          const memberSnap = await getDoc(memberRef);

          if (memberSnap.exists()) {
            setFirebaseUser(user);
            setAppUser({
              id: memberSnap.id,
              userType: "committee",
              ...memberSnap.data(),
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
          id: userSnap.id,
          ...userSnap.data(),
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

  const isCommitteeMember = appUser?.userType === "committee";

  const isActive = isCommitteeMember
    ? appUser?.member_status === MEMBER_STATUS.ACTIVE &&
      appUser?.account_status === ACCOUNT_STATUS.ACTIVE
    : appUser?.status === USER_STATUSES.ACTIVE;

  const isAdmin = [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN].includes(
    appUser?.role
  );

  const isSuperAdmin = appUser?.role === USER_ROLES.SUPER_ADMIN;

  return (
    <AuthContext.Provider
      value={{
        authLoading,
        firebaseUser,
        appUser,
        isActive,
        isAdmin,
        isSuperAdmin,
        isCommitteeMember,
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