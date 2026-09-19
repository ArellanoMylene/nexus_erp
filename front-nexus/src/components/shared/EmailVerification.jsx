import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import api from "../../api/axios";

/**
 * Modern 6-digit OTP Email Verification Component.
 *
 * @param {Object} props
 * @param {string} props.email - The email address being verified.
 * @param {Function} props.onVerificationSuccess - Callback when verification completes successfully.
 * @param {Function} props.onBackToLogin - Callback to return to login.
 * @param {Function} [props.onChangeEmail] - Callback to return to registration to change email.
 */
const EmailVerification = ({
  email,
  onVerificationSuccess,
  onBackToLogin,
  onChangeEmail,
}) => {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  const inputRefs = useRef([]);

  // Focus the first input box upon mounting
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer for code resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal) {
      const nextDigits = [...digits];
      nextDigits[index] = "";
      setDigits(nextDigits);
      return;
    }

    // If user typed/pasted single digit
    const char = cleanVal.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);
    setErrorMessage("");

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const numericChars = pastedData.replace(/\D/g, "").slice(0, 6).split("");

    if (numericChars.length === 0) return;

    const nextDigits = [...digits];
    numericChars.forEach((ch, idx) => {
      if (idx < 6) nextDigits[idx] = ch;
    });
    setDigits(nextDigits);
    setErrorMessage("");

    // Focus last filled box or 6th box
    const targetIdx = Math.min(numericChars.length, 5);
    inputRefs.current[targetIdx]?.focus();

    // If full 6 digits pasted, trigger submit automatically
    if (numericChars.length === 6) {
      submitVerification(numericChars.join(""));
    }
  };

  const submitVerification = async (codeToVerify) => {
    const code = codeToVerify || digits.join("");
    if (code.length !== 6) {
      setErrorMessage("Please enter all 6 digits of your verification code.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await api.post("/api/auth/verify-email", {
        email,
        code,
      });

      setIsVerified(true);
      setSuccessMessage(
        response.data.message || "Email verified successfully! Registration is now complete."
      );

      if (onVerificationSuccess) {
        setTimeout(() => {
          onVerificationSuccess(response.data);
        }, 1500);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to verify code. Please double check and try again.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return;

    setResending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await api.post("/api/auth/resend-verification", {
        email,
      });
      setSuccessMessage(
        response.data.message || "A new 6-digit verification code has been sent to your email."
      );
      setResendCooldown(60);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Failed to resend code. Please try again later."
      );
    } finally {
      setResending(false);
    }
  };

  const isFormComplete = digits.every((d) => d !== "");

  // Mask email for display: e.g. "j***n@domain.com"
  const maskedEmail = (() => {
    if (!email) return "your email";
    const parts = email.split("@");
    if (parts.length !== 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
  })();

  return (
    <div className="w-full flex flex-col md:flex-row min-h-[460px] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
      {/* Left Aesthetic Brand Panel */}
      <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 p-6 md:p-8 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-amber-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-44 h-44 rounded-full bg-blue-400 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-white/10 backdrop-blur rounded-xl border border-white/10">
              <ShieldCheck size={22} className="text-amber-400" />
            </div>
            <span className="font-bold text-xl tracking-wide text-white">Nexus</span>
          </div>

          <div className="space-y-2 mt-4">
            <span className="inline-block px-2.5 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-500/30">
              Step 2 of 2: Verification
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
              Verify Your Email
            </h2>
            <p className="text-blue-200/80 text-xs md:text-sm leading-relaxed mt-2">
              Registration is only finalized after verifying your email address. This secures your student records and portal access.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 text-xs text-blue-200/70">
            <Lock size={14} className="text-amber-400 shrink-0" />
            <span>256-bit encrypted authentication & verification</span>
          </div>
        </div>
      </div>

      {/* Right Interactive Code Form */}
      <div className="w-full md:w-7/12 p-6 md:p-10 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          {/* Header & Back Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>

            {onChangeEmail && (
              <button
                type="button"
                onClick={onChangeEmail}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
              >
                Change email
              </button>
            )}
          </div>

          {/* Email Notice Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We sent a 6-digit verification code to:
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
                  {email || "your email address"}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Check your inbox and spam folder. Code is valid for 15 minutes.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl flex items-start gap-2.5 text-red-600 dark:text-red-400 text-xs animate-shake">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Verification Verified State */}
          {isVerified ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Registration Successful!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Your account is now active and verified. You may now log in to the portal with your credentials.
              </p>
              <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-amber-600/20 transition-all transform hover:-translate-y-0.5"
              >
                Proceed to Login <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            /* OTP Input Form */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitVerification();
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 text-center">
                  Enter 6-Digit Verification Code
                </label>

                {/* 6 Digit Boxes */}
                <div
                  className="flex items-center justify-center gap-2 sm:gap-3"
                  onPaste={handlePaste}
                >
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={loading}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-amber-500/20 ${
                        digit
                          ? "border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : "border-slate-300 dark:border-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={loading || !isFormComplete}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 shadow-lg transition-all ${
                    loading || !isFormComplete
                      ? "bg-slate-400 cursor-not-allowed shadow-none"
                      : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25 transform hover:-translate-y-0.5"
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      Verify & Complete Registration <ArrowRight size={15} />
                    </>
                  )}
                </button>

                {/* Resend Code Section */}
                <div className="flex items-center justify-between text-xs pt-2">
                  <span className="text-slate-500 dark:text-slate-400">
                    Didn’t receive the code?
                  </span>
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0 || resending}
                    className={`font-semibold transition-colors flex items-center gap-1 ${
                      resendCooldown > 0 || resending
                        ? "text-slate-400 cursor-not-allowed"
                        : "text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline"
                    }`}
                  >
                    {resending ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" /> Sending...
                      </>
                    ) : resendCooldown > 0 ? (
                      `Resend in ${resendCooldown}s`
                    ) : (
                      "Resend Code"
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Nexus Academic Management System &bull; Email Verification Protocol
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
