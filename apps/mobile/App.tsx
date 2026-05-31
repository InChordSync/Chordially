import { useEffect, useMemo, useState } from "react";
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, View, TextInput, Pressable } from "react-native";

import { mobileConfig } from "./src/config";
import { createMobileAuthStore } from "./src/auth/mobile-auth-store";
import { mobileAuthClient } from "./src/auth/mobile-auth-client";

type Screen = "home" | "resetRequest" | "resetComplete" | "verifyPending" | "restricted";

function AuthField(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  secure?: boolean;
  error?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text>{props.label}</Text>
      <TextInput style={styles.input} value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} secureTextEntry={props.secure} />
      {props.error ? <Text style={{ color: "#a83d1b" }}>{props.error}</Text> : null}
    </View>
  );
}

export default function App() {
  const authStore = useMemo(() => createMobileAuthStore(), []);
  const [screen, setScreen] = useState<Screen>("home");
  const [token, setToken] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [state, setState] = useState(authStore.getState());

  useEffect(() => authStore.subscribe(setState), []);
  useEffect(() => {
    authStore.boot({
      sessionId: "session-mobile-1",
      sessions: [
        { id: "session-mobile-1", device: "Pixel 7", lastSeen: "just now" },
        { id: "session-mobile-2", device: "iPhone 14", lastSeen: "2h ago" },
      ],
    });
  }, []);

  const signedIn = state.isAuthenticated;
  const emailError = email && !email.includes("@") ? "Enter a valid email address." : undefined;
  const passwordError = password && password.length < 8 ? "Password must be at least 8 characters." : undefined;

  if (state.isBooting) {
    return <View style={styles.container}><Text style={styles.title}>Booting auth…</Text></View>;
  }

  async function logout() {
    setServerError(null);
    setMsg(null);
    if (accessToken) {
      await mobileAuthClient.logout(accessToken);
    }
    setAccessToken(null);
    authStore.boot({ sessionId: null, sessions: [] });
  }

  async function signIn() {
    if (emailError || passwordError) return;
    setPending(true);
    setServerError(null);
    setMsg(null);
    try {
      const result = await mobileAuthClient.login({ email, password });
      if (!result.ok) {
        setServerError(result.error.message);
        return;
      }

      setAccessToken(result.data.session.token);
      authStore.boot({
        sessionId: result.data.session.token,
        sessions: [{ id: "this-device", device: "This device", lastSeen: "just now" }],
      });

      const me = await mobileAuthClient.me(result.data.session.token);
      if (me.ok) setMsg(`Signed in as ${me.data.user.displayName}.`);
      else setMsg("Signed in.");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function requestReset() {
    if (emailError) return;
    setPending(true);
    setServerError(null);
    setMsg(null);
    try {
      const res = await fetch(`${mobileConfig.apiBaseUrl}/api/v1/auth/reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("reset request failed");
      setMsg("If an account exists, a reset link has been sent.");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function completeReset() {
    if (passwordError) return;
    setPending(true);
    setServerError(null);
    setMsg(null);
    try {
      const res = await fetch(`${mobileConfig.apiBaseUrl}/api/v1/auth/reset/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setServerError(body.message ?? "Unable to complete password reset.");
        return;
      }
      setMsg(body.message ?? "Password updated.");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function resendVerification() {
    setPending(true);
    setServerError(null);
    setMsg(null);
    try {
      const res = await fetch(`${mobileConfig.apiBaseUrl}/api/v1/auth/verify/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setServerError(body.message ?? "Unable to confirm verification token.");
        return;
      }
      setMsg(body.message ?? "Email verified.");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function parseDeepLink() {
    const url = await Linking.getInitialURL();
    if (!url) return;
    try {
      const parsed = new URL(url);
      if (parsed.pathname.includes("verify")) {
        setScreen("verifyPending");
        setToken(parsed.searchParams.get("token") ?? "");
      } else if (parsed.pathname.includes("reset")) {
        setScreen("resetComplete");
        setToken(parsed.searchParams.get("token") ?? "");
      } else {
        setMsg("Unsupported auth callback link.");
      }
    } catch {
      setMsg("Malformed auth callback link.");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>Chordially Mobile Starter</Text>
        <Text style={styles.title}>Auth flow starter.</Text>
        <Text style={styles.body}>
          Minimal mobile auth flow harness for logout, password reset, and verification.
        </Text>
        <Text style={styles.panelBody}>Session: {signedIn ? "signed-in" : "signed-out"}</Text>
        {msg ? <Text style={styles.notice}>{msg}</Text> : null}

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Local services</Text>
          <Text style={styles.panelBody}>API: {mobileConfig.apiBaseUrl}</Text>
          <Text style={styles.panelBody}>Stellar: {mobileConfig.stellarServiceUrl}</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Auth actions</Text>
          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={signIn} disabled={pending || Boolean(emailError) || Boolean(passwordError)}>
              <Text>{pending ? "Signing in..." : "Sign in"}</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => setScreen("resetRequest")}><Text>Reset Request</Text></Pressable>
            <Pressable style={styles.btn} onPress={() => setScreen("resetComplete")}><Text>Reset Complete</Text></Pressable>
          </View>
          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={() => setScreen("verifyPending")}><Text>Verify Pending</Text></Pressable>
            <Pressable style={styles.btn} onPress={logout}><Text>Logout</Text></Pressable>
          </View>
          <View style={styles.row}>
            <Pressable style={styles.btn} onPress={parseDeepLink}><Text>Parse auth deep link</Text></Pressable>
            <Pressable style={styles.btn} onPress={() => setScreen("restricted")}><Text>Restricted Account</Text></Pressable>
          </View>
        </View>

        {screen === "resetRequest" && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Password reset request</Text>
            <AuthField label="Email" value={email} onChangeText={setEmail} placeholder="Email" error={emailError} />
            <Pressable style={styles.btn} onPress={requestReset} disabled={pending}><Text>{pending ? "Submitting..." : "Submit request"}</Text></Pressable>
          </View>
        )}

        {screen === "resetComplete" && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Password reset completion</Text>
            <AuthField label="Reset token" value={token} onChangeText={setToken} placeholder="Reset token" />
            <AuthField label="New password" value={password} onChangeText={setPassword} placeholder="New password" secure error={passwordError} />
            <Pressable style={styles.btn} onPress={completeReset} disabled={pending}><Text>{pending ? "Submitting..." : "Complete reset"}</Text></Pressable>
          </View>
        )}

        {screen === "verifyPending" && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Verification pending</Text>
            <Text style={styles.panelBody}>Account still needs verification.</Text>
            <AuthField label="Verification token" value={token} onChangeText={setToken} placeholder="Verification token" />
            <Pressable style={styles.btn} onPress={resendVerification} disabled={pending}><Text>{pending ? "Submitting..." : "Submit / resend verification"}</Text></Pressable>
          </View>
        )}
        {screen === "restricted" && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Restricted account</Text>
            <Text style={styles.panelBody}>This account is disabled or banned. Contact project maintainers for recovery support.</Text>
          </View>
        )}
        {serverError ? <Text style={{ color: "#a83d1b" }}>{serverError}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f0e8"
  },
  container: {
    padding: 24,
    gap: 18
  },
  eyebrow: {
    color: "#9a3f19",
    textTransform: "uppercase",
    letterSpacing: 1.5
  },
  title: {
    fontSize: 36,
    lineHeight: 38,
    fontWeight: "700",
    color: "#1f1a17"
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: "#5e5248"
  },
  panel: {
    backgroundColor: "rgba(255,255,255,0.75)",
    borderRadius: 20,
    padding: 20,
    gap: 8
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f1a17"
  },
  panelBody: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5e5248"
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  btn: {
    backgroundColor: "#f0e2d3",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10
  },
  notice: {
    color: "#2d6a4f",
    fontSize: 14
  }
});
