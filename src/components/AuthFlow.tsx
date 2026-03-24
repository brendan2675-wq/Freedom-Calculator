import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Mail, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

type Step = "login" | "2fa" | "success";

interface AuthFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  setClientName: (name: string) => void;
}

const AuthFlow = ({ open, onOpenChange, clientName, setClientName }: AuthFlowProps) => {
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("client@example.com");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(clientName);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep("login");
    setPassword("");
    setOtp("");
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("2fa");
    }, 800);
  };

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 800);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "login" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock size={20} className="text-accent" /> Sign In
              </DialogTitle>
              <DialogDescription>
                Enter your credentials to access your wealth dashboard
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleLogin} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer">
                  <input type="checkbox" className="rounded border-input" defaultChecked />
                  Remember me
                </label>
                <button type="button" className="text-accent hover:underline">Forgot password?</button>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
          </>
        )}

        {step === "2fa" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield size={20} className="text-accent" /> Two-Factor Authentication
              </DialogTitle>
              <DialogDescription>
                Enter the 6-digit code from your authenticator app
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-2">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Shield size={32} className="text-accent" />
                </div>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                A code was sent to <span className="font-medium text-foreground">{email}</span>
              </p>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                className="w-full"
                disabled={otp.length < 6 || loading}
                onClick={handleVerify}
              >
                {loading ? "Verifying…" : "Verify & Continue"}
              </Button>
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => { setStep("login"); setOtp(""); }}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={12} /> Back to login
                </button>
                <button className="text-accent hover:underline">Resend code</button>
              </div>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-green-500" /> Welcome back
              </DialogTitle>
              <DialogDescription>You're now signed in</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <p className="text-lg font-semibold text-foreground">{clientName}</p>
              <p className="text-sm text-muted-foreground text-center">
                Your session is now active. All data is securely accessible.
              </p>
              <Button className="w-full" onClick={() => handleClose(false)}>
                Continue to Dashboard
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthFlow;
