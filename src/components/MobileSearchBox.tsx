import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  Search as SearchIcon,
  X as XIcon,
  Command as CommandIcon,
  MapPin as MapPinIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Sparkles as SparklesIcon,
  Mic as MicIcon,
  Filter as FilterIcon,
  ChevronUp as ChevronUpIcon,
  ChevronDown as ChevronDownIcon,
  Map as MapIcon,
  List as ListIcon,
  Star as StarIcon,
  Clock as ClockIcon
} from 'lucide-react';
import type { SearchSuggestion, SuggestionGroup } from '@/types/search';
import { getAISuggestions, getTimeOfDay, getCurrentLocation } from '@/utils/getAISuggestions';
import { performFuzzySearch, boostScores } from '@/utils/fuzzySearch';
import { 
  detectServiceCategory, 
  boostCategorySuggestions, 
  generateQuickActions,
  SERVICE_CATEGORIES
} from '@/utils/serviceAutoFocus';

const MobileSearchBox = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SuggestionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<SearchSuggestion[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; city?: string }>();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [drawerHeight, setDrawerHeight] = useState(0.4); // 40% of screen height
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const dragControls = useDragControls();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [summaryText, setSummaryText] = useState('');

  // Generate AI summary when suggestions change
  useEffect(() => {
    if (suggestions.length > 0) {
      const mainGroup = suggestions[0];
      const category = detectServiceCategory(query);
      const location = getCurrentLocation();
      
      let summary = '';
      if (category) {
        const categoryInfo = SERVICE_CATEGORIES[category];
        summary = `Top ${mainGroup.items.length} ${categoryInfo.name} spots`;
      } else {
        summary = `Found ${mainGroup.items.length} results`;
      }

      if (location?.city) {
        summary += ` near ${location.city}`;
      }

      // Add emoji based on category
      if (category) {
        summary += ` ${SERVICE_CATEGORIES[category].icon}`;
      }

      setSummaryText(summary);
    } else {
      setSummaryText('');
    }
  }, [suggestions, query]);

  const handleVoiceInput = async () => {
    try {
      // @ts-ignore - Web Speech API types
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setShowSuggestions(true);
      };

      recognition.start();
    } catch (error) {
      console.error('Speech recognition not supported:', error);
    }
  };

  const handleFilterSelect = (category: string) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    setShowFilters(false);
  };

  // Handle drawer drag
  const handleDragEnd = (event: any, info: any) => {
    const threshold = 0.1;
    const velocity = info.velocity.y;
    const direction = velocity > 0 ? 1 : -1;
    
    if (Math.abs(velocity) > 500) {
      setDrawerHeight(direction > 0 ? 0.4 : 0.8);
    } else {
      const currentHeight = info.point.y / window.innerHeight;
      setDrawerHeight(currentHeight < 0.6 ? 0.4 : 0.8);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Sticky Search Bar */}
      <motion.div 
        className="bg-white border-t border-gray-200 px-4 py-3"
        initial={false}
        animate={{ y: showSuggestions ? -window.innerHeight : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
                setActiveIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search for services, locations..."
              className="w-full px-4 py-3 pl-12 pr-10 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {query && (
              <motion.button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <XIcon className="w-4 h-4" />
              </motion.button>
            )}
          </div>
          <motion.button
            onClick={handleVoiceInput}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MicIcon className="w-5 h-5 text-gray-600" />
          </motion.button>
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FilterIcon className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      </motion.div>

      {/* Results Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            ref={drawerRef}
            className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl z-40"
            initial={{ y: window.innerHeight }}
            animate={{ y: window.innerHeight * (1 - drawerHeight) }}
            exit={{ y: window.innerHeight }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            {/* Drawer Handle */}
            <div 
              className="w-full h-1 bg-gray-200 rounded-t-2xl cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <ChevronUpIcon className="w-6 h-6 mx-auto text-gray-400" />
            </div>

            {/* Drawer Content */}
            <div className="p-4">
              {/* AI Summary Bar */}
              {summaryText && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2"
                >
                  <SparklesIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-blue-700">
                    {summaryText}
                  </span>
                </motion.div>
              )}

              {/* View Toggle */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <button className="p-2 rounded-full bg-blue-500 text-white">
                    <MapIcon className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-full bg-gray-100">
                    <ListIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 rounded-full bg-gray-100">
                    <StarIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 rounded-full bg-gray-100">
                    <ClockIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-4">
                {suggestions.map((group, groupIndex) => (
                  <div key={group.title} className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      {group.icon}
                      {group.title}
                    </h3>
                    <div className="space-y-2">
                      {group.items.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.id}
                          className="p-3 rounded-lg border border-gray-200"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {getIconForType(suggestion.type)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{suggestion.text}</div>
                              {suggestion.metadata && (
                                <div className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                                  {suggestion.metadata.rating && (
                                    <span className="flex items-center gap-1">
                                      <SparklesIcon className="w-3 h-3" />
                                      {suggestion.metadata.rating}
                                    </span>
                                  )}
                                  {suggestion.metadata.distance && (
                                    <span>{suggestion.metadata.distance}</span>
                                  )}
                                  {suggestion.metadata.openNow && (
                                    <span className="text-green-600">Open Now</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen Suggestions Overlay */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            className="fixed inset-0 bg-white z-40 overflow-y-auto"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="pt-16 pb-24">
              {/* Category Filters */}
              {showFilters && (
                <motion.div
                  className="px-4 py-2 border-b border-gray-200"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(SERVICE_CATEGORIES).map(([category, { icon }]) => (
                      <motion.button
                        key={category}
                        onClick={() => handleFilterSelect(category)}
                        className={`px-4 py-2 rounded-full text-sm flex items-center gap-1 ${
                          selectedCategory === category
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>{icon}</span>
                        <span className="capitalize">{category}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Suggestions List */}
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading suggestions...
                </div>
              ) : suggestions.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {suggestions.map((group, groupIndex) => (
                    <div key={group.title} className="py-2">
                      <div className="px-4 py-2 text-sm font-medium text-gray-500 flex items-center gap-2">
                        {group.icon}
                        {group.title}
                      </div>
                      {group.items.map((suggestion, index) => (
                        <motion.div
                          key={suggestion.id}
                          className={`px-4 py-3 cursor-pointer flex items-center gap-2 ${
                            activeIndex === groupIndex * 100 + index ? 'bg-gray-100' : ''
                          }`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          whileHover={{ backgroundColor: 'rgba(243, 244, 246, 1)' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {getIconForType(suggestion.type)}
                          <div className="flex-1">
                            <div 
                              className="font-medium"
                              dangerouslySetInnerHTML={{ __html: suggestion.text }}
                            />
                            {suggestion.metadata && (
                              <div className="text-sm text-gray-500">
                                {suggestion.metadata.rating && (
                                  <span className="flex items-center gap-1">
                                    <SparklesIcon className="w-3 h-3" />
                                    {suggestion.metadata.rating}
                                  </span>
                                )}
                                {suggestion.metadata.distance && (
                                  <span>{suggestion.metadata.distance}</span>
                                )}
                                {suggestion.metadata.openNow && (
                                  <span className="text-green-600">Open Now</span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No suggestions found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileSearchBox; 