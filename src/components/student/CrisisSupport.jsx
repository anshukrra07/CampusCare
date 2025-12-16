import React, { useState } from "react";
import {
  ExclamationTriangleIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  ClockIcon,
  HeartIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  HeartIcon as HeartIconSolid,
} from "@heroicons/react/24/solid";

export default function CrisisSupport() {
  const [emergencyContacts] = useState([
    {
      id: 1,
      name: "National Suicide Prevention Lifeline",
      number: "988",
      description: "Free and confidential emotional support 24/7 for people in suicidal crisis or emotional distress.",
      type: "call",
      available: "24/7",
      languages: "Multiple languages available",
      urgent: true,
    },
    {
      id: 2,
      name: "Crisis Text Line",
      number: "Text HOME to 741741",
      description: "Free, 24/7 support for those in crisis. Text with a trained crisis counselor.",
      type: "text",
      available: "24/7",
      languages: "English, Spanish",
      urgent: true,
    },
    {
      id: 3,
      name: "Campus Security",
      number: "911 or Campus Emergency",
      description: "Immediate emergency response for life-threatening situations on campus.",
      type: "call",
      available: "24/7",
      languages: "Multiple languages available",
      urgent: true,
    },
    {
      id: 4,
      name: "Campus Counseling Center",
      number: "(555) 123-4567",
      description: "Professional counseling services for students. Walk-ins welcome for crisis situations.",
      type: "call",
      available: "Mon-Fri 8AM-5PM, Emergency after hours",
      languages: "English, Spanish, French",
      urgent: false,
    },
    {
      id: 5,
      name: "SAMHSA National Helpline",
      number: "1-800-662-4357",
      description: "Treatment referral and information service for mental health and substance use disorders.",
      type: "call",
      available: "24/7",
      languages: "English, Spanish",
      urgent: false,
    },
  ]);

  const [resources] = useState([
    {
      id: 1,
      title: "Immediate Coping Strategies",
      items: [
        "Take slow, deep breaths (4 counts in, hold for 4, out for 6)",
        "Call or text a trusted friend or family member",
        "Remove yourself from immediate danger",
        "Use the 5-4-3-2-1 grounding technique",
        "Listen to calming music or sounds",
      ],
    },
    {
      id: 2,
      title: "Warning Signs to Watch For",
      items: [
        "Thoughts of suicide or self-harm",
        "Feeling hopeless or trapped",
        "Extreme mood changes",
        "Withdrawal from friends and activities",
        "Increased use of alcohol or drugs",
        "Giving away personal possessions",
      ],
    },
    {
      id: 3,
      title: "How to Help a Friend",
      items: [
        "Listen without judgment",
        "Take their concerns seriously",
        "Help them connect with professional support",
        "Stay with them if they're in immediate danger",
        "Follow up regularly",
        "Take care of yourself too",
      ],
    },
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Emergency Header */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-8 text-white">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-white/20 p-3 rounded-full">
            <ExclamationTriangleIconSolid className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">Crisis Support</h1>
            <p className="text-red-100">
              Immediate help is available. You are not alone.
            </p>
          </div>
        </div>
        
        <div className="bg-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">⚠️ If you are in immediate danger:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="tel:988"
              className="bg-white text-red-600 p-4 rounded-lg font-semibold text-center hover:bg-red-50 transition-colors duration-200 flex items-center justify-center"
            >
              <PhoneIcon className="w-5 h-5 mr-2" />
              Call 988 - Suicide & Crisis Lifeline
            </a>
            <a
              href="tel:911"
              className="bg-white text-red-600 p-4 rounded-lg font-semibold text-center hover:bg-red-50 transition-colors duration-200 flex items-center justify-center"
            >
              <PhoneIcon className="w-5 h-5 mr-2" />
              Call 911 - Emergency Services
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Emergency Contacts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <PhoneIcon className="w-6 h-6 mr-2 text-red-600" />
                Emergency Contacts
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {emergencyContacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          </div>

          {/* Crisis Resources */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <div key={resource.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{resource.title}</h3>
                <ul className="space-y-2">
                  {resource.items.map((item, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Safety Planning */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ShieldCheckIcon className="w-6 h-6 mr-2 text-green-600" />
              Create Your Safety Plan
            </h2>
            <p className="text-gray-600 mb-6">
              A safety plan is a personalized, practical plan to improve your safety and help you through difficult moments.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">1. Warning Signs</h4>
                  <textarea
                    placeholder="List your personal warning signs (thoughts, feelings, behaviors)..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">2. Coping Strategies</h4>
                  <textarea
                    placeholder="What helps you feel better when you're struggling?..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">3. Support People</h4>
                  <textarea
                    placeholder="List people you can call (name and phone number)..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">4. Safe Environment</h4>
                  <textarea
                    placeholder="How can you make your environment safer?..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">5. Professional Contacts</h4>
                  <textarea
                    placeholder="Therapist, doctor, or other professional contacts..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">6. Reasons for Living</h4>
                  <textarea
                    placeholder="What gives your life meaning and hope?..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200">
                Save Safety Plan
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200">
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="tel:988"
                className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors duration-200 flex items-center justify-center"
              >
                <PhoneIcon className="w-4 h-4 mr-2" />
                Call Crisis Line
              </a>
              <button className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                Start Crisis Chat
              </button>
              <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center">
                <MapPinIcon className="w-4 h-4 mr-2" />
                Find Local Help
              </button>
            </div>
          </div>

          {/* Mental Health Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
              <HeartIconSolid className="w-5 h-5 mr-2" />
              Remember
            </h3>
            <div className="space-y-3 text-blue-700 text-sm">
              <p>• Crisis feelings are temporary</p>
              <p>• You are not alone in this</p>
              <p>• Help is always available</p>
              <p>• Recovery is possible</p>
              <p>• Your life has value</p>
            </div>
          </div>

          {/* Campus Resources */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campus Resources</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Counseling Center</p>
                  <p className="text-sm text-gray-600">Building A, Room 205</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <HeartIcon className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Wellness Center</p>
                  <p className="text-sm text-gray-600">Building B, Room 101</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPinIcon className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium">Health Services</p>
                  <p className="text-sm text-gray-600">Medical Center, 1st Floor</p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center">
              <InformationCircleIcon className="w-5 h-5 mr-2" />
              Important Notice
            </h3>
            <p className="text-yellow-700 text-sm">
              This page provides crisis resources and is not a substitute for professional mental health care. 
              If you are experiencing a medical emergency, call 911 immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactCard({ contact }) {
  const getTypeIcon = (type) => {
    switch (type) {
      case "text":
        return ChatBubbleLeftRightIcon;
      default:
        return PhoneIcon;
    }
  };

  const TypeIcon = getTypeIcon(contact.type);

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors duration-200 ${
      contact.urgent ? "border-l-4 border-red-500" : ""
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-full ${
              contact.urgent ? "bg-red-100" : "bg-blue-100"
            }`}>
              <TypeIcon className={`w-4 h-4 ${
                contact.urgent ? "text-red-600" : "text-blue-600"
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{contact.name}</h3>
              {contact.urgent && (
                <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                  URGENT
                </span>
              )}
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">{contact.description}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-500">
            <div className="flex items-center">
              <ClockIcon className="w-3 h-3 mr-1" />
              {contact.available}
            </div>
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="w-3 h-3 mr-1" />
              {contact.languages}
            </div>
            <div className="flex items-center">
              <TypeIcon className="w-3 h-3 mr-1" />
              {contact.type === "text" ? "Text" : "Call"}
            </div>
          </div>
        </div>
        
        <div className="ml-4">
          <a
            href={contact.type === "text" ? `sms:741741?body=HOME` : `tel:${contact.number.replace(/[^\d]/g, '')}`}
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              contact.urgent
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            <TypeIcon className="w-4 h-4 mr-2" />
            {contact.number}
          </a>
        </div>
      </div>
    </div>
  );
}