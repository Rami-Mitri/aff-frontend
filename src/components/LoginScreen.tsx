import { useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/services/api";

interface Props {
  onAuthenticated: (name: string, email: string) => void;
}

export function LoginScreen({ onAuthenticated }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      onAuthenticated(res.user.name, res.user.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-teal-700 to-slate-900 p-8 md:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 font-bold text-white">
                A
              </div>
              <div>
                <div className="text-sm font-semibold text-white">AFF Vehicle Tracking</div>
                <div className="text-[11px] text-teal-200">
                  Aromatic Flavours &amp; Fragrances
                </div>
              </div>
            </div>
            <h2 className="mt-10 font-serif text-3xl font-bold leading-tight text-white">
              Fleet intelligence for AFF.
            </h2>
            <p className="mt-3 text-sm text-teal-100">
              Monitor vehicles, drivers, and GPS devices in real time. Secure, role-based
              access with full audit history.
            </p>
          </div>
          <div className="text-[11px] text-teal-200">
            © 2026 Aromatic Flavours &amp; Fragrances. All Rights Reserved.
          </div>
        </div>

        <div className="p-8">
          <div className="mb-6 flex items-center gap-2 text-teal-400">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-semibold">Secure Sign In</span>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1 border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="mt-1 border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 bg-teal-600 hover:bg-teal-700"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}