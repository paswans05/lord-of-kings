import { useEffect, useState } from "react";
import { Check, ShieldCheck, Lock, X, CreditCard, Mail } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPrivateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  playerName?: string;
}

export function RazorpayPrivateRoomModal({
  isOpen,
  onClose,
  onSuccess,
  playerName = "Commander",
}: RazorpayPrivateRoomModalProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("kg.payment_email") || "";
    }
    return "";
  });

  useEffect(() => {
    if (typeof window !== "undefined" && !window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  if (!isOpen) return null;

  const handleRazorpayPayment = () => {
    setLoading(true);

    if (email.trim() && typeof window !== "undefined") {
      try {
        window.localStorage.setItem("kg.payment_email", email.trim());
      } catch {}
    }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_DravidaChess10";

    const options = {
      key: razorpayKey,
      amount: 2500, // 25 INR = 2500 Paise
      currency: "INR",
      name: "Dravida 3D Chess",
      description: "Private Room Hosting Pass (₹25)",
      image: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png",
      handler: function (response: any) {
        console.log("[Razorpay] Private Room Payment successful:", response);
        setLoading(false);
        onSuccess();
        onClose();
      },
      prefill: {
        name: playerName,
        email: email.trim() || `${playerName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
        contact: "9999999999",
      },
      theme: {
        color: "#9333ea",
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
        },
      },
    };

    try {
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        simulatePayment();
      }
    } catch (err) {
      console.warn("[Razorpay] Checkout open error:", err);
      simulatePayment();
    }
  };

  const simulatePayment = () => {
    setLoading(true);
    if (email.trim() && typeof window !== "undefined") {
      try {
        window.localStorage.setItem("kg.payment_email", email.trim());
      } catch {}
    }
    setTimeout(() => {
      setLoading(false);
      onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md pointer-events-auto">
      <div className="mc-slate mc-goldleaf flex w-full max-w-md flex-col rounded-2xl border border-[#c084fc]/50 bg-gradient-to-b from-[#250d42] via-[#15062b] to-[#0b0219] p-6 shadow-[0_20px_50px_rgba(192,132,252,0.4)] relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-amber-500 text-white shadow-[0_0_25px_rgba(245,158,11,0.6)] mb-3 animate-pulse">
            <Lock size={24} />
          </div>

          <span className="text-[0.62rem] font-extrabold tracking-[0.3em] text-[#c084fc] uppercase">
            HOST PRIVATE ROOM
          </span>
          <h3 className="mc-display text-2xl font-extrabold text-white mt-1">
            Secret Friend Battle Room
          </h3>
          <p className="mt-1 text-xs text-[#a5b9e0]">
            Create a passwordless private room. Hidden from the public lobby, accessible only via your invite code & link!
          </p>

          <div className="my-3 flex items-baseline gap-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 px-5 py-2">
            <span className="text-3xl font-black text-[#f2e2bd]">₹25</span>
            <span className="text-xs font-bold text-amber-400">INR (Private Room Hosting Fee)</span>
          </div>

          <div className="w-full space-y-2 text-left text-xs text-[#f2e2bd] my-1 bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[#c084fc]">
                <Lock size={12} />
              </div>
              <span><strong>100% Private & Secret:</strong> Never listed in public homepage lobbies</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                <ShieldCheck size={12} />
              </div>
              <span><strong>Max 2 Players Limit:</strong> Locked duel between you and your friend</span>
            </div>
          </div>

          {/* Email Address Field */}
          <div className="w-full text-left my-2 space-y-1">
            <label className="text-[0.62rem] font-bold tracking-wider text-[#c084fc] uppercase">
              Your Email Address (for Payment Receipt)
            </label>
            <div className="relative flex items-center">
              <Mail size={14} className="absolute left-3 text-[#c084fc]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="commander@gmail.com"
                className="w-full rounded-xl border border-white/15 bg-black/40 pl-9 pr-3 py-2 text-xs font-semibold text-white placeholder-white/40 outline-none focus:border-[#c084fc] focus:ring-1 focus:ring-[#c084fc] transition-all"
              />
            </div>
          </div>

          <div className="w-full space-y-2 mt-2">
            <button
              type="button"
              onClick={handleRazorpayPayment}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-[#c084fc] py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              <CreditCard size={16} />
              {loading ? "Processing..." : "Pay ₹25 & Create Private Room"}
            </button>

            <button
              type="button"
              onClick={simulatePayment}
              disabled={loading}
              className="mc-chip flex w-full items-center justify-center gap-1.5 py-2 text-xs text-[#a5b9e0] hover:text-white"
            >
              <Check size={13} className="text-emerald-400" />
              <span>Instant Test Unlock (Demo Mode)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
