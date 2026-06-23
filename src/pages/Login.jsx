import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

export default function Login() {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;

      if (!email.endsWith("@brac.net")) {
        await signOut(auth);
        alert("Only BRAC official email accounts are allowed.");
        return;
      }

      window.location.href = "/admin";
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>ANN MIS</h1>
      <p>Login with your BRAC official email.</p>
      <button onClick={handleLogin}>Continue with Google</button>
    </div>
  );
}