import { Navigate, useNavigate } from "react-router-dom";
import { Clock, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPath } from "@/lib/routes";

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role === "tourist" || user.isApproved) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-3xl border border-orange-100 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 text-white shadow-lg">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-slate-950">Your account is under admin review</h1>
        <p className="mt-3 text-slate-500">You will be notified once approved</p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </section>
    </main>
  );
}
