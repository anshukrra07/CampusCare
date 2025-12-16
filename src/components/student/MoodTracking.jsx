import React, { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, setDoc, collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRecommendations } from '../../hooks/useRecommendations';
import RecommendationDisplay from './RecommendationDisplay';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  CalendarDaysIcon,
  ChartBarIcon,
  FaceSmileIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
  HeartIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

export default function MoodTracking() {
  const [user] = useAuthState(auth);
  const [moodData, setMoodData] = useState([]);
  const [avgMood, setAvgMood] = useState(0);
  const [avgEnergy, setAvgEnergy] = useState(0);
  const [avgSleep, setAvgSleep] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('chart'); // 'chart', 'calendar', 'insights'
  const [chartType, setChartType] = useState('line'); // 'line', 'bar'
  const [timeRange, setTimeRange] = useState(7); // days
  const [showMoodForm, setShowMoodForm] = useState(false);
  const [todaysEntry, setTodaysEntry] = useState(null);

  // Enhanced form state
  const [newMood, setNewMood] = useState(3);
  const [newEnergy, setNewEnergy] = useState(3);
  const [newSleep, setNewSleep] = useState(7);
  const [newStress, setNewStress] = useState(3);
  const [activities, setActivities] = useState([]);
  const [notes, setNotes] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [triggers, setTriggers] = useState([]);
  const [showMoodRecommendations, setShowMoodRecommendations] = useState(false);
  
  // Add recommendations hook
  const { recommendations: moodRecommendations, loading: recLoading, generateRecommendationsForMood } = useRecommendations();

  // Mood options with emojis
  const moodOptions = [
    { value: 1, emoji: '😢', label: 'Very Low', color: 'text-red-600' },
    { value: 2, emoji: '😔', label: 'Low', color: 'text-orange-600' },
    { value: 3, emoji: '😐', label: 'Neutral', color: 'text-yellow-600' },
    { value: 4, emoji: '😊', label: 'Good', color: 'text-green-600' },
    { value: 5, emoji: '😁', label: 'Excellent', color: 'text-blue-600' }
  ];

  const energyOptions = [
    { value: 1, emoji: '🔋', label: 'Drained', color: 'text-red-600' },
    { value: 2, emoji: '🪫', label: 'Low', color: 'text-orange-600' },
    { value: 3, emoji: '⚡', label: 'Moderate', color: 'text-yellow-600' },
    { value: 4, emoji: '🔋', label: 'High', color: 'text-green-600' },
    { value: 5, emoji: '⚡', label: 'Energetic', color: 'text-blue-600' }
  ];

  const activityOptions = [
    'Exercise', 'Meditation', 'Social Time', 'Work/Study', 'Hobbies', 
    'Sleep', 'Therapy', 'Nature', 'Music', 'Reading', 'Gaming', 'Cooking'
  ];

  const triggerOptions = [
    'Work Stress', 'Relationship', 'Health', 'Financial', 'Academic', 
    'Social Media', 'Weather', 'Family', 'Sleep Issues', 'Diet', 'Other'
  ];

  useEffect(() => {
    if (user) {
      fetchMoodData();
      checkTodaysEntry();
    }
  }, [user, timeRange]);

  const checkTodaysEntry = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    try {
      const todayDoc = doc(db, "users", user.uid, "moods", today);
      const snapshot = await getDocs(query(collection(db, "users", user.uid, "moods"), where("date", "==", today)));
      if (!snapshot.empty) {
        setTodaysEntry(snapshot.docs[0].data());
        setShowMoodForm(false);
      } else {
        setTodaysEntry(null);
        setShowMoodForm(true);
      }
    } catch (error) {
      console.error("Error checking today's entry:", error);
    }
  };

  const fetchMoodData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const moodRef = collection(db, "users", user.uid, "moods");
      const q = query(moodRef, orderBy("date", "desc"), limit(90)); // Last 90 days
      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // Sort by date ascending for charts
      const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
      setMoodData(sortedData);

      if (data.length > 0) {
        // Calculate averages for the selected time range
        const recentData = data.slice(0, timeRange);
        
        setAvgMood(
          (recentData.reduce((a, b) => a + b.mood, 0) / recentData.length).toFixed(1)
        );
        setAvgEnergy(
          (recentData.reduce((a, b) => a + b.energy, 0) / recentData.length).toFixed(1)
        );
        setAvgSleep(
          (recentData.reduce((a, b) => a + b.sleep, 0) / recentData.length).toFixed(1)
        );

        // Enhanced streak calculation
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sorted = data
          .map((d) => ({ ...d, date: new Date(d.date) }))
          .sort((a, b) => b.date - a.date);

        let streakCount = 0;
        let checkDate = new Date(today);
        
        for (const entry of sorted) {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          
          if (entryDate.getTime() === checkDate.getTime()) {
            streakCount++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else if (entryDate.getTime() < checkDate.getTime()) {
            break;
          }
        }
        
        setStreak(streakCount);
      }
    } catch (error) {
      console.error("Error fetching mood data:", error);
    } finally {
      setLoading(false);
    }
  };

  const logTodayMood = async () => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split("T")[0];
      const timestamp = new Date().toISOString();
      
      const newEntry = {
        date: today,
        timestamp,
        created_at: new Date(), // Add for Firebase function compatibility
        mood: newMood,
        energy: newEnergy,
        sleep: newSleep,
        stress: newStress,
        activities,
        notes: notes.trim(),
        gratitude: gratitude.trim(),
        triggers,
        moodLabel: moodOptions.find(m => m.value === newMood)?.label || '',
        energyLabel: energyOptions.find(e => e.value === newEnergy)?.label || ''
      };
      
      await setDoc(doc(db, "users", user.uid, "moods", today), newEntry);
      
      // Reset form
      setNotes('');
      setGratitude('');
      setActivities([]);
      setTriggers([]);
      setShowMoodForm(false);
      
      // Generate mood-based recommendations if mood is low
      if (newMood <= 2) {
        await generateRecommendationsForMood(newMood, newEnergy, newStress);
        setShowMoodRecommendations(true);
      }
      
      // Refresh data
      await fetchMoodData();
      await checkTodaysEntry();
    } catch (error) {
      console.error("Error logging mood:", error);
    }
  };

  const toggleActivity = (activity) => {
    setActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const toggleTrigger = (trigger) => {
    setTriggers(prev => 
      prev.includes(trigger) 
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    );
  };

  const getMoodColor = (moodValue) => {
    const colors = {
      1: 'bg-red-100 border-red-200',
      2: 'bg-orange-100 border-orange-200', 
      3: 'bg-yellow-100 border-yellow-200',
      4: 'bg-green-100 border-green-200',
      5: 'bg-blue-100 border-blue-200'
    };
    return colors[moodValue] || 'bg-gray-100 border-gray-200';
  };

  const getFilteredData = () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    return moodData.filter(entry => new Date(entry.date) >= cutoffDate);
  };

  const getInsights = () => {
    const recentData = getFilteredData();
    if (recentData.length === 0) return [];

    const insights = [];
    const avgMoodNum = parseFloat(avgMood);
    const avgEnergyNum = parseFloat(avgEnergy);
    const avgSleepNum = parseFloat(avgSleep);

    // Mood trend analysis
    if (recentData.length >= 3) {
      const recent3 = recentData.slice(-3);
      const trend = recent3[2].mood - recent3[0].mood;
      if (trend > 0) {
        insights.push({
          type: 'positive',
          message: 'Your mood has been improving over the last 3 days! Keep up the great work.',
          icon: '📈'
        });
      } else if (trend < -1) {
        insights.push({
          type: 'warning',
          message: 'Your mood has been declining. Consider reaching out to someone or trying a mood-boosting activity.',
          icon: '⚠️'
        });
      }
    }

    // Sleep insights
    if (avgSleepNum < 6) {
      insights.push({
        type: 'warning',
        message: 'Your average sleep is below 6 hours. Better sleep can significantly improve your mood and energy.',
        icon: '😴'
      });
    } else if (avgSleepNum >= 8) {
      insights.push({
        type: 'positive',
        message: 'Great job maintaining healthy sleep habits! Your mood benefits from good rest.',
        icon: '✨'
      });
    }

    // Energy insights
    if (avgEnergyNum < 2.5) {
      insights.push({
        type: 'suggestion',
        message: 'Low energy detected. Try incorporating light exercise or spending time outdoors.',
        icon: '⚡'
      });
    }

    // Streak insights
    if (streak >= 7) {
      insights.push({
        type: 'achievement',
        message: `Amazing! You've been tracking consistently for ${streak} days. This self-awareness is powerful for mental wellness.`,
        icon: '🏆'
      });
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your mood data...</p>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();
  const insights = getInsights();

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mood Tracking</h1>
        <p className="text-gray-600">
          Monitor your daily mental wellness journey and gain insights into your patterns
        </p>
      </div>

      {/* Today's Status */}
      {todaysEntry && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${getMoodColor(todaysEntry.mood)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{moodOptions.find(m => m.value === todaysEntry.mood)?.emoji}</span>
              <div>
                <h3 className="font-semibold text-gray-900">Today's Mood Logged</h3>
                <p className="text-gray-600">Feeling {todaysEntry.moodLabel?.toLowerCase()} with {todaysEntry.energyLabel?.toLowerCase()} energy</p>
              </div>
            </div>
            <button
              onClick={() => setShowMoodForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Entry
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<FaceSmileIcon className="h-6 w-6" />}
          title={avgMood || '0'}
          subtitle={`Avg. Mood (${timeRange}d)`}
          color="bg-gradient-to-r from-yellow-400 to-orange-500"
          textColor="text-white"
        />
        <StatCard
          icon={<SparklesIcon className="h-6 w-6" />}
          title={avgEnergy || '0'}
          subtitle={`Avg. Energy (${timeRange}d)`}
          color="bg-gradient-to-r from-blue-400 to-indigo-500"
          textColor="text-white"
        />
        <StatCard
          icon={<MoonIcon className="h-6 w-6" />}
          title={`${avgSleep || '0'}h`}
          subtitle={`Avg. Sleep (${timeRange}d)`}
          color="bg-gradient-to-r from-green-400 to-teal-500"
          textColor="text-white"
        />
        <StatCard
          icon={<CalendarDaysIcon className="h-6 w-6" />}
          title={streak}
          subtitle="Day Streak"
          color="bg-gradient-to-r from-purple-400 to-pink-500"
          textColor="text-white"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <TabButton
            active={viewMode === 'chart'}
            onClick={() => setViewMode('chart')}
            icon={<ChartBarIcon className="h-4 w-4" />}
            label="Charts"
          />
          <TabButton
            active={viewMode === 'insights'}
            onClick={() => setViewMode('insights')}
            icon={<LightBulbIcon className="h-4 w-4" />}
            label="Insights"
          />
          <TabButton
            active={viewMode === 'calendar'}
            onClick={() => setViewMode('calendar')}
            icon={<CalendarDaysIcon className="h-4 w-4" />}
            label="Calendar"
          />
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {[7, 14, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === days 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Enhanced Mood Logging Form */}
      {showMoodForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-lg border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Log Today's Mood</h2>
            <button
              onClick={() => setShowMoodForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* Mood Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">How are you feeling?</label>
              <div className="grid grid-cols-5 gap-2">
                {moodOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setNewMood(option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      newMood === option.value
                        ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.emoji}</div>
                    <div className={`text-xs font-medium ${option.color}`}>{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Energy Level</label>
              <div className="grid grid-cols-5 gap-2">
                {energyOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setNewEnergy(option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      newEnergy === option.value
                        ? 'border-green-500 bg-green-50 shadow-md scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.emoji}</div>
                    <div className={`text-xs font-medium ${option.color}`}>{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep and Stress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sleep Hours: {newSleep}h
                </label>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="0.5"
                  value={newSleep}
                  onChange={(e) => setNewSleep(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stress Level: {newStress}/5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={newStress}
                  onChange={(e) => setNewStress(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            {/* Activities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Activities</label>
              <div className="flex flex-wrap gap-2">
                {activityOptions.map(activity => (
                  <button
                    key={activity}
                    onClick={() => toggleActivity(activity)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      activities.includes(activity)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </div>

            {/* Triggers */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Stress Triggers</label>
              <div className="flex flex-wrap gap-2">
                {triggerOptions.map(trigger => (
                  <button
                    key={trigger}
                    onClick={() => toggleTrigger(trigger)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      triggers.includes(trigger)
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {trigger}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="How was your day? What affected your mood?"
              />
            </div>

            {/* Gratitude */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gratitude (Optional)</label>
              <textarea
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="2"
                placeholder="What are you grateful for today?"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={logTodayMood}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <HeartIcon className="h-5 w-5" />
              Save Entry
            </button>
          </div>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === 'chart' && (
        <div className="space-y-6">
          {/* Chart Controls */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setChartType('line')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                chartType === 'line' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Line Chart
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                chartType === 'bar' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Bar Chart
            </button>
          </div>

          {/* Main Chart */}
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Mood Trends (Last {timeRange} Days)
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'line' ? (
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mood" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#f59e0b' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#3b82f6' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sleep" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#10b981' }}
                  />
                </LineChart>
              ) : (
                <BarChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Bar dataKey="mood" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="energy" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="sleep" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === 'insights' && (
        <div className="space-y-6">
          <div className="bg-white shadow-lg p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
              <LightBulbIcon className="h-6 w-6 text-yellow-500" />
              Personal Insights
            </h2>
            
            {insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.type === 'positive' ? 'bg-green-50 border-green-400' :
                      insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                      insight.type === 'achievement' ? 'bg-purple-50 border-purple-400' :
                      'bg-blue-50 border-blue-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{insight.icon}</span>
                      <p className="text-gray-700 leading-relaxed">{insight.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <LightBulbIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Keep logging your mood to get personalized insights!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="bg-white shadow-lg p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 flex items-center gap-2">
            <CalendarDaysIcon className="h-6 w-6 text-blue-500" />
            Mood Calendar
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {/* Calendar implementation would go here */}
            <div className="text-center py-8 col-span-7">
              <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Calendar view coming soon!</p>
            </div>
          </div>
        </div>
      )}

      {/* Mood-based Recommendations */}
      {showMoodRecommendations && moodRecommendations && (
        <div className="mt-8">
          <RecommendationDisplay 
            recommendations={moodRecommendations}
            title="Mood Boost Recommendations"
            subtitle={moodRecommendations.context || "Activities to help improve your mood"}
          />
        </div>
      )}

      {/* Quick Add Button (Mobile FAB) */}
      {!showMoodForm && !todaysEntry && (
        <button
          onClick={() => setShowMoodForm(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors md:hidden"
        >
          <FaceSmileIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

// Helper Components
function StatCard({ icon, title, subtitle, color, textColor = 'text-gray-900' }) {
  return (
    <div className={`${color} p-6 rounded-xl shadow-lg`}>
      <div className="flex items-center">
        <div className={`${textColor} mr-3`}>{icon}</div>
        <div>
          <div className={`text-2xl font-bold ${textColor}`}>{title}</div>
          <div className={`text-sm ${textColor} opacity-90`}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
