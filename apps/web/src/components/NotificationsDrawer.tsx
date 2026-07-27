"use client"

import React, { useState } from "react"

export interface NotificationItem {
  id: string
  type: "FOLLOW" | "MENTION" | "POST"
  actorName: string
  title: string
  timestamp: string
  read: boolean
}

export interface NotificationsDrawerProps {
  initialNotifications?: NotificationItem[]
  isOpen: boolean
  onClose: () => void
  onMarkAsRead?: (notificationId: string) => void
}

export function NotificationsDrawer({
  initialNotifications = [],
  isOpen,
  onClose,
  onMarkAsRead,
}: NotificationsDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)

  if (!isOpen) return null

  const handleMarkRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    if (onMarkAsRead) {
      onMarkAsRead(id)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div
      aria-label="Notifications drawer overlay"
      className="fixed inset-0 bg-black/50 z-50 flex justify-end"
      onClick={onClose}
      data-testid="notifications-drawer-backdrop"
    >
      <div
        className="w-80 md:w-96 bg-slate-900 h-full p-4 border-l border-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        data-testid="notifications-drawer-panel"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span
                data-testid="unread-badge"
                className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold"
              >
                {unreadCount}
              </span>
            )}
          </div>
          <button
            type="button"
            data-testid="close-drawer-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8" data-testid="empty-notif-msg">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                data-testid={`notif-item-${notif.id}`}
                className={`p-3 rounded-lg border transition-colors ${
                  notif.read
                    ? "bg-slate-800/40 border-slate-800/60"
                    : "bg-indigo-950/40 border-indigo-500/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-700 text-indigo-300">
                      {notif.type}
                    </span>
                    <span className="text-xs text-slate-400">{notif.timestamp}</span>
                  </div>
                  {!notif.read && (
                    <button
                      type="button"
                      data-testid={`mark-read-btn-${notif.id}`}
                      onClick={() => handleMarkRead(notif.id)}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-200 font-medium">{notif.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">by {notif.actorName}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
