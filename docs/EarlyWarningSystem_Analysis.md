# 🚨 CampusCare Early Warning System - Complete Alert Analysis

## Overview
The Early Warning System uses an algorithmic approach to detect students at risk of depression, stress, or academic failure by monitoring **behavioral changes**, **academic performance**, and **attendance patterns**.

---

## 🎯 **PRIMARY FOCUS AREAS**

### 1. **Class Attendance** (Academic Performance Impact)
- **High Priority**: Daily attendance to lectures and academic classes
- **Why**: Directly impacts academic performance and degree completion

### 2. **Behavioral Changes** (Mental Health Indicators) 
- **High Priority**: Sudden changes in previously established patterns
- **Why**: Key early indicator of depression, stress, or underlying issues

---

## 📊 **COMPLETE ALERT CATALOG**

### 🔴 **HIGH SEVERITY ALERTS** (Immediate Action Required)

| Alert Type | Trigger Conditions | Message | Risk Score Impact | Recommended Action |
|------------|-------------------|---------|------------------|-------------------|
| **attendance_critical** | <60% attendance in last 5 days | "Critical attendance drop: X% in last 5 days" | +3 | Immediate counselor intervention required |
| **academic_decline** | >15 point drop in recent assessments | "Significant grade drop: X points in recent assessments" | +2 | Academic counseling and stress assessment needed |
| **club_participation_drop** | ≥50% drop from ≥70% previous participation | "Sudden drop in club participation: X% (down from Y%)" | +2 | Immediate check-in - sudden behavioral changes may indicate stress or mental health concerns |
| **event_participation_drop** | ≥60% drop from ≥70% previous participation | "Sharp decline in event participation: X% (down from Y%)" | +2 | Priority check-in - sudden withdrawal from activities is a key warning sign |
| **complete_club_withdrawal** | Dropped all clubs within 30 days | "Student recently dropped all club activities (X days ago)" | +2 | Urgent check-in required - complete withdrawal from previously enjoyed activities |
| **multiple_risk_factors** | ≥2 risk factors present | "Multiple risk indicators detected: [factors]" | +3 | Comprehensive wellness check and intervention plan needed |

### 🟡 **MEDIUM SEVERITY ALERTS** (Monitor Closely)

| Alert Type | Trigger Conditions | Message | Risk Score Impact | Recommended Action |
|------------|-------------------|---------|------------------|-------------------|
| **attendance_declining** | 60-80% attendance in last 5 days | "Declining attendance: X% in last 5 days" | +2 | Monitor closely, consider check-in call |
| **academic_concern** | 10-15 point drop in assessments | "Moderate grade decline: X points" | +1 | Schedule academic support session |
| **club_participation_decline** | ≥30% drop from ≥60% previous participation | "Declining club participation: X% (down from Y%)" | +1 | Monitor for stress or external factors affecting engagement |
| **event_participation_decline** | ≥40% drop from ≥50% previous participation | "Reduced event participation: X% (down from Y%)" | +1 | Check for barriers or changes in student circumstances |
| **recent_club_withdrawal** | Dropped all clubs 31-60 days ago | "Student stopped all club participation in the last 2 months" | +1 | Wellness check recommended - monitor for underlying issues |
| **club_withdrawal_unknown_date** | Previously had clubs, now none (no date) | "Student previously participated in clubs but is no longer active" | +1 | Check-in recommended to understand reasons for change |

### 🔵 **LOW SEVERITY ALERTS** (General Monitoring)

| Alert Type | Trigger Conditions | Message | Risk Score Impact | Recommended Action |
|------------|-------------------|---------|------------------|-------------------|
| **pending_assessment** | No assessment >14 days | "Wellness check overdue" | +1 | Schedule routine wellness check |

---

## 📈 **RISK SCORING SYSTEM** (Scale: 0-10)

### **Risk Score Calculation:**
- **Critical Attendance**: +3 points
- **Concerning Attendance**: +2 points  
- **Academic Decline**: +2 points
- **Social Withdrawal**: +2 points
- **Behavioral Changes**: +1 point
- **Maximum Score**: 10 points

### **Risk Categories:**
- **🔴 High Risk (7-10)**: Immediate counselor intervention
- **🟡 Medium Risk (4-6)**: Schedule wellness check-in  
- **🟢 Low Risk (0-3)**: Continue monitoring

---

## 🎯 **RISK FACTORS MATRIX**

### **Primary Risk Factors:**
1. **low_attendance**: <75% class attendance
2. **poor_academic**: <65 average marks
3. **social_withdrawal_concern**: Very low engagement + no clubs + other issues

### **Combined Risk Logic:**
- **≥2 Risk Factors** = HIGH severity "multiple_risk_factors" alert
- **Single Risk Factor** = Individual alert only

