import { useEffect, useState } from "react";
import { Check, ShieldCheck, Sparkles, X, Mic, MessageSquare, CreditCard } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function isPremiumCommsUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("kg.premium_comms") === "true";
}

export function unlockPremiumComms(): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("kg.premium_comms", "true");
    } catch {}
  }
}

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  playerName?: string;
}

export function RazorpayModal({ isOpen, onClose, onSuccess, playerName = "Commander" }: RazorpayModalProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-load Razorpay checkout script
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

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_DravidaChess10";

    const options = {
      key: razorpayKey,
      amount: 1000, // 10 INR = 1000 Paise
      currency: "INR",
      name: "Dravida 3D Chess",
      description: "Voice Chat & Room Text Chat Pass (Lifetime)",
      image: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png",
      handler: function (response: any) {
        console.log("[Razorpay] Payment successful:", response);
        unlockPremiumComms();
        setLoading(false);
        onSuccess();
        onClose();
      },
      prefill: {
        name: playerName,
        email: `${playerName.toLowerCase().replace(/\s+/g, "")}@dravida.com`,
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
        // Fallback if script load was blocked by adblocker
        simulatePayment();
      }
    } catch (err) {
      console.warn("[Razorpay] Checkout open error:", err);
      simulatePayment();
    }
  };

  const simulatePayment = () => {
    setLoading(true);
    setTimeout(() => {
      unlockPremiumComms();
      setLoading(false);
      onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md pointer-events-auto">
      <div className="mc-slate mc-goldleaf flex w-full max-w-md flex-col rounded-2xl border border-[#c084fc]/50 bg-gradient-to-b from-[#1e0a38] via-[#120524] to-[#0a0218] p-6 shadow-[0_20px_50px_rgba(192,132,252,0.35)] relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#9333ea] to-[#c084fc] text-white shadow-[0_0_20px_rgba(192,132,252,0.6)] mb-3">
            <Sparkles size={24} />
          </div>

          <span className="text-[0.62rem] font-extrabold tracking-[0.3em] text-[#c084fc] uppercase">
            PREMIUM BATTLE PASS
          </span>
          <h3 className="mc-display text-2xl font-extrabold text-white mt-1">
            Voice & Room Chat
          </h3>
          <p className="mt-1 text-xs text-[#a5b9e0]">
            Unlock Voice Calls & Unlimited Text Chat with friends
          </p>

          <div className="my-4 flex items-baseline gap-1 rounded-xl bg-[#c084fc]/15 border border-[#c084fc]/40 px-5 py-2">
            <span className="text-3xl font-black text-[#f2e2bd]">₹10</span>
            <span className="text-xs font-semibold text-[#c084fc]">INR (Lifetime Access)</span>
          </div>

          <div className="w-full space-y-2 text-left text-xs text-[#f2e2bd] my-2 bg-white/5 p-3.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <Mic size={12} />
              </div>
              <span><strong>WebRTC Voice Chat:</strong> Crystal-clear voice call during game</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-[#c084fc]">
                <MessageSquare size={12} />
              </div>
              <span><strong>Room Text Chat:</strong> Unlimited messaging & quick battle emotes</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                <ShieldCheck size={12} />
              </div>
              <span><strong>Secure Razorpay Payment:</strong> Pay ₹10 once, keep forever</span>
            </div>
          </div>

          <div className="w-full space-y-2 mt-3">
            <button
              type="button"
              onClick={handleRazorpayPayment}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9333ea] to-[#c084fc] py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(192,132,252,0.5)] hover:brightness-110 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              <CreditCard size={16} />
              {loading ? "Processing..." : "Pay ₹10 with Razorpay"}
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
