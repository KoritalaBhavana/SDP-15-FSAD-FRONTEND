import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { CheckCircle, ClipboardCheck, Home, Map, ShieldCheck, Sparkles, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { usersApi } from "@/lib/api";
import { getDashboardPath } from "@/lib/routes";

type StepId = "profile" | "content" | "verify" | "earning";

const roleContentLabel = {
  tourist: "Save First Trip",
  host: "Add First Listing",
  guide: "Add First Itinerary",
  chef: "Add First Menu",
  admin: "Review Dashboard",
};

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Record<StepId, boolean>>({
    profile: false,
    content: false,
    verify: false,
    earning: false,
  });
  const [loadingStep, setLoadingStep] = useState<StepId | null>(null);

  const allDone = useMemo(() => Object.values(completed).every(Boolean) || Boolean(user?.onboardingCompleted), [completed, user?.onboardingCompleted]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const finishStep = (step: StepId) => {
    setCompleted((current) => ({ ...current, [step]: true }));
  };

  const runStep = async (step: StepId, action: () => Promise<void>) => {
    setLoadingStep(step);
    try {
      await action();
      finishStep(step);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not complete this step.");
    } finally {
      setLoadingStep(null);
    }
  };

  const completeProfile = () => {
    finishStep("profile");
    navigate("/profile");
  };

  const addFirstContent = () => {
    if (user.role === "host") {
      finishStep("content");
      navigate("/add-property");
      return;
    } else if (user.role === "guide") {
      finishStep("content");
      navigate("/create-itinerary");
      return;
    }
    if (user.role === "chef") {
      finishStep("content");
      navigate("/add-meal");
      return;
    }
    finishStep("content");
    toast.success(`${roleContentLabel[user.role]} completed.`);
  };

  const getVerified = () => runStep("verify", async () => {
    const updated = await usersApi.requestVerification();
    updateUser({
      onboardingCompleted: true,
      isApproved: Boolean(updated.isApproved),
      isVerified: Boolean(updated.isVerified),
      isNew: false,
      isNewUser: false,
      status: updated.status || "PENDING",
    });
    toast.success("Verification request sent.");
  });

  const startEarning = () => {
    finishStep("earning");
    continueToNext();
  };

  const continueToNext = () => {
    if (!user.onboardingCompleted && !allDone) {
      toast.error("Complete all onboarding steps first.");
      return;
    }

    if (!user.isApproved) {
      navigate("/pending-approval", { replace: true });
      return;
    }

    navigate(getDashboardPath(user.role), { replace: true });
  };

  const steps = [
    {
      id: "profile" as StepId,
      icon: UserRound,
      title: "Complete Profile",
      text: "Confirm your basic account details so guests and hosts know who you are.",
      cta: "Complete Profile",
      action: completeProfile,
    },
    {
      id: "content" as StepId,
      icon: user.role === "host" ? Home : user.role === "guide" ? Map : Store,
      title: roleContentLabel[user.role],
      text: "Create the first useful item for your role without changing your dashboard.",
      cta: roleContentLabel[user.role],
      action: addFirstContent,
    },
    {
      id: "verify" as StepId,
      icon: ShieldCheck,
      title: "Get Verified",
      text: "Submit your profile for admin approval and unlock trusted access.",
      cta: "Request Verification",
      action: getVerified,
    },
    {
      id: "earning" as StepId,
      icon: Sparkles,
      title: "Start Earning",
      text: "Finish onboarding and continue to the correct next page for your role.",
      cta: "Finish Setup",
      action: startEarning,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f3f4f6] px-4 py-8">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">StayVista Setup</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">Welcome to StayVista 👋</h1>
              <p className="mt-2 max-w-2xl text-slate-600">Complete these quick steps once. Your original dashboards stay exactly as they are.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              {Object.values(completed).filter(Boolean).length}/4 complete
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map(({ id, icon: Icon, title, text, cta, action }) => (
            <article key={id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Icon className="h-6 w-6" />
                </div>
                {completed[id] && <CheckCircle className="h-6 w-6 text-green-600" />}
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-950">{title}</h2>
              <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-600">{text}</p>
              <button
                type="button"
                onClick={action}
                disabled={loadingStep === id || completed[id]}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff9900] px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-[#f08804] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ClipboardCheck className="h-4 w-4" />
                {completed[id] ? "Completed" : loadingStep === id ? "Working..." : cta}
              </button>
            </article>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <button
            type="button"
            onClick={continueToNext}
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 md:w-auto"
          >
            Continue
          </button>
        </div>
      </section>
    </main>
  );
}
