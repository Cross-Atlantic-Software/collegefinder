"use client";

import React from "react";
import { BiCheckCircle, BiErrorCircle, BiInfoCircle, BiX } from "react-icons/bi";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationProps {
  type: NotificationType;
  message: string;
  onClose?: () => void;
  className?: string;
  autoClose?: boolean;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  onClose,
  className = "",
  autoClose = false,
  duration = 3000,
}) => {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const typeStyles = {
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      text: "text-emerald-800",
      icon: BiCheckCircle,
      iconColor: "text-emerald-600",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-300",
      text: "text-red-800",
      icon: BiErrorCircle,
      iconColor: "text-red-600",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-300",
      text: "text-amber-800",
      icon: BiInfoCircle,
      iconColor: "text-amber-600",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      text: "text-blue-800",
      icon: BiInfoCircle,
      iconColor: "text-blue-600",
    },
  };

  const styles = typeStyles[type];
  const Icon = styles.icon;

  return (
    <div
      className={`
        rounded-md border px-4 py-3 text-sm
        ${styles.bg} ${styles.border} ${styles.text}
        flex items-start gap-3
        ${className}
      `}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${styles.iconColor}`} />
      <p className="flex-1">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className={`
            flex-shrink-0 hover:opacity-70 transition-opacity
            ${styles.text}
          `}
          aria-label="Close notification"
        >
          <BiX className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default Notification;

