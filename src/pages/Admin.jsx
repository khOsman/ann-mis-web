import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || !user.email.endsWith("@brac.net")) {
        await signOut(auth);
        window.location.href = "/";
        return;
      }

      setAllowed(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p style={{ padding: "40px" }}>Checking access...</p>;

  if (!allowed) return null;

  return (
    <div style={{ padding: "40px" }}>
      <h1>ANN MIS Admin Portal</h1>
      <p>Protected dashboard. Only BRAC users can access this page.</p>
    </div>
  );
}