import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoaderOne } from '@/components/ui/loader';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter } from 'lucide-react';
import { MockTest } from '../types';
import { useTests } from '../hooks/useTests';
import TestDetailsModal from '../components/TestDetailsModal';
import TestCard from '../components/TestCard';



export default function MockLibrary() {
  const navigate = useNavigate();
  const { tests, loading, error } = useTests();
  const [filteredTests, setFilteredTests] = useState<MockTest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [examFilter, setExamFilter] = useState<string>('All');
  const [durationFilter, setDurationFilter] = useState<string>('All');
  const [selectedTest, setSelectedTest] = useState<MockTest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Update filtered tests when tests or filters change
  useEffect(() => {
    setFilteredTests(tests);
  }, [tests]);

  useEffect(() => {
    let filtered = tests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.skillTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Exam filter
    if (examFilter !== 'All') {
      filtered = filtered.filter(test => test.exam === examFilter);
    }

    // Duration filter
    if (durationFilter !== 'All') {
      filtered = filtered.filter(test => {
        switch (durationFilter) {
          case 'Short': return test.duration <= 90;
          case 'Medium': return test.duration > 90 && test.duration <= 150;
          case 'Long': return test.duration > 150;
          default: return true;
        }
      });
    }

    setFilteredTests(filtered);
  }, [tests, searchTerm, examFilter, durationFilter]);



  const handleShowTestDetails = (test: MockTest) => {
    setSelectedTest(test);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTest(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <LoaderOne />
          </div>
          <p className="text-gray-600">Loading test library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load tests</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/mock-tests')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Library</h1>
            <p className="text-gray-600">
              Professionally curated mock tests designed by experts
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests or topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Exam Filter */}
            <div>
              <select
                value={examFilter}
                onChange={(e) => setExamFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="All">All Exams</option>
                <option value="JEE Main">JEE Main</option>
                <option value="JEE Advanced">JEE Advanced</option>
                <option value="NEET">NEET</option>
              </select>
            </div>

            {/* Duration Filter */}
            <div>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="All">All Durations</option>
                <option value="Short">Short (≤90 min)</option>
                <option value="Medium">Medium (90-150 min)</option>
                                  <option value="Long">Long (&gt;150 min)</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {filteredTests.length} of {tests.length} tests
            </p>
          </div>
        </div>

        {/* Tests Grid */}
        {filteredTests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {tests.length === 0 ? 'No tests available' : 'No tests found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {tests.length === 0 
                ? 'There are no tests in the database yet. Please check back later or contact an administrator.'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {tests.length > 0 && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setExamFilter('All');
                  setDurationFilter('All');
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                onShowDetails={handleShowTestDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Test Details Modal */}
      {selectedTest && (
        <TestDetailsModal
          test={selectedTest}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
