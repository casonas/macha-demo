import React, { useMemo, useState, useCallback, useRef } from 'react';
import { Question } from '../../../types/assessment';
import { useAssessment, useAssessmentResponse } from '../../../hooks/useAssessment';
import { QuestionCard } from '../../molecules/QuestionCard';
import { Button } from '../../atoms/Button';
import { Card } from '../../atoms/Card';
import './AssessmentForm.css';

interface AssessmentFormProps {
assessmentId: string;
buildingId: string;
onSubmit?: (responses: Record<string, any>, photos: Record<string, { name: string; dataUrl: string }[]>) => void;
onSave?: (responses: Record<string, any>) => void;
initialData?: Record<string, any>;
}

type GroupedQuestions = Record<string, Question[]>;

export const AssessmentForm = ({
assessmentId,
onSubmit,
onSave,
initialData
}: AssessmentFormProps): JSX.Element => {
const { assessment, loading, error } = useAssessment(assessmentId);
const { responses, updateResponse, updateComment, getResponse, getComment, getPhotos, updatePhotos, photos } =
useAssessmentResponse(initialData);

const [activeCategory, setActiveCategory] = useState<number>(0);
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [query, setQuery] = useState('');
const [activeQuery, setActiveQuery] = useState('');
const [selectedSubsection, setSelectedSubsection] = useState('All');
const chipsRef = useRef<HTMLDivElement | null>(null);
const searchInputRef = useRef<HTMLInputElement | null>(null);

const handleNext = useCallback(() => {
if (!assessment) return;
if (activeCategory < assessment.categories.length - 1) {
setActiveCategory((prev) => prev + 1);
setSelectedSubsection('All');
setValidationErrors({});
window.scrollTo({ top: 0, behavior: 'smooth' });
}
}, [assessment, activeCategory]);

const handlePrevious = useCallback(() => {
if (activeCategory > 0) {
setActiveCategory((prev) => prev - 1);
setSelectedSubsection('All');
setValidationErrors({});
window.scrollTo({ top: 0, behavior: 'smooth' });
}
}, [activeCategory]);

const handleSave = useCallback(() => {
onSave?.(responses);
}, [onSave, responses]);

const handleSubmit = useCallback(async () => {
if (!assessment) return;

const answeredAny = Object.values(responses).some(v => v !== '' && v !== null && v !== undefined);
if (!answeredAny) {
setValidationErrors({ __formError: 'Please answer at least one question before submitting.' });
return;
}

setIsSubmitting(true);
try {
await onSubmit?.(responses, photos);
} finally {
setIsSubmitting(false);
}
}, [assessment, onSubmit, responses, photos]);

const categoryProgress = useMemo(() => {
if (!assessment) return [];

return assessment.categories.map((c, idx) => {
const total = c.questions.length;
const answered = c.questions.filter((q) => {
const value = getResponse(q.id);
return value !== undefined && value !== null && value !== '';
}).length;

return {
idx,
id: c.id,
title: c.title,
total,
answered,
percent: total ? Math.round((answered / total) * 100) : 0
};
});
}, [assessment, getResponse]);

if (loading) {
return (
<div className="assessment-form assessment-form--loading">
<div className="assessment-form__spinner" />
<p>Loading assessment...</p>
</div>
);
}

if (error || !assessment) {
return (
<div className="assessment-form assessment-form--error">
<h3>Error Loading Assessment</h3>
<p>{error || 'Assessment not found'}</p>
<Button onClick={() => window.location.reload()}>Retry</Button>
</div>
);
}

const currentCategory = assessment.categories[activeCategory];
if (!currentCategory) return <></>;

const isSearching = activeQuery.trim().length > 0;

const questionMatchesSearch = (q: Question): boolean => {
if (!activeQuery.trim()) return true;
const needle = activeQuery.toLowerCase();
return q.text.toLowerCase().includes(needle) || q.id.toLowerCase().includes(needle);
};

// When searching, gather results from ALL categories; otherwise use the current one
const categoriesToShow = isSearching ? assessment.categories : [currentCategory];

const allVisibleGroups: { categoryTitle: string; name: string; questions: Question[] }[] = [];
categoriesToShow.forEach((cat) => {
const grouped: GroupedQuestions = cat.questions.reduce((acc, q) => {
  const name = q.helpText?.replace('Section: ', '').trim() || 'General';
  if (!acc[name]) acc[name] = [];
  acc[name].push(q);
  return acc;
}, {} as GroupedQuestions);

const names = Object.keys(grouped);
names
  .filter((name) => isSearching || selectedSubsection === 'All' || name === selectedSubsection)
  .forEach((name) => {
    const questions = grouped[name].filter(questionMatchesSearch);
    if (questions.length > 0) {
      allVisibleGroups.push({ categoryTitle: cat.title, name, questions });
    }
  });
});

// Subsection names for chips (only from current category when not searching)
const groupedQuestions: GroupedQuestions = currentCategory.questions.reduce((acc, q) => {
const name = q.helpText?.replace('Section: ', '').trim() || 'General';
if (!acc[name]) acc[name] = [];
acc[name].push(q);
return acc;
}, {} as GroupedQuestions);
const subsectionNames = Object.keys(groupedQuestions);

const handleSearch = () => {
setActiveQuery(query);
};

const clearSearch = () => {
setQuery('');
setActiveQuery('');
searchInputRef.current?.focus();
};

const totalQuestions = assessment.categories.reduce((sum, c) => sum + c.questions.length, 0);
const answeredCount = assessment.categories
.flatMap((c) => c.questions)
.filter((q) => {
const value = getResponse(q.id);
return value !== undefined && value !== null && value !== '';
}).length;
const progress = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;

const incompleteSections = categoryProgress.filter((s) => s.percent < 100);

const scrollChips = (left: number) => {
chipsRef.current?.scrollBy({ left, behavior: 'smooth' });
};
return (
<div className="assessment-form-layout">
<aside className="assessment-sidebar">
<Card padding="md" className="assessment-sidebar__card">
<h3>Report Progress</h3>

<div className="progress-bar">
<div className="progress-bar__fill" style={{ width: `${progress}%` }} />
</div>
<p className="progress-bar__text">
{answeredCount}/{totalQuestions} answered ({progress}%)
</p>

<div className="sidebar-section">
<h4>Sections</h4>
<div className="section-list">
{categoryProgress.map((s) => (
<button
key={s.id}
className={`section-item ${s.idx === activeCategory ? 'section-item--active' : ''}`}
onClick={() => {
setActiveCategory(s.idx);
setSelectedSubsection('All');
window.scrollTo({ top: 0, behavior: 'smooth' });
}}
>
<span className="dot" />
<span>{s.idx + 1}. {s.title}</span>
<span className="pill">{s.percent}%</span>
</button>
))}
</div>
</div>

<div className="sidebar-section">
<h4>Sections Incomplete</h4>
<ul className="missing-list">
{incompleteSections.slice(0, 8).map((s) => (
<li key={s.id}>
<button
onClick={() => {
setActiveCategory(s.idx);
setSelectedSubsection('All');
window.scrollTo({ top: 0, behavior: 'smooth' });
}}
>
{s.title}: {s.answered}/{s.total} answered ({s.percent}%)
</button>
</li>
))}
{incompleteSections.length === 0 && <li>All sections complete 🎉</li>}
</ul>
</div>
</Card>
</aside>

<div className="assessment-form">
<Card className="assessment-form__header" padding="lg">
<h1 className="assessment-form__title">Security Assessment</h1>
<p className="assessment-form__description">{assessment.metadata.description}</p>

<div className="assessment-toolbar">
<label className="toolbar-field">
<span>Jump to section</span>
<select
value={activeCategory}
onChange={(e) => {
setActiveCategory(Number(e.target.value));
setSelectedSubsection('All');
window.scrollTo({ top: 0, behavior: 'smooth' });
}}
>
{assessment.categories.map((c, i) => (
<option key={c.id} value={i}>
{i + 1}. {c.title}
</option>
))}
</select>
</label>

<label className="toolbar-field toolbar-field--grow">
<span>Search questions</span>
<div className="toolbar-search">
<input
ref={searchInputRef}
value={query}
onChange={(e) => setQuery(e.target.value)}
onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
placeholder="Type keyword (ex: keypad, backup, camera)"
/>
{activeQuery && (
<button type="button" className="toolbar-search__clear" onClick={clearSearch} aria-label="Clear search">
✕
</button>
)}
<button type="button" className="toolbar-search__btn" onClick={handleSearch}>
<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
Search
</button>
</div>
</label>
</div>

{subsectionNames.length > 0 && (
<div className="subsection-nav">
<button type="button" className="subsection-nav__arrow" onClick={() => scrollChips(-220)}>
‹
</button>

<div className="subsection-chips" aria-label="Subsections" ref={chipsRef}>
<button
type="button"
className={`chip ${selectedSubsection === 'All' ? 'chip--active' : ''}`}
onClick={(e) => {
setSelectedSubsection('All');
e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}}
>
All
</button>

{subsectionNames.map((name) => (
<button
key={name}
type="button"
className={`chip ${selectedSubsection === name ? 'chip--active' : ''}`}
onClick={(e) => {
setSelectedSubsection(name);
e.currentTarget.scrollIntoView({
behavior: 'smooth',
inline: 'center',
block: 'nearest'
});
}}
>
{name}
</button>
))}
</div>

<button type="button" className="subsection-nav__arrow" onClick={() => scrollChips(220)}>
›
</button>
</div>
)}
</Card>

<Card className="assessment-form__category" padding="lg">
<div className="category__header">
<h2 className="category__title">{isSearching ? `Search results for "${activeQuery}"` : currentCategory.title}</h2>
{!isSearching && currentCategory.description && (
<p className="category__description">{currentCategory.description}</p>
)}
{isSearching && (
<p className="category__description">
{allVisibleGroups.reduce((sum, g) => sum + g.questions.length, 0)} matching questions across all sections
</p>
)}
</div>

<div className="category__questions">
{allVisibleGroups.length === 0 && <p>No questions match your filters{isSearching ? ' across any section' : ' in this section'}.</p>}

{allVisibleGroups.map((group, groupIdx) => (
<section key={`${group.categoryTitle}-${group.name}-${groupIdx}`} className="subsection-group">
<div className="subsection-group__header">
<h3>{isSearching ? `${group.categoryTitle} › ${group.name}` : group.name}</h3>
<span>{group.questions.length} questions</span>
</div>

<div className="subsection-group__body">
{group.questions.map((question: Question) => (
<div key={question.id} id={`q-${question.id}`}>
<QuestionCard
question={question}
value={getResponse(question.id)}
comment={getComment(question.id)}
onChange={(value) => updateResponse(question.id, value)}
onCommentChange={(comment) => updateComment(question.id, comment)}
error={validationErrors[question.id]}
searchQuery={activeQuery}
photos={getPhotos(question.id)}
onPhotosChange={(p) => updatePhotos(question.id, p)}
/>
</div>
))}
</div>
</section>
))}
</div>
</Card>

<div className="assessment-form__actions">
<Button variant="secondary" onClick={handlePrevious} disabled={activeCategory === 0}>
Previous
</Button>

<div className="assessment-form__actions-center">
<Button variant="ghost" onClick={handleSave}>
Save Progress
</Button>
</div>

{activeCategory < assessment.categories.length - 1 ? (
<Button onClick={handleNext}>Next Category</Button>
) : (
<Button onClick={handleSubmit} loading={isSubmitting}>
Submit Assessment
</Button>
)}
</div>
</div>
</div>
);
};

export default AssessmentForm;