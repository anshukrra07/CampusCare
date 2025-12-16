import React, { useState } from "react";
import {
  BookOpenIcon,
  PlayIcon,
 SpeakerWaveIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ClockIcon,
  UserIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import {
  BookOpenIcon as BookOpenIconSolid,
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid,
} from "@heroicons/react/24/solid";

export default function Resources() {
  const [resources] = useState([
    {
      id: 1,
      title: "Managing Anxiety in Daily Life",
      type: "article",
      category: "anxiety",
      description: "Practical strategies and techniques for managing anxiety symptoms in everyday situations.",
      author: "Dr. Sarah Chen",
      duration: "8 min read",
      rating: 4.8,
      downloads: 1234,
      tags: ["anxiety", "coping", "daily-life"],
      image: "📖",
      color: "bg-blue-100",
      textColor: "text-blue-800",
    },
    {
      id: 2,
      title: "Meditation for Beginners",
      type: "video",
      category: "mindfulness",
      description: "A guided introduction to meditation and mindfulness practices for stress relief.",
      author: "Lisa Martinez",
      duration: "15 min watch",
      rating: 4.9,
      downloads: 2156,
      tags: ["meditation", "mindfulness", "stress"],
      image: "🧘‍♀️",
      color: "bg-purple-100",
      textColor: "text-purple-800",
    },
    {
      id: 3,
      title: "Sleep Hygiene Podcast Series",
      type: "audio",
      category: "wellness",
      description: "Expert tips and techniques for improving sleep quality and establishing healthy sleep habits.",
      author: "Prof. Michael Johnson",
      duration: "20 min listen",
      rating: 4.7,
      downloads: 987,
      tags: ["sleep", "health", "routine"],
      image: "🎧",
      color: "bg-green-100",
      textColor: "text-green-800",
    },
    {
      id: 4,
      title: "Depression Recovery Workbook",
      type: "workbook",
      category: "depression",
      description: "Interactive exercises and journaling prompts to support your depression recovery journey.",
      author: "Dr. Emily Watson",
      duration: "Self-paced",
      rating: 5.0,
      downloads: 756,
      tags: ["depression", "recovery", "workbook"],
      image: "📝",
      color: "bg-yellow-100",
      textColor: "text-yellow-800",
    },
    {
      id: 5,
      title: "Stress Management Course",
      type: "course",
      category: "stress",
      description: "Comprehensive online course covering various stress management techniques and their applications.",
      author: "Campus Wellness Team",
      duration: "2 hours",
      rating: 4.6,
      downloads: 1567,
      tags: ["stress", "management", "course"],
      image: "🎓",
      color: "bg-indigo-100",
      textColor: "text-indigo-800",
    },
    {
      id: 6,
      title: "Breathing Exercises Guide",
      type: "guide",
      category: "mindfulness",
      description: "Step-by-step breathing exercises for anxiety relief and relaxation.",
      author: "Wellness Center",
      duration: "Quick reference",
      rating: 4.8,
      downloads: 2345,
      tags: ["breathing", "relaxation", "anxiety"],
      image: "🌬️",
      color: "bg-cyan-100",
      textColor: "text-cyan-800",
    },
  ]);

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { id: "all", name: "All Resources", count: resources.length },
    { id: "anxiety", name: "Anxiety", count: resources.filter(r => r.category === "anxiety").length },
    { id: "depression", name: "Depression", count: resources.filter(r => r.category === "depression").length },
    { id: "mindfulness", name: "Mindfulness", count: resources.filter(r => r.category === "mindfulness").length },
    { id: "stress", name: "Stress", count: resources.filter(r => r.category === "stress").length },
    { id: "wellness", name: "General Wellness", count: resources.filter(r => r.category === "wellness").length },
  ];

  const types = [
    { id: "article", name: "Articles", icon: DocumentTextIcon, count: resources.filter(r => r.type === "article").length },
    { id: "video", name: "Videos", icon: PlayIcon, count: resources.filter(r => r.type === "video").length },
    { id: "audio", name: "Audio", icon: SpeakerWaveIcon, count: resources.filter(r => r.type === "audio").length },
    { id: "workbook", name: "Workbooks", icon: BookOpenIcon, count: resources.filter(r => r.type === "workbook").length },
    { id: "course", name: "Courses", icon: AcademicCapIcon, count: resources.filter(r => r.type === "course").length },
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filter === "all" || resource.category === filter || resource.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-3 rounded-full">
              <BookOpenIconSolid className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Mental Health Resources</h1>
              <p className="text-emerald-100">
                Discover tools, guides, and content to support your mental wellness journey
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-2xl font-bold">{resources.length}+</p>
              <p className="text-sm text-emerald-100">Resources Available</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Resources</h3>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setFilter(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                    filter === category.id
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-sm font-medium">{category.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Resource Types */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Types</h3>
            <div className="space-y-2">
              {types.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setFilter(type.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center justify-between ${
                      filter === type.id
                        ? "bg-emerald-100 text-emerald-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-2" />
                      <span>{type.name}</span>
                    </div>
                    <span className="text-sm font-medium">{type.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Popular Tags */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {["anxiety", "mindfulness", "stress", "sleep", "coping", "relaxation"].map((tag) => (
                <span
                  key={tag}
                  className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-sm font-medium cursor-pointer hover:bg-emerald-200 transition-colors duration-200"
                  onClick={() => setSearchTerm(tag)}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredResources.length} Resource{filteredResources.length !== 1 ? 's' : ''} Found
            </h2>
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
              <option>Sort by relevance</option>
              <option>Sort by rating</option>
              <option>Sort by newest</option>
              <option>Sort by most downloaded</option>
            </select>
          </div>

          {/* Featured Resource */}
          {filteredResources.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-4xl">{filteredResources[0].image}</div>
                <div>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                    Featured Resource
                  </span>
                  <h3 className="text-2xl font-bold mt-2">{filteredResources[0].title}</h3>
                  <p className="text-emerald-100 mt-1">{filteredResources[0].description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-emerald-100">
                  <span className="flex items-center">
                    <UserIcon className="w-4 h-4 mr-1" />
                    {filteredResources[0].author}
                  </span>
                  <span className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {filteredResources[0].duration}
                  </span>
                  <span className="flex items-center">
                    <StarIconSolid className="w-4 h-4 mr-1 text-yellow-400" />
                    {filteredResources[0].rating}
                  </span>
                </div>
                
                <button className="bg-white text-emerald-700 px-6 py-2 rounded-lg font-medium hover:bg-emerald-50 transition-colors duration-200">
                  Access Resource
                </button>
              </div>
            </div>
          )}

          {/* Resources Grid */}
          {filteredResources.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredResources.slice(1).map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ resource }) {
  const [isFavorited, setIsFavorited] = useState(false);

  const getTypeIcon = (type) => {
    switch (type) {
      case "video":
        return PlayIcon;
      case "audio":
        return SpeakerWaveIcon;
      case "workbook":
        return BookOpenIcon;
      case "course":
        return AcademicCapIcon;
      case "guide":
        return DocumentTextIcon;
      default:
        return DocumentTextIcon;
    }
  };

  const TypeIcon = getTypeIcon(resource.type);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`${resource.color} p-3 rounded-xl text-2xl`}>
              {resource.image}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <TypeIcon className="w-4 h-4 text-gray-500" />
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${resource.textColor} ${resource.color}`}>
                  {resource.type}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                {resource.title}
              </h3>
            </div>
          </div>
          
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className="text-gray-400 hover:text-red-500 transition-colors duration-200"
          >
            {isFavorited ? (
              <HeartIconSolid className="w-5 h-5 text-red-500" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {resource.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {resource.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className="flex items-center">
            <UserIcon className="w-4 h-4 mr-1" />
            {resource.author}
          </span>
          <span className="flex items-center">
            <ClockIcon className="w-4 h-4 mr-1" />
            {resource.duration}
          </span>
        </div>

        {/* Rating and Downloads */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <StarIconSolid className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">{resource.rating}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
            {resource.downloads.toLocaleString()} downloads
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-emerald-600 transition-colors duration-200">
            Access Resource
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors duration-200">
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}