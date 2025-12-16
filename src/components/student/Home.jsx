import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../lib/firebase";
import React, { useState } from "react";
import {
  ChartBarIcon,
  FaceSmileIcon,
  TrophyIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { ASSESSMENT_TYPES } from "../../data/assessmentDatabase";

export default function Home() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);


  // Get user's first name or fallback to display name
  const getUserName = () => {
    if (!user) return "Guest";
    if (user.displayName) {
      return user.displayName.split(' ')[0]; // Get first name
    }
    if (user.email) {
      return user.email.split('@')[0]; // Use email prefix as fallback
    }
    return "Friend";
  };

  const stats = [
    {
      title: "12",
      subtitle: "Assessments Completed",
      note: "↑ Great progress!",
      icon: ChartBarIcon,
      color: "from-green-400 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "4.2",
      subtitle: "Weekly Mood Average",
      note: "Feeling good",
      icon: FaceSmileIcon,
      color: "from-blue-400 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "7",
      subtitle: "Day Wellness Streak",
      note: "Keep it up!",
      icon: TrophyIcon,
      color: "from-purple-400 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "STABLE",
      subtitle: "Mental Health Status",
      note: "Well managed",
      icon: ShieldCheckIcon,
      color: "from-emerald-400 to-emerald-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Hello, {getUserName()}! 🌟</h1>
            <p className="text-indigo-100 text-lg mb-2">
              Welcome back to CampusCare - your personal mental wellness companion.
            </p>
            <p className="text-indigo-200 text-base">
              Every step you take towards understanding yourself better is progress. You're doing amazing! 💪
            </p>
          </div>
          <div className="hidden md:block">
            <SparklesIcon className="h-16 w-16 text-white opacity-20" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ActionCard
          title="AI-Powered Assessment"
          description="Take our intelligent mental health assessment with personalized follow-up questions."
          buttonText="Start Assessment"
          onClick={() => navigate("/assessments")}
          icon={SparklesIcon}
          gradient="from-purple-500 to-pink-600"
        />
        <ActionCard
          title="Daily Mood Log"
          description="Log your daily mood and discover patterns over time with insights."
          buttonText="Log Mood"
          onClick={() => navigate("/mood-tracking")}
          icon={FaceSmileIcon}
          gradient="from-blue-500 to-blue-700"
        />
        <ActionCard
          title="AI Chat Support"
          description="Connect with our AI counselor for immediate support and guidance."
          buttonText="Start Chat"
          onClick={() => navigate("/chat")}
          icon={ChatBubbleLeftRightIcon}
          gradient="from-indigo-500 to-indigo-700"
        />
        <ActionCard
          title="Wellness Resources"
          description="Explore guided exercises, coping strategies, and mental health resources."
          buttonText="Explore Resources"
          onClick={() => navigate("/resources")}
          icon={HeartIcon}
          gradient="from-emerald-500 to-green-600"
        />
      </div>

      {/* Daily Insights */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-8 border border-teal-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <SparklesIcon className="h-6 w-6 mr-2 text-teal-600" />
              Today's Wellness Insights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-4 border border-teal-100">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                  <h4 className="font-semibold text-gray-900">Mood Stability</h4>
                </div>
                <p className="text-gray-600 text-sm">Your mood has been consistently positive this week. Keep up the great work with your self-care routine!</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-teal-100">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                  <h4 className="font-semibold text-gray-900">Assessment Progress</h4>
                </div>
                <p className="text-gray-600 text-sm">You've shown remarkable improvement in your assessment scores over the past month. Your efforts are paying off!</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-teal-100">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
                  <h4 className="font-semibold text-gray-900">Recommended Action</h4>
                </div>
                <p className="text-gray-600 text-sm">Consider trying our AI-powered assessment for a more personalized mental health evaluation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <ArrowTrendingUpIcon className="h-6 w-6 mr-2 text-indigo-600" />
            Recent Activity
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <ActivityItem
              icon="✨"
              title="Completed AI-Powered Assessment"
              description="Comprehensive mental health screening with personalized insights"
              time="3 hours ago"
              type="success"
            />
            <ActivityItem
              icon="😊"
              title="Logged Daily Mood"
              description="Feeling optimistic today - 7-day streak!"
              time="5 hours ago"
              type="mood"
            />
            <ActivityItem
              icon="💬"
              title="AI Counselor Chat"
              description="Received personalized coping strategies and support"
              time="Yesterday"
              type="chat"
            />
            <ActivityItem
              icon="🧘"
              title="Wellness Resources Accessed"
              description="Completed guided meditation and stress management exercises"
              time="2 days ago"
              type="activity"
            />
            <ActivityItem
              icon="📊"
              title="Weekly Progress Review"
              description="Reviewed trends and patterns in mental health journey"
              time="3 days ago"
              type="progress"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, subtitle, note, icon: Icon, bgColor, iconColor }) {
  return (
    <div className={`${bgColor} rounded-2xl p-6 border border-gray-200 transition-all duration-200 hover:shadow-lg hover:scale-105 animate-fadeIn`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconColor.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{title}</p>
        <p className="text-gray-600 text-sm mb-2">{subtitle}</p>
        <p className={`text-xs font-medium ${iconColor}`}>{note}</p>
      </div>
    </div>
  );
}

function ActionCard({ title, description, buttonText, onClick, icon: Icon, gradient }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-105">
      <div className={`bg-gradient-to-r ${gradient} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-white/90 text-sm">{description}</p>
      </div>
      <div className="p-6">
        <button
          onClick={onClick}
          className={`w-full bg-gradient-to-r ${gradient} text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-105`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

function ActivityItem({ icon, title, description, time, type }) {
  const typeColors = {
    success: "bg-green-100 text-green-800",
    mood: "bg-yellow-100 text-yellow-800",
    chat: "bg-blue-100 text-blue-800",
    activity: "bg-purple-100 text-purple-800",
    progress: "bg-indigo-100 text-indigo-800",
  };

  return (
    <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-gray-600 text-sm mt-1">{description}</p>
      </div>
      <div className="text-right">
        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${typeColors[type]}`}>
          {time}
        </span>
      </div>
    </div>
  );
}
