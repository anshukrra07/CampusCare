import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  PresentationChartBarIcon,
  UserIcon,
  BellIcon,
  UserGroupIcon,
  FaceSmileIcon,
  CalendarIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  Bars3Icon,
  XMarkIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

export default function Layout({ children }) {
  const [user] = useAuthState(auth);
  const [name, setName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchUserName = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().name) {
          setName(docSnap.data().name);
        } else {
          setName(user.email); // fallback if no name in Firestore
        }
      }
    };
    fetchUserName();
  }, [user]);

  const navigationItems = [
    { name: "Home", href: "/", icon: HomeIcon },
    { name: "Assessments", href: "/assessments", icon: ChartBarIcon },
    { name: "Chat", href: "/chat", icon: ChatBubbleLeftRightIcon },
    { name: "Dashboard", href: "/dashboard", icon: PresentationChartBarIcon },

    { name: "Profile", href: "/profile", icon: UserIcon },
    { name: "Notifications", href: "/notifications", icon: BellIcon },
    { name: "Support Groups", href: "/support-groups", icon: UserGroupIcon },
    { name: "Mood Tracking", href: "/mood-tracking", icon: FaceSmileIcon },
    { name: "Appointments", href: "/appointments", icon: CalendarIcon },
    { name: "Connect", href: "/connect", icon: PhoneIcon },
    { name: "Resources", href: "/resources", icon: BookOpenIcon },
  ];

  const NavItem = ({ item }) => {
    const isActive = location.pathname === item.href;
    return (
      <Link
        to={item.href}
        className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? "bg-indigo-600 text-white shadow-lg"
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon className="h-5 w-5 mr-3" />
        <span className="font-medium">{item.name}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo and close button */}
          <div className="flex items-center justify-between px-6 py-6">
            <div className="flex items-center">
              <div className="bg-indigo-600 p-2 rounded-xl">
                <FaceSmileIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-white">CampusCare</h1>
            </div>
            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navigationItems.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </nav>

          {/* Crisis Support Button */}
          <div className="p-4">
            <Link
              to="/crisis-support"
              className="flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-medium transition-colors duration-200 shadow-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Crisis Support
            </Link>
          </div>

        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                className="lg:hidden text-gray-600 hover:text-gray-900 mr-4"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Mental Wellness Dashboard</h1>
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="bg-indigo-500 p-2 rounded-full">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <button
                  onClick={() => auth.signOut()}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 shadow-sm"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-7xl mx-auto py-6 px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}