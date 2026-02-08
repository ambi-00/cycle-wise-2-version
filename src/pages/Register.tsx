import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Passwort-Abgleich
    if (password !== password2) {
      setErrorMsg("Die Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);

    try {
      // 1. User registrieren
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setErrorMsg(signUpError.message);
        setLoading(false);
        return;
      }

      const user = data.user;
      if (!user) {
        setErrorMsg("Registrierung fehlgeschlagen.");
        setLoading(false);
        return;
      }

      // 2. Profil speichern
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        display_name: name,
        email: email,
      });

      if (profileError) {
        setErrorMsg("Profil konnte nicht gespeichert werden: " + profileError.message);
        setLoading(false);
        return;
      }

      // 3. Weiterleiten
      navigate("/login");

    } catch (err) {
      setErrorMsg("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 20 }}>
      <h1>Registrieren</h1>

      <form onSubmit={handleRegister}>

        <label>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>E-Mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Passwort</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label>Passwort wiederholen</label>
        <input
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
        />

        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Wird erstellt..." : "Konto erstellen"}
        </button>
      </form>
    </div>
  );
}

