import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Home, ArrowLeft, User, Building, Map, ChefHat, Shield } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import heroImg from "@/assets/hero-bg.jpg";
import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { EMAIL_REGEX, PHONE_REGEX, isBlank } from "@/lib/validation";
import { getDashboardPath } from "@/lib/routes";

const roles = [
  { id: "tourist" as UserRole, label: "Tourist", icon: User, desc: "Explore & book homestays" },
  { id: "host" as UserRole, label: "Homestay Host", icon: Building, desc: "List & manage your property" },
  { id: "guide" as UserRole, label: "Local Guide", icon: Map, desc: "Share local knowledge & guide" },
  { id: "chef" as UserRole, label: "Chef", icon: ChefHat, desc: "Cook for guest stays" },
  { id: "admin" as UserRole, label: "Admin", icon: Shield, desc: "Manage users & approvals" },
];

export default function AuthV2() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, signup, authWithGoogle, isLoggedIn, user } = useAuth();
  const [isSignup, setIsSignup] = useState(searchParams.get("mode") === "signup");
  const [selectedRole, setSelectedRole] = useState<UserRole>("tourist");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const signupRoles = roles.filter((role) => role.id !== "admin");

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (isSignup && isBlank(form.name)) nextErrors.name = "Full name is required.";
    if (isBlank(form.email)) nextErrors.email = "Email is required.";
    else if (!EMAIL_REGEX.test(form.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (isSignup && form.phone.trim() && !PHONE_REGEX.test(form.phone.trim())) nextErrors.phone = "Enter a valid phone number.";
    if (isBlank(form.password)) nextErrors.password = "Password is required.";
    else if (form.password.length < 6) nextErrors.password = "Password must be at least 6 characters.";
    if (isSignup) {
      if (isBlank(form.confirmPassword)) nextErrors.confirmPassword = "Please confirm your password.";
      else if (form.confirmPassword !== form.password) nextErrors.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (!roleParam) return;
    const allowedRoles: UserRole[] = isSignup ? ["tourist", "host", "guide", "chef"] : ["tourist", "host", "guide", "chef", "admin"];
    if (allowedRoles.includes(roleParam as UserRole)) setSelectedRole(roleParam as UserRole);
  }, [searchParams, isSignup]);

  useEffect(() => {
    if (isSignup && selectedRole === "admin") setSelectedRole("tourist");
  }, [isSignup, selectedRole]);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    if (user.role === "tourist") {
      navigate("/home", { replace: true });
      return;
    }
    if (!user.isApproved) {
      navigate("/pending-approval", { replace: true });
      return;
    }
    navigate(getDashboardPath(user.role), { replace: true });
  }, [isLoggedIn, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setLoading(true);
    try {
      if (isSignup) {
        await signup({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: selectedRole,
          phone: form.phone.trim() || undefined,
        });
      } else {
        await login(form.email.trim(), form.password, selectedRole);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={heroImg} alt="StayVista" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/80 via-primary/50 to-transparent" />
        <div className="relative z-10 p-12 flex flex-col justify-between h-full">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 gradient-warm rounded-xl flex items-center justify-center shadow">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>StayVista</span>
          </Link>
          <div>
            <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your next unforgettable journey begins here
            </h2>
            <p className="text-white/75 mb-8">
              Join thousands of travellers, hosts, and guides creating authentic experiences across India.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-4">
              <div className="w-8 h-8 gradient-warm rounded-lg flex items-center justify-center">
                <Home className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-xl text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>StayVista</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {isSignup ? "Create your account" : "Welcome back!"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isSignup ? "Join India's leading homestay community" : "Sign in to continue your journey"}
            </p>
          </div>

          <div className="mb-6">
            <p className="text-sm font-semibold text-foreground mb-3">I am a...</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(isSignup ? signupRoles : roles).map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`relative p-3 rounded-xl border-2 text-center transition-all duration-200 ${
                      selectedRole === role.id ? "border-primary bg-primary/8 shadow-md scale-[1.02]" : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mx-auto mb-1 ${selectedRole === role.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-semibold block ${selectedRole === role.id ? "text-primary" : "text-foreground"}`}>{role.label}</span>
                    <p className="text-[10px] text-muted-foreground mt-1 hidden sm:block">{role.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Full Name</label>
                <input type="text" className="input-search w-full" placeholder="Your full name" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
                {fieldErrors.name && <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Email Address</label>
              <input type="email" className="input-search w-full" placeholder="you@example.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              {fieldErrors.email && <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p>}
            </div>
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Phone (optional)</label>
                <input type="tel" className="input-search w-full" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                {fieldErrors.phone && <p className="mt-1 text-xs text-destructive">{fieldErrors.phone}</p>}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} className="input-search w-full pr-10" placeholder="Enter password" value={form.password} onChange={(e) => updateField("password", e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-destructive">{fieldErrors.password}</p>}
            </div>
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Confirm Password</label>
                <input type="password" className="input-search w-full" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} />
                {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
              </div>
            )}
            {!isSignup && (
              <div className="text-right">
                <button type="button" className="text-xs text-primary hover:underline font-medium">Forgot password?</button>
              </div>
            )}
            {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-xl">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full text-center disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (isSignup ? "Creating account..." : "Signing in...") : (isSignup ? "Create Account" : "Sign In")}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs text-muted-foreground"><span className="bg-background px-3">or continue with</span></div>
          </div>
          <div className="w-full flex justify-center">
            {googleClientId ? (
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  try {
                    if (!credentialResponse.credential) throw new Error("Google token not found.");
                    await authWithGoogle(selectedRole, isSignup ? "signup" : "signin", credentialResponse.credential);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Google sign-in failed.");
                  }
                }}
                onError={() => toast.error("Google sign-in failed.")}
              />
            ) : (
              <div className="w-full rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
                Google sign-in needs `VITE_GOOGLE_CLIENT_ID` in your `.env` file.
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4 justify-center text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Secure and encrypted. We never share your data.</span>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignup ? "Already have an account? " : "Don't have an account? "}
            <button type="button" onClick={() => { setIsSignup(!isSignup); setError(""); setFieldErrors({}); }} className="text-primary font-semibold hover:underline">
              {isSignup ? "Sign In" : "Sign Up Free"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
