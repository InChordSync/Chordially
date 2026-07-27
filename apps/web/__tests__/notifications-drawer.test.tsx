import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { NotificationsDrawer, NotificationItem } from "../src/components/NotificationsDrawer"

const sampleNotifications: NotificationItem[] = [
  {
    id: "n1",
    type: "FOLLOW",
    actorName: "John Doe",
    title: "John started following you",
    timestamp: "5m ago",
    read: false,
  },
]

describe("NotificationsDrawer Component (#696)", () => {
  it("renders notifications drawer and handles marking items read", () => {
    const mockClose = vi.fn()
    const mockMarkRead = vi.fn()

    render(
      <NotificationsDrawer
        isOpen={true}
        onClose={mockClose}
        initialNotifications={sampleNotifications}
        onMarkAsRead={mockMarkRead}
      />
    )

    expect(screen.getByTestId("notifications-drawer-panel")).toBeDefined()
    expect(screen.getByTestId("unread-badge").textContent).toBe("1")

    const markReadBtn = screen.getByTestId("mark-read-btn-n1")
    fireEvent.click(markReadBtn)

    expect(mockMarkRead).toHaveBeenCalledWith("n1")
  })
})
