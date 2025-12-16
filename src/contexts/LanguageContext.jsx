import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸',
    nativeName: 'English'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    flag: '🇮🇳',
    nativeName: 'हिन्दी'
  },
  te: {
    code: 'te',
    name: 'Telugu',
    flag: '🇮🇳',
    nativeName: 'తెలుగు'
  }
};

const translations = {
  en: {
    // Support Groups
    supportGroups: 'Support Groups',
    connectWithOthers: 'Connect with others who understand your journey',
    createGroup: 'Create Group',
    searchGroups: 'Search Groups',
    searchPlaceholder: 'Search groups...',
    categories: 'Categories',
    allGroups: 'All Groups',
    public: 'Public',
    private: 'Private',
    yourGroups: 'Your Groups',
    joined: 'Joined',
    moderating: 'Moderating',
    thisWeek: 'This week',
    meetings: 'meetings',
    groupsFound: 'Groups Found',
    noGroupsFound: 'No groups found',
    tryAdjusting: 'Try adjusting your search or filters',
    join: 'Join',
    nextMeeting: 'Next meeting',
    moderatedBy: 'Moderated by',
    like: 'Like',
    message: 'Message',
    view: 'View',
    learnMore: 'Learn More →',
    members: 'members',
    
    // Group Types
    anxiety: 'Anxiety',
    depression: 'Depression',
    mindfulness: 'Mindfulness',
    academic: 'Academic',
    identity: 'Identity',
    grief: 'Grief',
    stress: 'Stress',
    
    // Group Names and Descriptions
    anxietySupportCircle: 'Anxiety Support Circle',
    anxietyDescription: 'A safe space to share experiences and coping strategies for anxiety management.',
    depressionRecoveryGroup: 'Depression Recovery Group',
    depressionDescription: 'Supporting each other through the journey of overcoming depression.',
    mindfulnessMeditation: 'Mindfulness & Meditation',
    mindfulnessDescription: 'Daily practice sessions for mindfulness and meditation techniques.',
    studyStressManagement: 'Study Stress Management',
    studyStressDescription: 'Helping students manage academic pressure and study-related stress.',
    lgbtqWellness: 'LGBTQ+ Mental Wellness',
    lgbtqDescription: 'A supportive community for LGBTQ+ students to discuss mental health.',
    griefLossSupport: 'Grief & Loss Support',
    griefDescription: 'Supporting those dealing with grief and loss of loved ones.',
    
    // Language Groups
    hindiSupportGroup: 'Hindi Support Group',
    hindiSupportDescription: 'Mental health support in Hindi language for comfortable communication.',
    teluguSupportGroup: 'Telugu Support Group',
    teluguSupportDescription: 'Mental wellness discussions in Telugu for native speakers.',
    
    // Common UI
    loading: 'Loading...',
    error: 'Error',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    
    // Days and Times
    today: 'Today',
    tomorrow: 'Tomorrow',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  },
  
  hi: {
    // Support Groups
    supportGroups: 'सहायता समूह',
    connectWithOthers: 'उन लोगों से जुड़ें जो आपकी यात्रा को समझते हैं',
    createGroup: 'समूह बनाएं',
    searchGroups: 'समूह खोजें',
    searchPlaceholder: 'समूह खोजें...',
    categories: 'श्रेणियां',
    allGroups: 'सभी समूह',
    public: 'सार्वजनिक',
    private: 'निजी',
    yourGroups: 'आपके समूह',
    joined: 'शामिल हुए',
    moderating: 'संचालन कर रहे',
    thisWeek: 'इस सप्ताह',
    meetings: 'बैठकें',
    groupsFound: 'समूह मिले',
    noGroupsFound: 'कोई समूह नहीं मिला',
    tryAdjusting: 'अपनी खोज या फ़िल्टर को समायोजित करने का प्रयास करें',
    join: 'शामिल हों',
    nextMeeting: 'अगली बैठक',
    moderatedBy: 'द्वारा संचालित',
    like: 'पसंद',
    message: 'संदेश',
    view: 'देखें',
    learnMore: 'और जानें →',
    members: 'सदस्य',
    
    // Group Types
    anxiety: 'चिंता',
    depression: 'अवसाद',
    mindfulness: 'सचेतता',
    academic: 'शैक्षणिक',
    identity: 'पहचान',
    grief: 'शोक',
    stress: 'तनाव',
    
    // Group Names and Descriptions
    anxietySupportCircle: 'चिंता सहायता वृत्त',
    anxietyDescription: 'चिंता प्रबंधन के लिए अनुभव और मुकाबला रणनीतियों को साझा करने के लिए एक सुरक्षित स्थान।',
    depressionRecoveryGroup: 'अवसाद रिकवरी समूह',
    depressionDescription: 'अवसाद पर काबू पाने की यात्रा में एक दूसरे का समर्थन करना।',
    mindfulnessMeditation: 'सचेतता और ध्यान',
    mindfulnessDescription: 'सचेतता और ध्यान तकनीकों के लिए दैनिक अभ्यास सत्र।',
    studyStressManagement: 'अध्ययन तनाव प्रबंधन',
    studyStressDescription: 'छात्रों को शैक्षणिक दबाव और अध्ययन संबंधी तनाव का प्रबंधन करने में मदद करना।',
    lgbtqWellness: 'LGBTQ+ मानसिक कल्याण',
    lgbtqDescription: 'LGBTQ+ छात्रों के लिए मानसिक स्वास्थ्य पर चर्चा करने के लिए एक सहायक समुदाय।',
    griefLossSupport: 'शोक और हानि सहायता',
    griefDescription: 'अपने प्रियजनों के शोक और नुकसान से निपटने वालों का समर्थन करना।',
    
    // Language Groups
    hindiSupportGroup: 'हिंदी सहायता समूह',
    hindiSupportDescription: 'आरामदायक संचार के लिए हिंदी भाषा में मानसिक स्वास्थ्य सहायता।',
    teluguSupportGroup: 'तेलुगु सहायता समूह',
    teluguSupportDescription: 'मूल वक्ताओं के लिए तेलुगु में मानसिक कल्याण चर्चा।',
    
    // Common UI
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    save: 'सेव करें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    back: 'वापस',
    next: 'अगला',
    
    // Days and Times
    today: 'आज',
    tomorrow: 'कल',
    monday: 'सोमवार',
    tuesday: 'मंगलवार',
    wednesday: 'बुधवार',
    thursday: 'गुरुवार',
    friday: 'शुक्रवार',
    saturday: 'शनिवार',
    sunday: 'रविवार',
  },
  
  te: {
    // Support Groups
    supportGroups: 'మద్దతు గ్రూపులు',
    connectWithOthers: 'మీ ప్రయాణాన్ని అర్థం చేసుకునే ఇతరులతో కనెక్ట్ అవ్వండి',
    createGroup: 'గ్రూప్ సృష్టించండి',
    searchGroups: 'గ్రూపులు వెతకండి',
    searchPlaceholder: 'గ్రూపులు వెతకండి...',
    categories: 'వర్గాలు',
    allGroups: 'అన్ని గ్రూపులు',
    public: 'పబ్లిక్',
    private: 'ప్రైవేట్',
    yourGroups: 'మీ గ్రూపులు',
    joined: 'చేరారు',
    moderating: 'మోడరేట్ చేస్తున్నారు',
    thisWeek: 'ఈ వారం',
    meetings: 'మీటింగ్లు',
    groupsFound: 'గ్రూపులు దొరికాయి',
    noGroupsFound: 'గ్రూపులు దొరకలేదు',
    tryAdjusting: 'మీ వెతకడం లేదా ఫిల్టర్లను సర్దుబాటు చేయడానికి ప్రయత్నించండి',
    join: 'చేరండి',
    nextMeeting: 'తదుపరి మీటింగ్',
    moderatedBy: 'చేత మోడరేట్ చేయబడింది',
    like: 'ఇష్టం',
    message: 'సందేశం',
    view: 'చూడండి',
    learnMore: 'మరింత తెలుసుకోండి →',
    members: 'సభ్యులు',
    
    // Group Types
    anxiety: 'ఆత్రత',
    depression: 'డిప్రెషన్',
    mindfulness: 'మైండ్‌ఫుల్‌నెస్',
    academic: 'అకడమిక్',
    identity: 'గుర్తింపు',
    grief: 'దుఃఖం',
    stress: 'ఒత్తిడి',
    
    // Group Names and Descriptions
    anxietySupportCircle: 'ఆత్రత మద్దతు వృత్తం',
    anxietyDescription: 'ఆత్రత నిర్వహణ కోసం అనుభవాలు మరియు కోపింగ్ వ్యూహాలను పంచుకోవడానికి సురక్షితమైన స్థలం.',
    depressionRecoveryGroup: 'డిప్రెషన్ రికవరీ గ్రూప్',
    depressionDescription: 'డిప్రెషన్‌ను అధిగమించే ప్రయాణంలో ఒకరికొకరు మద్దతు ఇవ్వడం.',
    mindfulnessMeditation: 'మైండ్‌ఫుల్‌నెస్ & మెడిటేషన్',
    mindfulnessDescription: 'మైండ్‌ఫుల్‌నెస్ మరియు మెడిటేషన్ టెక్నిక్‌ల కోసం దైనిక అభ్యాస సెషన్లు.',
    studyStressManagement: 'అధ్యయన ఒత్తిడి నిర్వహణ',
    studyStressDescription: 'విద్యార్థులకు అకడమిక్ ప్రెషర్ మరియు అధ్యయనం సంబంధిత ఒత్తిడిని నిర్వహించడంలో సహాయపడటం.',
    lgbtqWellness: 'LGBTQ+ మానసిక సంక్షేమం',
    lgbtqDescription: 'LGBTQ+ విద్యార్థుల కోసం మానసిక ఆరోగ్యం గురించి చర్చించడానికి సహాయక సముదాయం.',
    griefLossSupport: 'దుఃఖం & నష్టం మద్దతు',
    griefDescription: 'ప్రియమైన వారి దుఃఖం మరియు నష్టంతో వ్యవహరిస్తున్న వారికి మద్దతు ఇవ్వడం.',
    
    // Language Groups
    hindiSupportGroup: 'హిందీ మద్దతు గ్రూప్',
    hindiSupportDescription: 'సౌకర్యవంతమైన కమ్యూనికేషన్ కోసం హిందీ భాషలో మానసిక ఆరోగ్య మద్దతు.',
    teluguSupportGroup: 'తెలుగు మద్దతు గ్రూప్',
    teluguSupportDescription: 'స్థానిక మాట్లాడేవారి కోసం తెలుగులో మానసిక సంక్షేమ చర్చలు.',
    
    // Common UI
    loading: 'లోడ్ చేస్తోంది...',
    error: 'ఎర్రర్',
    save: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    delete: 'తొలగించండి',
    edit: 'సవరించండి',
    back: 'వెనుకకు',
    next: 'తదుపరి',
    
    // Days and Times
    today: 'ఈరోజు',
    tomorrow: 'రేపు',
    monday: 'సోమవారం',
    tuesday: 'మంగళవారం',
    wednesday: 'బుధవారం',
    thursday: 'గురువారం',
    friday: 'శుక్రవారం',
    saturday: 'శనివారం',
    sunday: 'ఆదివారం',
  }
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('campuscare-language');
    if (savedLanguage && LANGUAGES[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (languageCode) => {
    if (LANGUAGES[languageCode]) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('campuscare-language', languageCode);
    }
  };

  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.en[key] || key;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    languages: LANGUAGES,
    isRTL: false, // Add RTL support if needed for future languages
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};