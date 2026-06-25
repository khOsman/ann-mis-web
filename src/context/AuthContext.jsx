import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { getPermissionsByRole } from "../constants/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setAuthLoading(true);

        if (!user || !user.email?.endsWith("@brac.net")) {
          setFirebaseUser(null);
          setAppUser(null);

          if (user) {
            await signOut(auth);
          }

          return;
        }

        setFirebaseUser(user);

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email,
            photo_url: user.photoURL || "",
            role: "pending",
            status: "pending",
            permissions: getPermissionsByRole("pending"),
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });

          setAppUser({
            uid: user.uid,
            name: user.displayName || "",
            email: user.email,
            photo_url: user.photoURL || "",
            role: "pending",
            status: "pending",
            permissions: getPermissionsByRole("pending"),
          });

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

  const isActive = appUser?.status === "active";
  const isAdmin = ["super_admin", "admin"].includes(appUser?.role);
  const isSuperAdmin = appUser?.role === "super_admin";

  return (
    <AuthContext.Provider
      value={{
        authLoading,
        firebaseUser,
        appUser,
        isActive,
        isAdmin,
        isSuperAdmin,
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