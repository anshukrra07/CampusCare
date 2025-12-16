import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  HeartIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeSlashIcon,
  EyeIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ReportConcernForm({ institutionCode = 'default', onClose }) {
  const [formData, setFormData] = useState({
    // Report details
    subjectName: '',
    subjectId: '',
    relationship: '',
    concernType: '',
    urgency: 'medium',
    description: '',
    location: '',
    dateObserved: '',
    
    // Reporter details
    isAnonymous: true,
    reporterName: '',
    reporterEmail: '',
    reporterPhone: '',
    allowFollowUp: false,
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.subjectName.trim()) {
      setError('Please provide the name or description of the person you\'re concerned about.');
      return;
    }
    
    if (!formData.concernType) {
      setError('Please select the type of concern.');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Please describe your concerns.');
      return;
    }
    
    if (!formData.isAnonymous && formData.allowFollowUp && !formData.reporterEmail.trim()) {
      setError('Please provide your email if you want to allow follow-up contact.');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      // Prepare report data
      const reportData = {
        // Subject information
        subjectName: formData.subjectName.trim(),
        subjectId: formData.subjectId.trim() || null,
        relationship: formData.relationship,
        
        // Concern details
        concernType: formData.concernType,
        urgency: formData.urgency,
        description: formData.description.trim(),
        location: formData.location.trim() || null,
        dateObserved: formData.dateObserved || null,
        
        // Reporter information (only if not anonymous)
        isAnonymous: formData.isAnonymous,
        reportedBy: formData.isAnonymous ? null : {
          name: formData.reporterName.trim() || null,
          email: formData.reporterEmail.trim() || null,
          phone: formData.reporterPhone.trim() || null,
        },
        allowFollowUp: formData.allowFollowUp,
        
        // System fields
        institutionCode: institutionCode,
        status: 'new',
        assignedCounselor: null,
        tags: [],
        notes: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Submit to Firestore
      const reportsRef = collection(db, 'institutions', institutionCode, 'concernReports');
      await addDoc(reportsRef, reportData);
      
      setSubmitted(true);
      console.log('✅ Concern report submitted successfully');
      
    } catch (error) {
      console.error('❌ Error submitting concern report:', error);
      setError('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-600" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Report Submitted</h2>
            <p className="mt-2 text-gray-600">
              Thank you for caring about your fellow student. Your report has been submitted and will be reviewed by our counseling team.
            </p>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="ml-3 text-sm text-blue-700">
                  <p className="font-medium">What happens next?</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• A counselor will review your report within 24 hours</li>
                    <li>• Appropriate support will be provided to the person you're concerned about</li>
                    <li>• If you provided contact information, we may reach out for follow-up</li>
                    <li>• All reports are handled confidentially and professionally</li>
                  </ul>
                </div>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="mt-6 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <HeartIcon className="h-8 w-8 text-blue-600 mr-3" />
                  Report a Concern
                </h1>
                <p className="mt-2 text-gray-600">
                  Help us support someone who might be struggling. Your report will be handled confidentially.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Institution: {institutionCode}
                </p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-8 space-y-8">
            {/* Anonymous Reporting Toggle */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="anonymous"
                    name="isAnonymous"
                    type="checkbox"
                    checked={formData.isAnonymous}
                    onChange={handleInputChange}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="anonymous" className="font-medium text-blue-900 flex items-center">
                    <EyeSlashIcon className="h-4 w-4 mr-1" />
                    Submit this report anonymously
                  </label>
                  <p className="text-blue-700">
                    Your identity will not be shared. Uncheck this if you want to provide contact information.
                  </p>
                </div>
              </div>
            </div>

            {/* Person of Concern Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                About the Person You're Concerned About
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700">
                    Name or Description *
                  </label>
                  <input
                    type="text"
                    id="subjectName"
                    name="subjectName"
                    value={formData.subjectName}
                    onChange={handleInputChange}
                    placeholder="e.g., John Doe or 'classmate in my physics lab'"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="subjectId" className="block text-sm font-medium text-gray-700">
                    Student ID (if known)
                  </label>
                  <input
                    type="text"
                    id="subjectId"
                    name="subjectId"
                    value={formData.subjectId}
                    onChange={handleInputChange}
                    placeholder="Optional"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
                  Your Relationship to This Person
                </label>
                <select
                  id="relationship"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select relationship</option>
                  <option value="friend">Close friend</option>
                  <option value="classmate">Classmate</option>
                  <option value="roommate">Roommate</option>
                  <option value="acquaintance">Acquaintance</option>
                  <option value="stranger">Don't know them personally</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Concern Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-gray-400 mr-2" />
                Concern Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="concernType" className="block text-sm font-medium text-gray-700">
                    Type of Concern *
                  </label>
                  <select
                    id="concernType"
                    name="concernType"
                    value={formData.concernType}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select concern type</option>
                    <option value="mental_health">Mental health / Depression</option>
                    <option value="anxiety">Anxiety / Panic attacks</option>
                    <option value="self_harm">Self-harm concerns</option>
                    <option value="suicidal">Suicidal thoughts/behavior</option>
                    <option value="eating_disorder">Eating disorder</option>
                    <option value="substance_abuse">Substance abuse</option>
                    <option value="academic_stress">Academic stress/burnout</option>
                    <option value="social_isolation">Social isolation</option>
                    <option value="relationship_issues">Relationship problems</option>
                    <option value="behavioral_changes">Concerning behavioral changes</option>
                    <option value="violence_threat">Threats of violence</option>
                    <option value="abuse">Abuse (physical/emotional)</option>
                    <option value="other">Other concern</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="urgency" className="block text-sm font-medium text-gray-700">
                    Urgency Level
                  </label>
                  <select
                    id="urgency"
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low - General concern</option>
                    <option value="medium">Medium - Noticeable changes</option>
                    <option value="high">High - Serious concern</option>
                    <option value="critical">Critical - Immediate danger</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description of Your Concerns *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Please describe what you've observed that concerns you. Include specific behaviors, changes you've noticed, things they've said, etc. The more detail you provide, the better we can help."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    Location (if relevant)
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Smith Dorm, Library, Cafeteria"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="dateObserved" className="block text-sm font-medium text-gray-700 flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                    When Did You Notice This?
                  </label>
                  <input
                    type="date"
                    id="dateObserved"
                    name="dateObserved"
                    value={formData.dateObserved}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information (if not anonymous) */}
            {!formData.isAnonymous && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <EyeIcon className="h-5 w-5 text-gray-400 mr-2" />
                  Your Contact Information
                </h3>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div className="ml-3 text-sm text-yellow-700">
                      <p>
                        Your contact information will only be used by counseling staff and will not be shared with the person you're reporting about unless you explicitly request us to do so.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="reporterName" className="block text-sm font-medium text-gray-700 flex items-center">
                      <UserIcon className="h-4 w-4 mr-1" />
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="reporterName"
                      name="reporterName"
                      value={formData.reporterName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="reporterEmail" className="block text-sm font-medium text-gray-700 flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      Your Email
                    </label>
                    <input
                      type="email"
                      id="reporterEmail"
                      name="reporterEmail"
                      value={formData.reporterEmail}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reporterPhone" className="block text-sm font-medium text-gray-700 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    Your Phone Number (optional)
                  </label>
                  <input
                    type="tel"
                    id="reporterPhone"
                    name="reporterPhone"
                    value={formData.reporterPhone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="allowFollowUp"
                      name="allowFollowUp"
                      type="checkbox"
                      checked={formData.allowFollowUp}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="allowFollowUp" className="font-medium text-gray-700">
                      I'm willing to be contacted for follow-up questions
                    </label>
                    <p className="text-gray-500">
                      This may help us better understand the situation and provide more effective support.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <p>All reports are confidential and reviewed by professional counselors.</p>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                    submitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}