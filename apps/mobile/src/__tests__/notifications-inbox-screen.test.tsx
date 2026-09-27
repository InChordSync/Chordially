import React from "react"
import { render, fireEvent } from "@testing-library/react-native"
import { NotificationsInboxScreen } from "../screens/NotificationsInboxScreen"

const sampleMobileNotifs = [
  { id: "mn1", title: "New Follower", body: "Alex followed you.", read: false, createdAt: "10m ago" },
]

describe("NotificationsInboxScreen (#697)", () => {
  it("renders inbox screen, displays unread count and marks all read", () => {
    const mockMarkAll = jest.fn()
    const { getByTestId, getByText } = render(
      <NotificationsInboxScreen initialNotifications={sampleMobileNotifs} onMarkAllRead={mockMarkAll} />
    )

    expect(getByTestId("notifications-inbox-screen")).toBeTruthy()
    expect(getByText("Notifications (1 unread)")).toBeTruthy()

    const markAllBtn = getByTestId("mark-all-read-btn")
    fireEvent.press(markAllBtn)

    expect(mockMarkAll).toHaveBeenCalledTimes(1)
    expect(getByText("Notifications (0 unread)")).toBeTruthy()
  })
})
