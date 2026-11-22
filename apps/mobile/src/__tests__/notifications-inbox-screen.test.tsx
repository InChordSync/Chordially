import React from "react"
import { render, fireEvent, waitFor } from "@testing-library/react-native"
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

  it("marks a notification read once and calls onMarkRead (#1417)", async () => {
    const onMarkRead = jest.fn().mockResolvedValue(undefined)
    const { getByTestId, getByText, queryByText } = render(
      <NotificationsInboxScreen initialNotifications={sampleMobileNotifs} onMarkRead={onMarkRead} />
    )

    fireEvent.press(getByTestId("mobile-notif-item-mn1"))
    await waitFor(() => expect(onMarkRead).toHaveBeenCalledWith("mn1"))
    expect(getByText("Notifications (0 unread)")).toBeTruthy()

    fireEvent.press(getByTestId("mobile-notif-item-mn1"))
    expect(onMarkRead).toHaveBeenCalledTimes(1)
    expect(queryByText("Notifications (1 unread)")).toBeNull()
  })

  it("syncs when initialNotifications arrive later and shows loading skeleton (#1418)", async () => {
    const { getByTestId, queryByTestId, rerender, getByText } = render(
      <NotificationsInboxScreen initialNotifications={[]} isLoading />
    )

    expect(getByTestId("notifications-loading")).toBeTruthy()
    rerender(<NotificationsInboxScreen initialNotifications={sampleMobileNotifs} isLoading={false} />)

    await waitFor(() => expect(queryByTestId("notifications-loading")).toBeNull())
    expect(getByText("New Follower")).toBeTruthy()
  })
})
