"use client";

import { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Button, Notification } from "../../shared";
import { changePassword } from "@/api/auth/profile";
import { PasswordStrengthIndicator } from "@/components/admin/PasswordStrengthIndicator";
import { isPasswordStrong } from "@/lib/passwordStrength";
import { useAuth } from "@/contexts/AuthContext";

const inputBase =
  "w-full rounded-xl border border-black/15 bg-[#f8fbff] px-4 py-3 text-sm text-black placeholder:text-black/40 transition focus:outline-none focus:border-[#FAD53C] focus:bg-white";

export default function ResetPasswordTab() {
  const { user, refreshUser } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasPassword = user?.has_password !== false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!hasPassword) return;

    if (!oldPassword.trim()) {
      setError("Please enter your current password.");
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      setError("New password does not meet all strength requirements.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (oldPassword === newPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setSaving(true);
    try {
      const response = await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      });
      if (response.success) {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccess(true);
        await refreshUser();
        setTimeout(() => setSuccess(false), 4000);
      } else {
        const msg =
          response.message ||
          (response.errors && response.errors[0]?.msg) ||
          "Failed to update password.";
        setError(msg);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  if (!hasPassword) {
    return (
      <div className="space-y-4 text-sm text-black">
        <div>
          <h2 className="text-lg font-bold text-black">Reset password</h2>
          <p className="mt-1 text-xs text-black/55">
            Your account uses Google or Facebook sign-in. There is no separate password to change here.
          </p>
        </div>
        <Notification
          type="info"
          message="Password change is only available for accounts that use email and password to sign in."
          onClose={() => {}}
        />
      </div>
    );
  }

  const canSubmit =
    oldPassword.length > 0 &&
    isPasswordStrong(newPassword) &&
    newPassword === confirmPassword &&
    oldPassword !== newPassword &&
    !saving;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-sm text-black">
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold text-black">Reset password</h2>
          <p className="mt-1 text-xs text-black/55">
            Enter your current password, then choose a strong new password. You will use the new password next time you
            sign in.
          </p>
        </div>

        {error && <Notification type="error" message={error} onClose={() => setError(null)} />}

        {success && (
          <Notification
            type="success"
            message="Your password was updated successfully."
            onClose={() => setSuccess(false)}
            autoClose
            duration={4000}
          />
        )}

        <div className="space-y-4 pt-4 border-t border-black/5">
          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[120px] text-right sm:w-[140px]">
              Current password
            </label>
            <div className="flex-1 min-w-0 relative">
              <input
                type={showOld ? "text" : "password"}
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className={`${inputBase} pr-11`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowOld((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/70"
                aria-label={showOld ? "Hide password" : "Show password"}
              >
                {showOld ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[120px] text-right pt-3 sm:w-[140px]">
              New password
            </label>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputBase} pr-11`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/70"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={newPassword} />
            </div>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <label className="shrink-0 text-xs font-semibold text-black/55 w-[120px] text-right sm:w-[140px]">
              Confirm new
            </label>
            <div className="flex-1 min-w-0 relative">
              <input
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`${inputBase} pr-11 ${
                  confirmPassword.length > 0 && newPassword !== confirmPassword ? "border-red-400" : ""
                }`}
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/70"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-xs text-red-500 pl-[128px] sm:pl-[148px]">Passwords do not match.</p>
          )}
        </div>
      </div>

      <div className="pt-2 flex flex-col gap-4 sm:flex-row">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full flex-1 !rounded-full border border-black bg-black text-white hover:bg-neutral-900"
          disabled={!canSubmit}
        >
          {saving ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
