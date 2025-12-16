import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@mui/material";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  collectionGroup,
  updateDoc,
} from "firebase/firestore";
import {
  ChartBarIcon,
  BellAlertIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ArrowTrendingUpIcon,
  ShieldExclamationIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

function StatCard({ icon: Icon, title, value, subtitle, color = "indigo" }) {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      iconBg: "bg-indigo-100",
      iconText: "text-indigo-600",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      iconBg: "bg-purple-100",
      iconText: "text-purple-600",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      iconBg: "bg-rose-100",
      iconText: "text-rose-600",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-600",
    },
  };
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className={`${c.bg} rounded-2xl p-6 border border-gray-200 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-3xl font-bold ${c.text}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`${c.iconBg} p-3 rounded-xl`}>
          <Icon className={`h-6 w-6 ${c.iconText}`} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [role, setRole] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  // ✅ fetch role
  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setRole(snap.data().role); // "student" or "counselor"
        }
      }
    };
    fetchRole();
  }, [user]);

  // Firestore-based alerts (collectionGroup for counselors)
  const fetchAlertsFromFirestore = async () => {
    try {
      // collectionGroup to pull alerts across all users (counselor view)
      const q = query(collectionGroup(db, "alerts"), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => {
        const data = d.data() || {};
        // parent.parent is the user document (users/{userId}/alerts/{alertId})
        const userDoc = d.ref.parent?.parent;
        const user_id = userDoc ? userDoc.id : data.user_id || null;
        // handle Firestore Timestamp or plain string
        let created_at = data.created_at;
        try {
          if (created_at && typeof created_at.toDate === "function") {
            created_at = created_at.toDate().toISOString();
          } else if (created_at instanceof Date) {
            created_at = created_at.toISOString();
          } else if (!created_at) {
            created_at = new Date().toISOString();
          }
        } catch {
          created_at = String(created_at || new Date().toISOString());
        }
        return {
          id: d.id,
          user_id,
          reason: data.reason || "Alert",
          severity: data.severity || "high",
          message: data.message || "",
          chat_id: data.chat_id || null,
          created_at,
          resolved: !!data.resolved,
        };
      });
      setAlerts(items.slice(0, 50));
    } catch (err) {
      console.error("Error fetching alerts (collectionGroup):", err);
      // fallback: empty array
      setAlerts([]);
    }
  };

  // Fetch student-level alerts (for student view)
  const fetchStudentAlerts = async (uid) => {
    try {
      const q = query(collection(db, "users", uid, "alerts"), orderBy("created_at", "desc"));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => {
        const data = d.data() || {};
        let created_at = data.created_at;
        try {
          if (created_at && typeof created_at.toDate === "function") {
            created_at = created_at.toDate().toISOString();
          } else if (created_at instanceof Date) {
            created_at = created_at.toISOString();
          } else if (!created_at) {
            created_at = new Date().toISOString();
          }
        } catch {
          created_at = String(created_at || new Date().toISOString());
        }
        return {
          id: d.id,
          user_id: uid,
          reason: data.reason || "Alert",
          severity: data.severity || "high",
          message: data.message || "",
          chat_id: data.chat_id || null,
          created_at,
          resolved: !!data.resolved,
        };
      });
      setAlerts(items.slice(0, 50));
    } catch (err) {
      console.error("Error fetching student alerts:", err);
      setAlerts([]);
    }
  };

  const markResolved = async (id, userId) => {
    try {
      if (!id || !userId) {
        console.warn("markResolved missing id or userId");
        return;
      }
      const alertRef = doc(db, "users", userId, "alerts", id);
      await updateDoc(alertRef, { resolved: true });
      // Refresh list
      if (role === "counselor") await fetchAlertsFromFirestore();
      else if (role === "student") await fetchStudentAlerts(user.uid);
    } catch (err) {
      console.error("Error marking resolved:", err);
    }
  };

  const columns = [
    { field: "user_id", headerName: "User ID", width: 180 },
    { field: "reason", headerName: "Reason", width: 240 },
    { field: "severity", headerName: "Severity", width: 120 },
    { field: "message", headerName: "Message", width: 300 },
    { field: "chat_id", headerName: "Chat ID", width: 220 },
    { field: "created_at", headerName: "Created", width: 200 },
    { field: "resolved", headerName: "Resolved", width: 110 },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      renderCell: (params) => {
        const row = params.row;
        return (
          <div className="flex space-x-2">
            <Button
              variant="contained"
              color="primary"
              onClick={() => markResolved(row.id, row.user_id)}
              size="small"
            >
              Mark resolved
            </Button>
            {row.chat_id && (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => {
                  // try to open the chat thread for that user & message
                  const url = `/chat?user=${encodeURIComponent(row.user_id)}&highlight=${encodeURIComponent(
                    row.chat_id
                  )}`;
                  window.location.href = url;
                }}
              >
                View chat
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  // 🔹 Student: fetch profile + chats + alerts
  const fetchStudentData = async () => {
    if (!user) return;

    // profile
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) setStudentData(snap.data());

    // chat history
    try {
      const q = query(collection(db, "users", user.uid, "chats"), orderBy("created_at", "asc"));
      const chatsSnap = await getDocs(q);
      setChatHistory(chatsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching chats:", err);
      setChatHistory([]);
    }

    // alerts from Firestore (student-level)
    await fetchStudentAlerts(user.uid);
  };

  // ✅ run correct fetch
  useEffect(() => {
    if (!role || !user) return;
    if (role === "student") fetchStudentData();
    if (role === "counselor") fetchAlertsFromFirestore();
  }, [role, user]);

  // 🔹 Render Student Dashboard
  if (role === "student") {
    const chatsCount = chatHistory.length;
    const lastAlert = alerts[0];

    // Debug: Log available chat IDs and alert chat IDs
    // console.log('Available chat IDs:', chatHistory.map(msg => msg.id));
    // console.log('Alert chat IDs:', alerts.map(alert => alert.chat_id));

    const handleViewChat = (alertChatId) => {
      const el = document.getElementById(`chat-${alertChatId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-4", "ring-rose-400", "ring-offset-2", "bg-rose-100");
        setTimeout(() => {
          el.classList.remove("ring-4", "ring-rose-400", "ring-offset-2", "bg-rose-100");
        }, 3000);
      } else {
        // If the message isn't visible in the small preview, go to full chat
        window.location.href = `/chat?highlight=${alertChatId}`;
      }
    };

    return (
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back{studentData?.displayName ? ", " + studentData.displayName.split(" ")[0] : ""}!</h1>
              <p className="text-indigo-100">Here's a quick snapshot of your wellness activity</p>
            </div>
            <ArrowTrendingUpIcon className="h-12 w-12 text-white/30" />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={ChartBarIcon} title="Assessments" value="3" subtitle="Completed" color="indigo" />
          <StatCard icon={ChatBubbleLeftRightIcon} title="Chats" value={String(chatsCount)} subtitle="Messages" color="purple" />
          <StatCard icon={BellAlertIcon} title="Alerts" value={String(alerts.length)} subtitle={alerts.length ? (lastAlert?.severity || "-") + " recent" : "No alerts"} color="rose" />
          <StatCard icon={HeartIcon} title="Streak" value="5" subtitle="Days in a row" color="emerald" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Chats */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Chat Activity</h2>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto space-y-3" id="chat-history-container">
              {chatHistory.length === 0 ? (
                <p className="text-gray-600">No messages yet. Start a conversation in Chat.</p>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    id={`chat-${msg.id}`}
                    className={`flex items-start space-x-3 ${msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                  >
                    <div className={`p-2 rounded-full ${msg.role === "user" ? "bg-indigo-500" : "bg-gray-300"}`}>
                      <UserIcon className={`h-4 w-4 ${msg.role === "user" ? "text-white" : "text-gray-700"}`} />
                    </div>
                    <div className={`rounded-2xl px-4 py-3 shadow-sm border max-w-xl ${msg.role === "user" ? "bg-indigo-50 border-indigo-200" : "bg-white"}`}>
                      <p className="text-sm text-gray-900">{msg.text}</p>
                      {msg.created_at?.seconds ? (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(msg.created_at.seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      ) : (
                        msg.created_at && <p className="text-xs text-gray-500 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center">
              <ShieldExclamationIcon className="h-5 w-5 text-rose-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">My Alerts</h2>
            </div>
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-gray-600">No alerts found.</p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-xl border ${alert.severity === "high" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"}`}>
                    <p className="text-sm text-gray-900 font-medium">{alert.reason}</p>
                    {alert.message && <p className="text-sm text-gray-700 italic mt-1">"{alert.message}"</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{new Date(alert.created_at).toLocaleString()}</span>
                      {alert.chat_id && (
                        <button
                          onClick={() => handleViewChat(alert.chat_id)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View Chat
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 🔹 Render Counselor Dashboard
  if (role === "counselor") {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold">Counselor Dashboard</h1>
          <p className="text-indigo-100">Review high-risk alerts and recent activity</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center">
              <BellAlertIcon className="h-5 w-5 text-rose-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Crisis Alerts</h2>
            </div>
            <span className="text-sm text-gray-600">{alerts.length} total</span>
          </div>
          <div style={{ height: 560, width: "100%" }}>
            <DataGrid
              rows={alerts}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-64 text-gray-600">
      Loading dashboard...
    </div>
  );
}