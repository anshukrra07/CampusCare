import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  HeartIcon,
  UserIcon,
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  XMarkIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
  FireIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { db } from '../../lib/firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

export default function ConcernReportsManagement({ institutionCode, counselorId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    urgency: 'all',
    concernType: 'all',
    search: '',
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (institutionCode && institutionCode !== 'NOT_CONFIGURED' && institutionCode !== 'ERROR') {
      loadReports();
    }
  }, [institutionCode, counselorId]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const reportsRef = collection(db, 'institutions', institutionCode, 'concernReports');
      const q = query(reportsRef, orderBy('createdAt', 'desc'));
      
      // Set up real-time listener
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reportsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`📝 Loaded ${reportsData.length} concern reports for institution: ${institutionCode}`);
        console.log('📊 Reports data:', reportsData);
        setReports(reportsData);
        setLoading(false);
      }, (error) => {
        console.error('❌ Error loading concern reports:', error);
        setReports([]);
        setLoading(false);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up concern reports listener:', error);
      setReports([]);
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId, newStatus, notes = '') => {
    setUpdating(true);
    try {
      const reportRef = doc(db, 'institutions', institutionCode, 'concernReports', reportId);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === 'in_progress' || newStatus === 'resolved') {
        updateData.assignedCounselor = counselorId;
      }

      if (notes) {
        updateData.notes = [
          ...(selectedReport?.notes || []),
          {
            content: notes,
            counselorId: counselorId,
            timestamp: serverTimestamp(),
          }
        ];
      }

      await updateDoc(reportRef, updateData);
      console.log('✅ Report status updated successfully');
      setShowDetailModal(false);
    } catch (error) {
      console.error('❌ Error updating report status:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Filter reports based on current filters
  const filteredReports = reports.filter(report => {
    if (filters.status !== 'all' && report.status !== filters.status) return false;
    if (filters.urgency !== 'all' && report.urgency !== filters.urgency) return false;
    if (filters.concernType !== 'all' && report.concernType !== filters.concernType) return false;
    if (filters.search && !report.subjectName.toLowerCase().includes(filters.search.toLowerCase()) 
        && !report.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'critical': return <FireIcon className="h-4 w-4 text-red-600" />;
      case 'high': return <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />;
      case 'medium': return <ExclamationCircleIcon className="h-4 w-4 text-yellow-600" />;
      case 'low': return <InformationCircleIcon className="h-4 w-4 text-green-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConcernTypeLabel = (type) => {
    const labels = {
      mental_health: 'Mental Health',
      anxiety: 'Anxiety',
      self_harm: 'Self-Harm',
      suicidal: 'Suicidal Thoughts',
      eating_disorder: 'Eating Disorder',
      substance_abuse: 'Substance Abuse',
      academic_stress: 'Academic Stress',
      social_isolation: 'Social Isolation',
      relationship_issues: 'Relationship Issues',
      behavioral_changes: 'Behavioral Changes',
      violence_threat: 'Violence Threat',
      abuse: 'Abuse',
      other: 'Other'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading concern reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShieldExclamationIcon className="h-7 w-7 text-blue-600 mr-3" />
            Concern Reports
          </h2>
          <p className="text-gray-600">
            Reports submitted by students about their peers who may need support
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Checking institution: {institutionCode}
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>{filteredReports.length}</strong> reports 
            {filters.status !== 'all' && ` (${filters.status})`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={filters.urgency}
            onChange={(e) => setFilters(prev => ({ ...prev, urgency: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Urgency</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Concern Type Filter */}
          <select
            value={filters.concernType}
            onChange={(e) => setFilters(prev => ({ ...prev, concernType: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="mental_health">Mental Health</option>
            <option value="anxiety">Anxiety</option>
            <option value="suicidal">Suicidal Thoughts</option>
            <option value="self_harm">Self-Harm</option>
            <option value="substance_abuse">Substance Abuse</option>
            <option value="academic_stress">Academic Stress</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <HeartIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No concern reports</h3>
          <p className="text-gray-600">
            {reports.length === 0 
              ? "No reports have been submitted yet." 
              : "No reports match your current filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getUrgencyIcon(report.urgency)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Concern about: {report.subjectName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(report.urgency)}`}>
                          {report.urgency.charAt(0).toUpperCase() + report.urgency.slice(1)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          <span>{getConcernTypeLabel(report.concernType)}</span>
                        </div>
                        {report.relationship && (
                          <div className="flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            <span>Reported by: {report.relationship}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 mr-1" />
                          <span>{new Date(report.createdAt?.toDate?.() || report.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {report.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {report.location && (
                            <div className="flex items-center">
                              <MapPinIcon className="h-3 w-3 mr-1" />
                              <span>{report.location}</span>
                            </div>
                          )}
                          {report.isAnonymous ? (
                            <span className="flex items-center text-blue-600">
                              <ShieldExclamationIcon className="h-3 w-3 mr-1" />
                              Anonymous
                            </span>
                          ) : (
                            <span className="flex items-center text-green-600">
                              <UserIcon className="h-3 w-3 mr-1" />
                              Contact available
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setShowDetailModal(true);
                          }}
                          className="flex items-center px-4 py-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Concern Report Details
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Report Header */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      {getUrgencyIcon(selectedReport.urgency)}
                      <span className="ml-2">Concern about: {selectedReport.subjectName}</span>
                    </h3>
                    {selectedReport.subjectId && (
                      <p className="text-sm text-gray-600 mt-1">Student ID: {selectedReport.subjectId}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(selectedReport.urgency)}`}>
                      {selectedReport.urgency.charAt(0).toUpperCase() + selectedReport.urgency.slice(1)} Priority
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedReport.status)}`}>
                      {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Concern Type:</span>
                    <p className="text-gray-600">{getConcernTypeLabel(selectedReport.concernType)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Relationship:</span>
                    <p className="text-gray-600">{selectedReport.relationship || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Date Submitted:</span>
                    <p className="text-gray-600">
                      {new Date(selectedReport.createdAt?.toDate?.() || selectedReport.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description of Concerns</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedReport.location && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      Location
                    </h4>
                    <p className="text-gray-700">{selectedReport.location}</p>
                  </div>
                )}
                
                {selectedReport.dateObserved && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      Date Observed
                    </h4>
                    <p className="text-gray-700">{new Date(selectedReport.dateObserved).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Reporter Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <UserIcon className="h-4 w-4 mr-1" />
                  Reporter Information
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {selectedReport.isAnonymous ? (
                    <div className="flex items-center text-blue-600">
                      <ShieldExclamationIcon className="h-5 w-5 mr-2" />
                      <span>This report was submitted anonymously</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedReport.reportedBy?.name && (
                        <p><strong>Name:</strong> {selectedReport.reportedBy.name}</p>
                      )}
                      {selectedReport.reportedBy?.email && (
                        <p className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 mr-2" />
                          <strong>Email:</strong> 
                          <a href={`mailto:${selectedReport.reportedBy.email}`} className="text-blue-600 hover:underline ml-1">
                            {selectedReport.reportedBy.email}
                          </a>
                        </p>
                      )}
                      {selectedReport.reportedBy?.phone && (
                        <p className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          <strong>Phone:</strong> 
                          <a href={`tel:${selectedReport.reportedBy.phone}`} className="text-blue-600 hover:underline ml-1">
                            {selectedReport.reportedBy.phone}
                          </a>
                        </p>
                      )}
                      <p>
                        <strong>Follow-up allowed:</strong> {selectedReport.allowFollowUp ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedReport.notes && selectedReport.notes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Counselor Notes</h4>
                  <div className="space-y-3">
                    {selectedReport.notes.map((note, index) => (
                      <div key={index} className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-gray-700">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Added {note.timestamp?.toDate?.()?.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-end space-x-3">
                  {selectedReport.status === 'new' && (
                    <>
                      <button
                        onClick={() => updateReportStatus(selectedReport.id, 'in_progress')}
                        disabled={updating}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updating ? (
                          <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ClockIcon className="h-4 w-4 mr-2" />
                        )}
                        Mark In Progress
                      </button>
                    </>
                  )}
                  
                  {selectedReport.status === 'in_progress' && (
                    <button
                      onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                      disabled={updating}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {updating ? (
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                      )}
                      Mark Resolved
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}