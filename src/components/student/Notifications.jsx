import React, { useState } from "react";
import {
  BellIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  HeartIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import {
  BellIcon as BellIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
  HeartIcon as HeartIconSolid,
} from "@heroicons/react/24/solid";

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "reminder",
      title: "Daily Mood Check-in",
      message: "Don't forget to log your mood today! It helps track your wellness journey.",
      time: "2 hours ago",
      read: false,
      icon: HeartIcon,
      solidIcon: HeartIconSolid,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      id: 2,
      type: "appointment",
      title: "Upcoming Session",
      message: "You have a counseling session scheduled for tomorrow at 3:00 PM.",
      time: "5 hours ago",
      read: false,
      icon: CalendarIcon,
      solidIcon: CalendarIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: 3,
      type: "alert",
      title: "Crisis Support Activated",
      message: "Your recent message triggered our support system. A counselor will reach out soon.",
      time: "1 day ago",
      read: true,
      icon: ExclamationTriangleIcon,
      solidIcon: ExclamationTriangleIconSolid,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      id: 4,
      type: "info",
      title: "New Resource Available",
      message: "We've added new coping strategies to help with anxiety management.",
      time: "2 days ago",
      read: true,
      icon: InformationCircleIcon,
      solidIcon: InformationCircleIconSolid,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      id: 5,
      type: "chat",
      title: "AI Counselor Update",
      message: "Your AI counselor has been updated with new response capabilities.",
      time: "3 days ago",
      read: true,
      icon: ChatBubbleLeftIcon,
      solidIcon: ChatBubbleLeftIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ]);

  const [filter, setFilter] = useState("all");
  const [settings, setSettings] = useState({
    moodReminders: true,
    appointments: true,
    crisisAlerts: true,
    resources: true,
    chatUpdates: false,
  });

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === "unread") return !notif.read;
    if (filter === "read") return notif.read;
    return true;
  });

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-full">
              <BellIconSolid className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Notifications</h1>
              <p className="text-indigo-100">
                Stay updated with your mental wellness journey
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-full px-4 py-2">
              <span className="text-2xl font-bold">{unreadCount}</span>
              <p className="text-sm text-indigo-100">Unread</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filter and Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    filter === "all"
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    filter === "unread"
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter("read")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    filter === "read"
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Read ({notifications.length - unreadCount})
                </button>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  Mark All Read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <BellIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Cog6ToothIcon className="w-5 h-5 mr-2 text-indigo-600" />
              Notification Settings
            </h3>
            
            <div className="space-y-4">
              <SettingToggle
                label="Mood Reminders"
                description="Daily check-in reminders"
                value={settings.moodReminders}
                onChange={(value) => setSettings({...settings, moodReminders: value})}
              />
              <SettingToggle
                label="Appointment Alerts"
                description="Upcoming session notifications"
                value={settings.appointments}
                onChange={(value) => setSettings({...settings, appointments: value})}
              />
              <SettingToggle
                label="Crisis Alerts"
                description="Emergency support notifications"
                value={settings.crisisAlerts}
                onChange={(value) => setSettings({...settings, crisisAlerts: value})}
              />
              <SettingToggle
                label="New Resources"
                description="Updates about new content"
                value={settings.resources}
                onChange={(value) => setSettings({...settings, resources: value})}
              />
              <SettingToggle
                label="Chat Updates"
                description="AI counselor improvements"
                value={settings.chatUpdates}
                onChange={(value) => setSettings({...settings, chatUpdates: value})}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total notifications</span>
                <span className="font-medium">{notifications.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mood reminders</span>
                <span className="font-medium">
                  {notifications.filter(n => n.type === "reminder").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Appointments</span>
                <span className="font-medium">
                  {notifications.filter(n => n.type === "appointment").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alerts</span>
                <span className="font-medium">
                  {notifications.filter(n => n.type === "alert").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationCard({ notification, onMarkRead, onDelete }) {
  const Icon = notification.read ? notification.icon : notification.solidIcon;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 hover:shadow-md ${
      !notification.read ? "border-indigo-200 bg-indigo-50/30" : "border-gray-200"
    }`}>
      <div className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`p-2 rounded-lg ${notification.bgColor}`}>
            <Icon className={`w-5 h-5 ${notification.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`font-medium ${
                  !notification.read ? "text-gray-900" : "text-gray-700"
                }`}>
                  {notification.title}
                  {!notification.read && (
                    <span className="ml-2 w-2 h-2 bg-indigo-500 rounded-full inline-block"></span>
                  )}
                </h3>
                <p className="mt-1 text-gray-600 text-sm">{notification.message}</p>
                <p className="mt-2 text-xs text-gray-500">{notification.time}</p>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {!notification.read && (
                  <button
                    onClick={() => onMarkRead(notification.id)}
                    className="text-indigo-600 hover:text-indigo-700 p-1 rounded transition-colors duration-200"
                    title="Mark as read"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onDelete(notification.id)}
                  className="text-red-600 hover:text-red-700 p-1 rounded transition-colors duration-200"
                  title="Delete notification"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingToggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
          value ? "bg-indigo-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}