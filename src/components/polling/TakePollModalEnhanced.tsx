/**
 * =============================================================================
 * TAKE POLL MODAL - ENHANCED WITH SECTIONS & SUCCESS MESSAGE
 * =============================================================================
 * 
 * New features:
 * - Header photo support
 * - Section-based navigation with progress tracking
 * - Customizable success message
 * - Next/Submit buttons per section
 * - Fully responsive (mobile & desktop)
 * 
 * =============================================================================
 */

import { useState, useEffect } from "react";
import { 
  X, CheckCircle, ChevronLeft, ChevronRight, Star, Check,
  Upload, Calendar as CalendarIcon, Clock as ClockIcon
} from "lucide-react";
import { toast } from "sonner";
import { DESIGN_TOKENS } from "../design-system";
import type { Poll, Question, PollSection } from "./types";
import CustomDropdown from "../CustomDropdown";

interface TakePollModalProps {
  poll: Poll;
  isDark: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function TakePollModalEnhanced({ poll, isDark, isLoggedIn, onClose, onSubmit }: TakePollModalProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [startTime] = useState(Date.now());
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Timer state (if poll has timer)
  const [timeRemaining, setTimeRemaining] = useState(
    poll.timerMinutes ? poll.timerMinutes * 60 : undefined
  );

  // Get sections or create single section from questions
  const sections: PollSection[] = poll.useSections && poll.sections && poll.sections.length > 0
    ? poll.sections
    : [{
        id: "default",
        title: poll.title,
        description: poll.description,
        questions: poll.questions
      }];

  const currentSection = sections[currentSectionIndex];
  const isLastSection = currentSectionIndex === sections.length - 1;
  const isFirstSection = currentSectionIndex === 0;

  // Calculate progress
  const totalQuestions = sections.reduce((acc, section) => acc + section.questions.length, 0);
  const answeredCount = Object.keys(answers).length;
  const overallProgress = (answeredCount / totalQuestions) * 100;

  // Calculate section progress
  const sectionAnsweredCount = currentSection.questions.filter(q => answers[q.id] !== undefined).length;
  const sectionProgress = (sectionAnsweredCount / currentSection.questions.length) * 100;

  // Timer effect
  useEffect(() => {
    if (timeRemaining === undefined) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === undefined || prev <= 0) {
          clearInterval(timer);
          toast.error("Time's up!");
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleNext = () => {
    // Validate required questions in current section
    const unansweredRequired = currentSection.questions.filter(
      (q) => q.required && !answers[q.id]
    );

    if (unansweredRequired.length > 0) {
      toast.error(`Please answer all required questions (${unansweredRequired.length} remaining in this section)`);
      return;
    }

    if (!isLastSection) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      // Scroll to top of modal
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (!isFirstSection) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = () => {
    // Validate all required questions across all sections
    const allQuestions = sections.flatMap(section => section.questions);
    const unansweredRequired = allQuestions.filter(
      (q) => q.required && !answers[q.id]
    );

    if (unansweredRequired.length > 0) {
      toast.error(`Please answer all required questions (${unansweredRequired.length} remaining)`);
      return;
    }

    // Calculate completion time
    const completionTime = Math.floor((Date.now() - startTime) / 1000);
    
    // Show success message
    setShowSuccess(true);
    
    // Call onSubmit after a delay
    setTimeout(() => {
      onSubmit();
    }, 3000);
  };

  // Success message screen
  if (showSuccess) {
    return (
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="rounded-xl max-w-2xl w-full border p-8 md:p-12 text-center"
          style={{
            background: poll.theme.backgroundColor,
            backdropFilter: "blur(20px)",
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div
              className="rounded-full p-4 inline-flex"
              style={{
                background: `linear-gradient(to right, ${poll.theme.primaryColor}, ${poll.theme.accentColor})`,
              }}
            >
              <Check className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Success Message */}
          <h2
            className="mb-4"
            style={{
              fontFamily: poll.theme.headingFont,
              fontSize: `${DESIGN_TOKENS.typography.fontSize.h1}px`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.bold,
              color: poll.theme.primaryColor,
            }}
          >
            {poll.showSuccessMessage && poll.successMessage 
              ? poll.successMessage.split('\n')[0] || "Response Submitted!"
              : "Response Submitted!"
            }
          </h2>

          {poll.showSuccessMessage && poll.successMessage && poll.successMessage.includes('\n') && (
            <p
              className="mb-8"
              style={{
                fontFamily: poll.theme.bodyFont,
                color: poll.theme.textColor,
                opacity: 0.8,
              }}
            >
              {poll.successMessage.split('\n').slice(1).join('\n')}
            </p>
          )}

          {!poll.showSuccessMessage && (
            <p
              className="mb-8"
              style={{
                fontFamily: poll.theme.bodyFont,
                color: poll.theme.textColor,
                opacity: 0.8,
              }}
            >
              Thank you for your response! Your feedback has been recorded successfully.
            </p>
          )}

          <button
            onClick={onClose}
            className="px-8 py-3 rounded-lg text-white hover:shadow-lg transition-all"
            style={{
              background: `linear-gradient(to right, ${poll.theme.primaryColor}, ${poll.theme.accentColor})`,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="rounded-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border my-4 sm:my-8"
        style={{
          background: poll.theme.backgroundColor,
          backdropFilter: "blur(20px)",
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Photo */}
        {poll.theme.headerImage && (
          <div className="relative w-full h-32 sm:h-48 md:h-64 overflow-hidden rounded-t-xl">
            <img
              src={poll.theme.headerImage}
              alt="Poll header"
              className="w-full h-full object-cover"
            />
            {poll.theme.headerOverlay && poll.theme.headerOverlay !== "none" && (
              <div
                className="absolute inset-0"
                style={{
                  background: poll.theme.headerOverlay === "dark" 
                    ? "rgba(0, 0, 0, 0.5)" 
                    : "rgba(255, 255, 255, 0.5)",
                }}
              />
            )}
          </div>
        )}

        {/* Sticky Header */}
        <div 
          className="sticky top-0 z-10 p-4 sm:p-6 border-b" 
          style={{
            background: poll.theme.backgroundColor,
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-4">
              <h3
                className="mb-2"
                style={{
                  fontFamily: poll.theme.headingFont,
                  fontSize: window.innerWidth < 640 ? `${DESIGN_TOKENS.typography.fontSize.h3}px` : `${DESIGN_TOKENS.typography.fontSize.h2}px`,
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                  color: poll.theme.primaryColor,
                }}
              >
                {poll.useSections ? currentSection.title : poll.title}
              </h3>
              {(poll.useSections ? currentSection.description : poll.description) && (
                <p 
                  className="text-sm"
                  style={{ 
                    color: poll.theme.textColor, 
                    opacity: 0.8,
                    fontFamily: poll.theme.bodyFont,
                  }}
                >
                  {poll.useSections ? currentSection.description : poll.description}
                </p>
              )}
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: poll.theme.textColor }} />
            </button>
          </div>

          {/* Section Indicator */}
          {poll.useSections && sections.length > 1 && (
            <div className="mb-4 flex items-center gap-2 text-xs sm:text-sm" style={{ color: poll.theme.textColor, opacity: 0.7 }}>
              <span>Section {currentSectionIndex + 1} of {sections.length}</span>
            </div>
          )}

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: poll.theme.textColor }}>
              <span className="hidden sm:inline">
                {poll.useSections 
                  ? `${sectionAnsweredCount} of ${currentSection.questions.length} answered in this section`
                  : `${answeredCount} of {totalQuestions} answered`
                }
              </span>
              <span className="sm:hidden">
                {poll.useSections 
                  ? `${sectionAnsweredCount}/${currentSection.questions.length}`
                  : `${answeredCount}/${totalQuestions}`
                }
              </span>
              <span>{Math.round(poll.useSections ? sectionProgress : overallProgress)}%</span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${poll.useSections ? sectionProgress : overallProgress}%`,
                  background: `linear-gradient(to right, ${poll.theme.primaryColor}, ${poll.theme.accentColor})`,
                }}
              />
            </div>
          </div>

          {/* Timer */}
          {timeRemaining !== undefined && (
            <div className="mt-3 flex items-center gap-2 text-sm" style={{ color: poll.theme.primaryColor }}>
              <ClockIcon className="w-4 h-4" />
              <span style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold }}>
                Time Remaining: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {currentSection.questions.map((question, index) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              index={index}
              value={answers[question.id]}
              onChange={(value) => handleAnswerChange(question.id, value)}
              theme={poll.theme}
              isDark={isDark}
            />
          ))}
        </div>

        {/* Footer Navigation */}
        <div 
          className="sticky bottom-0 p-4 sm:p-6 border-t flex flex-col sm:flex-row justify-between gap-3"
          style={{
            background: poll.theme.backgroundColor,
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          }}
        >
          <button
            onClick={handlePrevious}
            disabled={isFirstSection}
            className={`px-4 sm:px-6 py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
              isFirstSection ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{
              background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
              color: poll.theme.textColor,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
            }}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-3 rounded-lg transition-all flex-1 sm:flex-none"
              style={{
                background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                color: poll.theme.textColor,
                fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              }}
            >
              Cancel
            </button>
            
            {!isLastSection ? (
              <button
                onClick={handleNext}
                className="px-4 sm:px-6 py-3 rounded-lg text-white hover:shadow-lg transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
                style={{
                  background: `linear-gradient(to right, ${poll.theme.primaryColor}, ${poll.theme.accentColor})`,
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                }}
              >
                <span>Next</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-4 sm:px-6 py-3 rounded-lg text-white hover:shadow-lg transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
                style={{
                  background: `linear-gradient(to right, ${poll.theme.primaryColor}, ${poll.theme.accentColor})`,
                  fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                }}
              >
                <CheckCircle className="w-5 h-5" />
                <span>Submit Response</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Question Renderer Component
interface QuestionRendererProps {
  question: Question;
  index: number;
  value: any;
  onChange: (value: any) => void;
  theme: any;
  isDark: boolean;
}

function QuestionRenderer({ question, index, value, onChange, theme, isDark }: QuestionRendererProps) {
  const renderQuestionInput = () => {
    switch (question.type) {
      case "short-answer":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your answer..."
            className="w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none"
            style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }}
          />
        );

      case "paragraph":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your answer..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] focus:ring-2 focus:ring-[#f6421f]/20 transition-all outline-none resize-none"
            style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }}
          />
        );

      case "multiple-choice":
        return (
          <div className="space-y-2">
            {question.options?.map((option, optIndex) => (
              <label
                key={optIndex}
                className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-[#f6421f]"
                style={{
                  borderColor: value === option ? theme.primaryColor : (isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"),
                  background: value === option ? (isDark ? "rgba(246, 66, 31, 0.1)" : "rgba(246, 66, 31, 0.05)") : "transparent",
                }}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={value === option}
                  onChange={() => onChange(option)}
                  className="mt-1"
                />
                <span className="flex-1 text-sm sm:text-base">{option}</span>
              </label>
            ))}
            {question.allowOther && (
              <input
                type="text"
                value={value?.startsWith?.("Other: ") ? value.substring(7) : ""}
                onChange={(e) => onChange(`Other: ${e.target.value}`)}
                placeholder="Other..."
                className="w-full px-4 py-2 rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] transition-all outline-none text-sm"
                style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }}
              />
            )}
          </div>
        );

      case "checkbox":
        const selectedOptions = value || [];
        return (
          <div className="space-y-2">
            {question.options?.map((option, optIndex) => (
              <label
                key={optIndex}
                className="flex items-start gap-3 p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-[#f6421f]"
                style={{
                  borderColor: selectedOptions.includes(option) ? theme.primaryColor : (isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"),
                  background: selectedOptions.includes(option) ? (isDark ? "rgba(246, 66, 31, 0.1)" : "rgba(246, 66, 31, 0.05)") : "transparent",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedOptions, option]);
                    } else {
                      onChange(selectedOptions.filter((o: string) => o !== option));
                    }
                  }}
                  className="mt-1"
                />
                <span className="flex-1 text-sm sm:text-base">{option}</span>
              </label>
            ))}
          </div>
        );

      case "dropdown":
        return (
          <CustomDropdown
            value={value || ""}
            onChange={onChange}
            options={(question.options || []).map(opt => ({ value: opt, label: opt }))}
            isDark={isDark}
            size="md"
            placeholder="Select an option..."
          />
        );

      case "linear-scale":
        const scaleMin = question.scaleMin || 1;
        const scaleMax = question.scaleMax || 5;
        const scaleOptions = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i);
        
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {scaleOptions.map((num) => (
                <button
                  key={num}
                  onClick={() => onChange(num)}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border-2 transition-all text-sm sm:text-base"
                  style={{
                    borderColor: value === num ? theme.primaryColor : (isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"),
                    background: value === num ? `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})` : "transparent",
                    color: value === num ? "white" : theme.textColor,
                    fontWeight: value === num ? DESIGN_TOKENS.typography.fontWeight.semibold : DESIGN_TOKENS.typography.fontWeight.normal,
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs sm:text-sm" style={{ color: theme.textColor, opacity: 0.7 }}>
              <span>{question.scaleMinLabel || scaleMin}</span>
              <span>{question.scaleMaxLabel || scaleMax}</span>
            </div>
          </div>
        );

      case "star-rating":
        const maxStars = question.scaleMax || 5;
        return (
          <div className="flex gap-2">
            {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
              <button
                key={star}
                onClick={() => onChange(star)}
                className="transition-all hover:scale-110"
              >
                <Star
                  className="w-6 h-6 sm:w-8 sm:h-8"
                  fill={value >= star ? theme.accentColor : "none"}
                  stroke={value >= star ? theme.accentColor : (isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)")}
                />
              </button>
            ))}
          </div>
        );

      case "yes-no":
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            {["Yes", "No"].map((option) => (
              <button
                key={option}
                onClick={() => onChange(option)}
                className="flex-1 px-4 sm:px-6 py-3 rounded-lg border-2 transition-all text-sm sm:text-base"
                style={{
                  borderColor: value === option ? theme.primaryColor : (isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"),
                  background: value === option ? (isDark ? "rgba(246, 66, 31, 0.1)" : "rgba(246, 66, 31, 0.05)") : "transparent",
                  color: theme.textColor,
                  fontWeight: value === option ? DESIGN_TOKENS.typography.fontWeight.semibold : DESIGN_TOKENS.typography.fontWeight.normal,
                }}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case "date":
        return (
          <input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] transition-all outline-none"
            style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }}
          />
        );

      case "time":
        return (
          <input
            type="time"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-[#f6421f] transition-all outline-none"
            style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }}
          />
        );

      case "file-upload":
        const acceptedTypes = question.acceptedFileTypes || "image/*";
        const maxSize = question.maxFileSize || 10;
        const getFileTypeLabel = (types: string) => {
          if (types === "image/*") return "Images (JPG, PNG, GIF, WebP)";
          if (types === "application/pdf") return "PDF";
          if (types.includes("pdf") && types.includes("doc")) return "Documents (PDF, DOC, DOCX)";
          if (types.includes("excel") || types.includes("xlsx")) return "Spreadsheets (XLS, XLSX, CSV)";
          if (types.includes("powerpoint") || types.includes("pptx")) return "Presentations (PPT, PPTX)";
          if (types === "video/*") return "Videos";
          if (types === "*") return "All Files";
          return "Files";
        };
        
        return (
          <div className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center" style={{ borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)" }}>
            <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3" style={{ color: theme.primaryColor }} />
            <p className="text-sm mb-2" style={{ color: theme.textColor }}>Click to upload or drag and drop</p>
            <p className="text-xs mb-4 opacity-70" style={{ color: theme.textColor }}>
              {getFileTypeLabel(acceptedTypes)} (Max {maxSize}MB)
            </p>
            <input
              type="file"
              accept={acceptedTypes}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Validate file size
                  if (file.size > maxSize * 1024 * 1024) {
                    toast.error(`File size must be less than ${maxSize}MB`);
                    e.target.value = "";
                    return;
                  }
                  onChange(file.name);
                }
              }}
              className="hidden"
              id={`file-${question.id}`}
            />
            <label
              htmlFor={`file-${question.id}`}
              className="inline-block px-4 py-2 rounded-lg text-white cursor-pointer text-sm"
              style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})` }}
            >
              Choose File
            </label>
            {value && <p className="mt-2 text-sm" style={{ color: theme.textColor }}>Selected: {value}</p>}
          </div>
        );

      default:
        return <p className="text-sm opacity-50">Question type not supported</p>;
    }
  };

  return (
    <div
      className="rounded-lg p-4 sm:p-6 border"
      style={{
        background: isDark ? "rgba(30, 41, 59, 0.5)" : "rgba(255, 255, 255, 0.5)",
        borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="mb-4">
        <div className="flex items-start gap-2 mb-2">
          <span
            className="text-sm sm:text-base"
            style={{
              fontFamily: theme.subheadingFont,
              fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
              color: theme.textColor,
            }}
          >
            {index + 1}. {question.title}
          </span>
          {question.required && (
            <span style={{ color: theme.primaryColor }}>*</span>
          )}
        </div>
        {question.description && (
          <p 
            className="text-xs sm:text-sm" 
            style={{ 
              color: theme.textColor, 
              opacity: 0.7,
              fontFamily: theme.bodyFont,
            }}
          >
            {question.description}
          </p>
        )}
        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt="Question"
            className="mt-3 rounded-lg max-w-full h-auto max-h-48 sm:max-h-64"
          />
        )}
      </div>
      {renderQuestionInput()}
    </div>
  );
}
