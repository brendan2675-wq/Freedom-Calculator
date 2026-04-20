import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, Shield, User, Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSession, landingFor, type Role } from "@/lib/auth";

const ROLE_OPTIONS: { value: Role; label: string; desc: string; icon: typeof User }[] = [
  { value: "client", label: "Client", desc: "Manage your own portfolio & goals", icon: User },
  { value: "adviser", label: "Adviser", desc: "Internal — manage clients & scenarios", icon: Briefcase },
  { value: "agent", label: "Agent", desc: "Read-only access to shared scenarios", icon: Users },
];

const DEFAULT_NAMES: Record<Role, string> = {
  client: "Sam Client",
  adviser: "Alex Adviser",
  agent: "Jordan Agent",
};

const Login = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("client");
  const [name, setName] = useState(DEFAULT_NAMES.client);
  const [email, setEmail] = useState("user@atelierwealth.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (r: Role) => {
    setRole(r);
    setName(DEFAULT_NAMES[r]);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSession({
        id: `${role}-${email.toLowerCase()}`,
        name: name.trim() || DEFAULT_NAMES[role],
        email: email.trim(),
        role,
      });
      navigate(landingFor(role), { replace: true });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-header text-primary-foreground py-6 md:py-10">
        <div className="container mx-auto px-4">
          <p className="text-accent text-lg tracking-wider">Atelier Wealth - Freedom Calculator</p>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 flex items-center justify-center">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-md border-2 border-border p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 mx-auto flex items-center justify-center mb-3">
              <Shield size={28} className="text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
            <p className="text-sm text-muted-foreground mt-1">Choose your role to continue</p>
          </div>

          {/* Role picker */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {ROLE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleRoleChange(opt.value)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    active ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                  }`}
                >
                  <Icon size={18} className={active ? "text-accent" : "text-muted-foreground"} />
                  <p className={`text-sm font-semibold mt-1.5 ${active ? "text-foreground" : "text-foreground"}`}>{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{opt.desc}</p>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" placeholder="••••••••" />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : `Continue as ${ROLE_OPTIONS.find((o) => o.value === role)?.label}`}
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">Prototype — no password required</p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;
