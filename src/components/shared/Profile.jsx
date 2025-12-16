import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  UserCircleIcon,
  EnvelopeIcon,
  CalendarIcon,
  UserIcon,
  HeartIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  UserCircleIcon as UserCircleIconSolid,
} from "@heroicons/react/24/solid";


export default function Profile() {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setProfile(snap.data());
      } else {
        // ✅ Create a default profile if none exists
        const newProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          role: "student",
          dob: "",
          gender: "",
          interests: "",
        };
        await setDoc(ref, newProfile);
        setProfile(newProfile);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const updateProfile = async (field, value) => {
    if (!user) return;
    setSaving(true);
    try {
      const ref = doc(db, "users", user.uid);
      await setDoc(ref, { [field]: value }, { merge: true });
      setProfile({ ...profile, [field]: value });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (field, currentValue) => {
    setEditingField(field);
    setTempValue(currentValue || "");
  };

  const saveField = async () => {
    await updateProfile(editingField, tempValue);
    setEditingField(null);
    setTempValue("");
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const getRoleColor = (role) => {
    switch (role) {
      case "student":
        return "bg-blue-100 text-blue-800";
      case "counselor":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "student":
        return UserIcon;
      case "counselor":
        return ShieldCheckIcon;
      default:
        return UserIcon;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <UserCircleIconSolid className="w-20 h-20 text-white" />
              </div>
              <button className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full text-indigo-600 hover:bg-gray-50 transition-colors duration-200 shadow-lg">
                <CameraIcon className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {profile?.displayName || user?.displayName || "User"}
              </h1>
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  getRoleColor(profile?.role)
                } bg-white/90`}>
                  {React.createElement(getRoleIcon(profile?.role), { className: "w-4 h-4 mr-1" })}
                  {profile?.role || "Student"}
                </span>
                <span className="text-indigo-100">
                  {profile?.email || user?.email}
                </span>
              </div>
            </div>
          </div>
          <SparklesIcon className="w-16 h-16 text-white/20" />
        </div>
      </div>

      {profile ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <UserCircleIcon className="w-6 h-6 mr-2 text-indigo-600" />
                  Personal Information
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* Display Name */}
                <ProfileField
                  label="Display Name"
                  value={profile.displayName || user?.displayName}
                  icon={UserIcon}
                  field="displayName"
                  editingField={editingField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  startEditing={startEditing}
                  saveField={saveField}
                  cancelEditing={cancelEditing}
                  saving={saving}
                  type="text"
                />

                {/* Email */}
                <ProfileField
                  label="Email Address"
                  value={profile.email || user?.email}
                  icon={EnvelopeIcon}
                  field="email"
                  editingField={editingField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  startEditing={startEditing}
                  saveField={saveField}
                  cancelEditing={cancelEditing}
                  saving={saving}
                  type="email"
                  readonly={true}
                />

                {/* Date of Birth */}
                <ProfileField
                  label="Date of Birth"
                  value={profile.dob}
                  icon={CalendarIcon}
                  field="dob"
                  editingField={editingField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  startEditing={startEditing}
                  saveField={saveField}
                  cancelEditing={cancelEditing}
                  saving={saving}
                  type="date"
                />

                {/* Gender */}
                <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <UserIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Gender</p>
                      <p className="text-sm text-gray-500">Your gender identity</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {editingField === "gender" ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                        <button
                          onClick={saveField}
                          disabled={saving}
                          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors duration-200"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-900 font-medium">
                          {profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1).replace('-', ' ') : "Not specified"}
                        </span>
                        <button
                          onClick={() => startEditing("gender", profile.gender)}
                          className="text-indigo-600 hover:text-indigo-700 p-1 rounded transition-colors duration-200"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Interests */}
                <ProfileField
                  label="Interests & Hobbies"
                  value={profile.interests}
                  icon={HeartIcon}
                  field="interests"
                  editingField={editingField}
                  tempValue={tempValue}
                  setTempValue={setTempValue}
                  startEditing={startEditing}
                  saveField={saveField}
                  cancelEditing={cancelEditing}
                  saving={saving}
                  type="text"
                  placeholder="E.g. reading, sports, music, gaming"
                  description="What activities do you enjoy?"
                />
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Account Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2 text-indigo-600" />
                Account Overview
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member since</span>
                  <span className="font-medium text-gray-900">
                    {user?.metadata?.creationTime
                      ? new Date(user.metadata.creationTime).toLocaleDateString()
                      : "Recently"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Last login</span>
                  <span className="font-medium text-gray-900">
                    {user?.metadata?.lastSignInTime
                      ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                      : "Today"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account status</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 flex items-center">
                  <UserCircleIcon className="w-5 h-5 mr-3 text-gray-600" />
                  Change Password
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 flex items-center">
                  <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-600" />
                  Notification Settings
                </button>
                <button className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 flex items-center">
                  <ShieldCheckIcon className="w-5 h-5 mr-3 text-gray-600" />
                  Privacy Settings
                </button>
              </div>
            </div>

            {/* Logout */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-700">Danger Zone</h3>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <UserCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No profile found</h3>
          <p className="text-gray-600">We couldn't find your profile information.</p>
        </div>
      )}
    </div>
  );
}

function ProfileField({
  label,
  value,
  icon: Icon,
  field,
  editingField,
  tempValue,
  setTempValue,
  startEditing,
  saveField,
  cancelEditing,
  saving,
  type = "text",
  placeholder,
  description,
  readonly = false,
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-100 p-2 rounded-lg">
          <Icon className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{label}</p>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {editingField === field ? (
          <div className="flex items-center space-x-2">
            <input
              type={type}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              placeholder={placeholder}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-48"
            />
            <button
              onClick={saveField}
              disabled={saving}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <CheckIcon className="w-4 h-4" />
            </button>
            <button
              onClick={cancelEditing}
              className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors duration-200"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-gray-900 font-medium min-w-32 text-right">
              {value || "Not specified"}
            </span>
            {!readonly && (
              <button
                onClick={() => startEditing(field, value)}
                className="text-indigo-600 hover:text-indigo-700 p-1 rounded transition-colors duration-200"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}