---

## 🔍 **DETECTION ALGORITHMS**

### **1. Attendance Pattern Analysis**
```
Recent Period: Last 5 days
Critical: <60% attendance → HIGH alert
Declining: 60-80% attendance → MEDIUM alert
Good: >80% attendance → No alert
```

### **2. Academic Performance Tracking**
```
Comparison: Last 2 bi-monthly assessments
Significant Drop: >15 points → HIGH alert
Moderate Drop: 10-15 points → MEDIUM alert
Stable/Improving: ≤10 points → No alert
```

### **3. Behavioral Change Detection**
```
Club Participation:
- Compare recent 2 weeks vs earlier 2 weeks
- High Drop: ≥50% decline from ≥70% → HIGH alert
- Medium Drop: ≥30% decline from ≥60% → MEDIUM alert

Event Participation:
- Compare recent 2 events vs earlier 2 events  
- High Drop: ≥60% decline from ≥70% → HIGH alert
- Medium Drop: ≥40% decline from ≥50% → MEDIUM alert
```

### **4. Complete Withdrawal Detection**
```
Timeline Analysis:
- 0-30 days since dropping all clubs → HIGH alert
- 31-60 days since dropping all clubs → MEDIUM alert
- >60 days or unknown date → LOW/MEDIUM alert
```

---

## 🎨 **UI COLOR CODING & STATUS**

### **Severity Colors:**
- **High**: `bg-red-50 border-red-200 text-red-800`
- **Medium**: `bg-yellow-50 border-yellow-200 text-yellow-800`  
- **Low**: `bg-blue-50 border-blue-200 text-blue-800`

### **Status Badges:**
- **HIGH PRIORITY**: Red badge
- **MEDIUM PRIORITY**: Yellow badge  
- **LOW PRIORITY**: Blue badge

### **Alert Status:**
- **✓ SOLVED**: Green badge (`bg-green-100 text-green-800`)
- **✗ NOT SOLVED**: Red badge (`bg-red-100 text-red-800`)
- **⏳ PENDING**: Orange badge (`bg-orange-100 text-orange-800`)

---

## 🚫 **IMPORTANT CLARIFICATIONS**

### **What is NOT Considered a Risk:**
- **Never joining clubs**: Normal behavior - many students focus on academics
- **Low social engagement alone**: Only flagged when combined with other issues
- **Stable low performance**: Only changes/drops trigger alerts

### **Key Mental Health Indicators:**
1. **Sudden behavioral changes** (highest priority)
2. **Academic performance drops** 
3. **Attendance pattern disruptions**
4. **Complete withdrawal from previously enjoyed activities**

---

## 📊 **ANALYTICS & TRENDS**

### **Trend Status Categories:**
- **Academic**: `improving`, `declining`, `stable`
- **Attendance**: `critical`, `concerning`, `good`, `stable`
- **Social**: `withdrawn`, `not_participating`, `active`
- **Behavioral**: `concerning`, `stable`

### **Comprehensive Student Analytics:**
- Risk score calculation (0-10)
- Trend analysis across all categories
- Timeline of alerts and changes
- Personalized recommendations
- Historical pattern tracking

---

## 🔧 **ALERT MANAGEMENT**

### **Alert Status Tracking:**
- Each alert gets unique ID: `{studentId}-{alertType}-{severity}`
- Status options: `solved`, `not_solved`, `pending`
- Timestamp and notes tracking
- Status update modal with reasoning

### **Filter Options:**
- **By Severity**: All, High, Medium, Low
- **By Status**: Solved, Not Solved, Pending
- **By Timeframe**: 7, 14, 30 days

---

## 💡 **RECOMMENDATIONS BY RISK LEVEL**

### **Risk Score 7-10 (High Risk):**
- **Action**: Immediate counselor intervention
- **Description**: Student shows multiple high-risk indicators requiring immediate attention
- **Urgency**: Same day response

### **Risk Score 4-6 (Medium Risk):**
- **Action**: Schedule wellness check-in  
- **Description**: Monitor student closely and provide support as needed
- **Urgency**: Within 2-3 days

### **Risk Score 0-3 (Low Risk):**
- **Action**: Continue monitoring
- **Description**: Student shows stable patterns, maintain regular oversight  
- **Urgency**: Regular scheduled check-ins

---

## 📋 **SUMMARY STATISTICS**

The system provides real-time dashboards showing:
- **High Risk Alerts**: Count requiring immediate attention
- **Students at Risk**: Total students with multiple risk factors  
- **Pending Assessments**: Students needing wellness checks
- **Alert Status Distribution**: Solved vs Not Solved vs Pending

This comprehensive system ensures no student falls through the cracks while avoiding over-pathologizing normal student behavior patterns.