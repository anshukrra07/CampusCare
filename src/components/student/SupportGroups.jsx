import React, { useState, useEffect } from "react";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../shared/LanguageSelector';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  EyeIcon,
  CalendarIcon,
  MapPinIcon,
  LockClosedIcon,
  GlobeAltIcon,
  LanguageIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  UserGroupIcon as UserGroupIconSolid,
  HeartIcon as HeartIconSolid,
} from "@heroicons/react/24/solid";

export default function SupportGroups() {
  const [user] = useAuthState(auth);
  const { t, currentLanguage } = useLanguage();
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Initialize with sample groups including language-specific ones
  const [initialGroups] = useState([
    {
      id: 1,
      name: "Anxiety Support Circle",
      description: "A safe space to share experiences and coping strategies for anxiety management.",
      members: 28,
      type: "anxiety",
      privacy: "private",
      nextMeeting: "Today, 6:00 PM",
      location: "Virtual - Zoom",
      moderator: "Dr. Sarah Chen",
      image: "🧠",
      color: "bg-blue-100",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      language: "en",
      membersList: [],
      createdAt: new Date(),
      createdBy: "admin",
    },
    {
      id: 2,
      name: "Depression Recovery Group",
      description: "Supporting each other through the journey of overcoming depression.",
      members: 19,
      type: "depression",
      privacy: "private",
      nextMeeting: "Tomorrow, 7:30 PM",
      location: "Room 302, Health Center",
      moderator: "Prof. Michael Johnson",
      image: "🌱",
      color: "bg-green-100",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      language: "en",
      membersList: [],
      createdAt: new Date(),
      createdBy: "admin",
    },
    {
      id: 3,
      name: "Mindfulness & Meditation",
      description: "Daily practice sessions for mindfulness and meditation techniques.",
      members: 45,
      type: "mindfulness",
      privacy: "public",
      nextMeeting: "Every day, 8:00 AM",
      location: "Campus Garden",
      moderator: "Lisa Martinez",
      image: "🧘‍♀️",
      color: "bg-purple-100",
      borderColor: "border-purple-200",
      textColor: "text-purple-800",
    },
    {
      id: 4,
      name: "Study Stress Management",
      description: "Helping students manage academic pressure and study-related stress.",
      members: 67,
      type: "academic",
      privacy: "public",
      nextMeeting: "Wed, 5:00 PM",
      location: "Library Study Room 5",
      moderator: "Alex Rodriguez",
      image: "📚",
      color: "bg-orange-100",
      borderColor: "border-orange-200",
      textColor: "text-orange-800",
    },
    {
      id: 5,
      name: "LGBTQ+ Mental Wellness",
      description: "A supportive community for LGBTQ+ students to discuss mental health.",
      members: 23,
      type: "identity",
      privacy: "private",
      nextMeeting: "Fri, 4:00 PM",
      location: "Diversity Center",
      moderator: "Jordan Kim",
      image: "🏳️‍🌈",
      color: "bg-pink-100",
      borderColor: "border-pink-200",
      textColor: "text-pink-800",
    },
    {
      id: 6,
      name: "Grief & Loss Support",
      description: "Supporting those dealing with grief and loss of loved ones.",
      members: 12,
      type: "grief",
      privacy: "private",
      nextMeeting: "Sun, 3:00 PM",
      location: "Counseling Center, Room B",
      moderator: "Dr. Emily Watson",
      image: "🕊️",
      color: "bg-indigo-100",
      borderColor: "border-indigo-200",
      textColor: "text-indigo-800",
      language: "en",
      membersList: [],
      createdAt: new Date(),
      createdBy: "admin",
    },
    // Hindi Language Groups
    {
      id: 7,
      name: "हिंदी मानसिक स्वास्थ्य समूह",
      description: "हिंदी में मानसिक स्वास्थ्य पर चर्चा और सहायता के लिए समुदाय।",
      members: 34,
      type: "language",
      privacy: "public",
      nextMeeting: "Mon, 7:00 PM",
      location: "Virtual - Google Meet",
      moderator: "डॉ. अनिता शर्मा",
      image: "🇮🇳",
      color: "bg-orange-100",
      borderColor: "border-orange-200",
      textColor: "text-orange-800",
      language: "hi",
      membersList: [],
      createdAt: new Date(),
      createdBy: "admin",
    },
    {
      id: 8,
      name: "चिंता मुक्त जीवन",
      description: "चिंता और तनाव से मुक्ति पाने के लिए हिंदी में सहायता समूह।",
      members: 21,
      type: "anxiety",
      privacy: "private",
      nextMeeting: "Wed, 6:30 PM",
      location: "Community Center",
      moderator: "राज पटेल",
      image: "🧘‍♂️",
      color: "bg-blue-100",
      borderColor: "border-blue-200",
      textColor: "text-blue-800",
      language: "hi",
      membersList: [],
      createdAt: new Date(),
      createdBy: "admin",
    },
    // Telugu Language Groups
    {
      id: 9,
      name: "తెలుగు మానసిక ఆరోగ్య గ్రూప్",
      description: "తెలుగులో మానసిక ఆరోగ్య చర్చలు మరియు మద్దతు కోసం సముదాయం.",
      members: 27,
      type: "language",
      privacy: "public",
      nextMeeting: "Thu, 7:30 PM",
      location: "Virtual - Zoom",
      moderator: "డాక్టర్ రమేష్ కుమార్",
      image: "🇮🇳",
      color: "bg-green-100",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      language: "te",
      membersList: [],
      createdAt: new Date(),
      createdBy: "admin",
    },
    {
      id: 10,
      name: "స్ట్రెస్ మేనేజ్మెంట్ గ్రూప్",
      description: "విద్యార్థుల కోసం తెలుగులో ఒత్తిడి నిర్వహణ మరియు మద్దతు.",
      members: 18,
      type: "stress",
      privacy: "public",
      nextMeeting: "Sat, 5:00 PM",
      location: "Student Center",
      moderator: "లక్ష్మీ దేవి",
      image: "🌸",
      color: "bg-pink-100",
      borderColor: "border-pink-200",
      textColor: "text-pink-800",
      language: "te",
      membersList: [],
      createdAt: new Date(),
      createdBy: "admin",
    },
  ]);

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Load groups on component mount and set up real-time listener
  useEffect(() => {
    initializeGroups();
    
    if (user) {
      // Listen to user's joined groups
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setUserGroups(userData.joinedGroups || []);
        }
      });
      
      return () => unsubscribe();
    }
  }, [user]);
  
  const initializeGroups = async () => {
    try {
      setLoading(true);
      // For now, use initial groups. In production, you'd fetch from Firebase
      setGroups(initialGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const joinGroup = async (groupId) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        joinedGroups: arrayUnion(groupId),
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUserGroups(prev => [...prev, groupId]);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };
  
  const leaveGroup = async (groupId) => {
    if (!user) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        joinedGroups: arrayRemove(groupId),
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setUserGroups(prev => prev.filter(id => id !== groupId));
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === "all" || 
                         (filter === "public" && group.privacy === "public") ||
                         (filter === "private" && group.privacy === "private") ||
                         (filter === "language" && group.language === currentLanguage) ||
                         group.type === filter;
    
    return matchesSearch && matchesFilter;
  });

  const categories = [
    { id: "all", name: t('allGroups'), count: groups.length },
    { id: "public", name: t('public'), count: groups.filter(g => g.privacy === "public").length },
    { id: "private", name: t('private'), count: groups.filter(g => g.privacy === "private").length },
    { id: "language", name: "My Language", count: groups.filter(g => g.language === currentLanguage).length },
    { id: "anxiety", name: t('anxiety'), count: groups.filter(g => g.type === "anxiety").length },
    { id: "depression", name: t('depression'), count: groups.filter(g => g.type === "depression").length },
    { id: "mindfulness", name: t('mindfulness'), count: groups.filter(g => g.type === "mindfulness").length },
    { id: "academic", name: t('academic'), count: groups.filter(g => g.type === "academic").length },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-full">
              <UserGroupIconSolid className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('supportGroups')}</h1>
              <p className="text-purple-100">
                {t('connectWithOthers')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <LanguageSelector className="" />
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              {t('createGroup')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('searchGroups')}</h3>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('categories')}</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setFilter(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                    filter === category.id
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-sm font-medium">{category.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('yourGroups')}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('joined')}</span>
                <span className="font-medium">{userGroups.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('moderating')}</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">{t('thisWeek')}</span>
                <span className="font-medium">5 {t('meetings')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredGroups.length} {t('groupsFound')}
            </h2>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent">
              <option>Sort by popularity</option>
              <option>Sort by newest</option>
              <option>Sort by meeting time</option>
            </select>
          </div>

          {/* Groups Grid */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <SparklesIcon className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('loading')}</h3>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noGroupsFound')}</h3>
              <p className="text-gray-600">{t('tryAdjusting')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredGroups.map((group) => (
                <GroupCard 
                  key={group.id} 
                  group={group} 
                  isJoined={userGroups.includes(group.id)}
                  onJoin={() => joinGroup(group.id)}
                  onLeave={() => leaveGroup(group.id)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupCard({ group, isJoined, onJoin, onLeave, t }) {

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 ${group.borderColor} hover:shadow-md transition-all duration-200`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`${group.color} p-3 rounded-xl text-2xl`}>
              {group.image}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{group.name}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${group.textColor} ${group.color}`}>
                  {group.privacy === "private" ? (
                    <>
                      <LockClosedIcon className="w-3 h-3 mr-1" />
                      Private
                    </>
                  ) : (
                    <>
                      <GlobeAltIcon className="w-3 h-3 mr-1" />
                      Public
                    </>
                  )}
                </span>
                <span className="flex items-center text-sm text-gray-600">
                  <UserIcon className="w-4 h-4 mr-1" />
                  {group.members} members
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={isJoined ? onLeave : onJoin}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isJoined
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-purple-500 text-white hover:bg-purple-600"
            }`}
          >
            {isJoined ? t('joined') : t('join')}
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {group.description}
        </p>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" />
            <span>{t('nextMeeting')}: <span className="font-medium">{group.nextMeeting}</span></span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPinIcon className="w-4 h-4" />
            <span>{group.location}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <UserIcon className="w-4 h-4" />
            <span>{t('moderatedBy')} <span className="font-medium">{group.moderator}</span></span>
          </div>
          
          {group.language && group.language !== 'en' && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <LanguageIcon className="w-4 h-4" />
              <span>Language: <span className="font-medium">{group.language.toUpperCase()}</span></span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button className="flex items-center text-gray-600 hover:text-purple-600 transition-colors duration-200">
              <HeartIconSolid className="w-4 h-4 mr-1" />
              <span className="text-sm">{t('like')}</span>
            </button>
            <button className="flex items-center text-gray-600 hover:text-purple-600 transition-colors duration-200">
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">{t('message')}</span>
            </button>
            <button className="flex items-center text-gray-600 hover:text-purple-600 transition-colors duration-200">
              <EyeIcon className="w-4 h-4 mr-1" />
              <span className="text-sm">{t('view')}</span>
            </button>
          </div>
          
          <button className="text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors duration-200">
            {t('learnMore')}
          </button>
        </div>
      </div>
    </div>
  );
}