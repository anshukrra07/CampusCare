# 🌈 Daily Mood Popup - Integration Guide

## Overview
The **DailyMoodPopup** is a gamified floating modal that prompts students to check in with their mood once per day. It creates an engaging, non-intrusive way to collect daily wellness data.

## Features

### 🎯 Core Functionality
- **Once Daily**: Appears automatically 2 seconds after page load, but only once per day
- **Smart Dismissal**: If dismissed, won't appear again that day
- **Auto-Hide**: Doesn't show if user already logged mood today
- **Firebase Integration**: Stores data in the same format as existing mood tracking

### 🎮 Gamification Elements
- **Streak Tracking**: Shows current streak and celebrates milestones
- **Visual Rewards**: Special celebrations for 1, 3, 7, 14, 30, and 100-day streaks
- **Motivational Messages**: Randomized encouraging prompts
- **Interactive Animations**: Hover effects, scaling, and smooth transitions
- **Personalized Feedback**: Different responses based on mood selection

### 💫 User Experience
- **Beautiful Design**: Gradient backgrounds, floating elements, rounded corners
- **Mobile Friendly**: Responsive design that works on all devices
- **Accessibility**: Proper contrast, clear labels, keyboard navigation
- **Fast Loading**: Optimized animations and minimal overhead

## Integration

The component is already integrated into your app at the global level for students:

```jsx
// In App.jsx - Student Routes
if (role === "student") {
  return (
    <LanguageProvider>
      <DailyMoodPopup />  {/* ← Added here */}
      <Routes>
        {/* ... routes */}
      </Routes>
    </LanguageProvider>
  );
}
```

## Data Structure

The popup saves mood data to Firebase Firestore:

```javascript
// Collection: users/{userId}/moods/{date}
{
  mood: 1-5,                    // Mood value (1=struggling, 5=amazing)
  date: "2024-01-15",          // ISO date string
  timestamp: serverTimestamp(), // Firebase timestamp
  userId: "user123",           // User ID
  source: "daily_popup"        // Tracks data source
}

// User document updates: users/{userId}
{
  moodStreak: 5,              // Current consecutive days
  lastMoodDate: "2024-01-15", // Last mood entry date
  totalMoodEntries: 25        // Total mood entries ever
}
```

## Mood Scale

| Emoji | Label      | Value | Meaning         |
|-------|------------|-------|-----------------|
| 😢    | Struggling | 1     | Very difficult day |
| 😔    | Down       | 2     | Having a tough time |
| 😐    | Okay       | 3     | Neutral/average |
| 🙂    | Good       | 4     | Positive day |
| 😃    | Amazing    | 5     | Excellent mood |

## Customization Options

### Timing
```javascript
// Show popup delay (currently 2 seconds)
setTimeout(() => {
  setShow(true);
}, 2000);

// Auto-close after success (currently 4 seconds)
setTimeout(() => {
  setShow(false);
}, 4000);
```

### Streak Rewards
```javascript
const STREAK_REWARDS = {
  1: { emoji: '🌱', message: 'Great start!' },
  3: { emoji: '🔥', message: 'On fire!' },
  7: { emoji: '⭐', message: 'Week warrior!' },
  14: { emoji: '💎', message: 'Diamond streak!' },
  30: { emoji: '👑', message: 'Mood master!' },
  100: { emoji: '🏆', message: 'Legend status!' },
};
```

### Motivational Messages
```javascript
const MOTIVATIONAL_MESSAGES = [
  "How's your vibe today? ✨",
  "Ready to check in with yourself? 🌟",
  "Your mood matters! Let's see how you're doing 💫",
  // Add more messages here
];
```

## Behavior Details

### Show Logic
1. ✅ User is logged in
2. ✅ User has student role
3. ✅ Haven't logged mood today
4. ✅ Haven't dismissed popup today
5. ✅ 2-second delay after page load

### Storage
- **Mood Data**: Firebase Firestore (`users/{uid}/moods/{date}`)
- **Dismissal State**: Browser localStorage (`moodPopupDismissed_{date}`)
- **Streak Data**: User document in Firestore

### Error Handling
- Gracefully handles Firebase errors
- Shows loading states during submission
- Prevents double-submission
- Maintains UI state consistency

## Future Enhancements

### Analytics Integration
- Track popup show/dismiss rates
- Monitor completion rates by time of day
- A/B test different motivational messages

### Advanced Features
- Weekly mood summaries
- Mood-based resource recommendations  
- Integration with existing dashboard charts
- Push notifications for streak maintenance

### Accessibility
- Screen reader announcements
- High contrast mode support
- Reduced motion preferences
- Keyboard-only navigation

## Testing

### Manual Testing Checklist
- [ ] Popup appears on page load (after 2 seconds)
- [ ] All 5 mood options are clickable
- [ ] Streak counter increments correctly
- [ ] Success animation plays
- [ ] Popup doesn't appear again same day
- [ ] Dismissal works and persists
- [ ] Mobile responsive design
- [ ] Firebase data saves correctly

### Browser Support
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers

## Troubleshooting

### Popup Not Showing
1. Check browser console for errors
2. Verify user is logged in with student role
3. Check if mood already logged today
4. Clear localStorage for testing: `localStorage.clear()`

### Data Not Saving
1. Verify Firebase configuration
2. Check Firestore security rules
3. Monitor network requests in dev tools
4. Verify user authentication state

### Performance Issues
1. Component uses React.memo for optimization
2. Firebase queries are cached automatically
3. Animations use CSS transforms (GPU accelerated)
4. Local storage reduces API calls

---

## Ready to Go! 🚀

The Daily Mood Popup is now integrated and ready to help your students build healthy check-in habits. The component will automatically start collecting mood data and building user engagement through gamified streaks and celebrations.

Monitor the Firebase console to see mood data flowing in, and consider adding dashboard visualizations to show students their progress over time!