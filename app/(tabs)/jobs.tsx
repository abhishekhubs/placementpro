import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────
interface MCQQuestion {
    id: number;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

interface GapItem {
    skill: string;
    level: 'missing' | 'weak' | 'good';
    tips: string;
}

type Phase = 'intro' | 'skill_input' | 'loading' | 'quiz' | 'results';
type ActiveTab = 'mock' | 'gap';

// ─── Common Skills ────────────────────────────────────────────────────────────
const COMMON_SKILLS = ['JavaScript', 'Python', 'React', 'Data Structures', 'SQL', 'Java', 'Networking', 'OS', 'DBMS', 'Machine Learning'];

// ─── Animated Bar (for Results chart) ────────────────────────────────────────
function AnimatedBar({ value, maxValue, color, label }: { value: number; maxValue: number; color: string; label: string }) {
    const barWidth = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        const target = maxValue === 0 ? 0 : (value / maxValue) * (SCREEN_WIDTH - 100);
        Animated.timing(barWidth, { toValue: target, duration: 800, useNativeDriver: false }).start();
    }, [value, maxValue]);
    return (
        <View style={barS.row}>
            <Text style={barS.label}>{label}</Text>
            <View style={barS.track}>
                <Animated.View style={[barS.fill, { width: barWidth, backgroundColor: color }]} />
            </View>
            <Text style={barS.value}>{value}</Text>
        </View>
    );
}
const barS = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    label: { width: 70, color: '#94A3B8', fontSize: 12, fontWeight: '600' },
    track: { flex: 1, height: 22, backgroundColor: '#1E293B', borderRadius: 11, overflow: 'hidden', marginHorizontal: 8 },
    fill: { height: '100%', borderRadius: 11 },
    value: { width: 28, color: '#FFFFFF', fontWeight: '700', textAlign: 'right', fontSize: 14 },
});

// ─── Skill Gap Indicator ─────────────────────────────────────────────────────
function SkillGapTab() {
    const [roleInput, setRoleInput] = useState('');
    const [currentSkillsInput, setCurrentSkillsInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [gaps, setGaps] = useState<GapItem[] | null>(null);
    const [error, setError] = useState('');

    const levelColor = (level: GapItem['level']) =>
        level === 'good' ? '#10B981' : level === 'weak' ? '#F59E0B' : '#EF4444';
    const levelLabel = (level: GapItem['level']) =>
        level === 'good' ? '✅ On Track' : level === 'weak' ? '⚠️ Needs Work' : '❌ Missing';

    const analyzeGap = async () => {
        if (!roleInput.trim()) { setError('Please enter a target role.'); return; }
        if (!currentSkillsInput.trim()) { setError('Please list your current skills.'); return; }
        setError('');
        setGaps(null);
        setLoading(true);

        try {
            const groqApiKey = (process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '');
            const systemPrompt = `You are a career advisor AI. Analyze skill gaps between a student's current skills and the requirements for a target job role. Respond ONLY with a valid JSON array. No extra text.`;
            const prompt = `Target Role: ${roleInput.trim()}
Current Skills: ${currentSkillsInput.trim()}

Return a JSON array analyzing the skill gap. Format:
[
  {
    "skill": "Skill name",
    "level": "missing" | "weak" | "good",
    "tips": "1-2 sentence actionable tip to improve or leverage this skill."
  }
]

Rules:
- Include 6-10 skills relevant to the target role.
- "missing" means they don't have it, "weak" means they mentioned it but need improvement, "good" means they're on track.
- Derive which skills are required for the role from industry standards.
- Return ONLY the JSON array, no markdown or extra text.`;

            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt },
                    ],
                    max_tokens: 1500,
                    temperature: 0.4,
                }),
            });
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            const raw = data.choices?.[0]?.message?.content ?? '';
            const match = raw.match(/\[[\s\S]*\]/);
            if (!match) throw new Error('Invalid AI response');
            setGaps(JSON.parse(match[0]));
        } catch (e: any) {
            setError('Could not analyze skills. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const goodCount = gaps?.filter(g => g.level === 'good').length ?? 0;
    const weakCount = gaps?.filter(g => g.level === 'weak').length ?? 0;
    const missingCount = gaps?.filter(g => g.level === 'missing').length ?? 0;

    return (
        <ScrollView contentContainerStyle={s.scrollPad} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={s.gapHeader}>
                <Ionicons name="analytics-outline" size={28} color="#F59E0B" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.gapTitle}>Skill Gap Indicator</Text>
                    <Text style={s.gapSub}>Enter your target role and current skills to see where you stand.</Text>
                </View>
            </View>

            {/* Inputs */}
            <Text style={s.sectionTitle}>Target Job Role</Text>
            <TextInput
                style={[s.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="e.g. Software Engineer at Google, Data Analyst, DevOps"
                placeholderTextColor="#475569"
                value={roleInput}
                onChangeText={setRoleInput}
                selectionColor="#F59E0B"
            />

            <Text style={s.sectionTitle}>Your Current Skills</Text>
            <TextInput
                style={[s.input, { height: 100, textAlignVertical: 'top', paddingTop: 12 },
                Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="e.g. Python, basic SQL, some React, college projects..."
                placeholderTextColor="#475569"
                value={currentSkillsInput}
                onChangeText={setCurrentSkillsInput}
                selectionColor="#F59E0B"
                multiline
            />

            {error ? <Text style={s.errorText}>{error}</Text> : null}

            <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#D97706' }]} onPress={analyzeGap} disabled={loading}>
                {loading
                    ? <ActivityIndicator color="#FFFFFF" />
                    : <>
                        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                        <Text style={s.primaryBtnText}>Analyze My Skill Gap</Text>
                    </>
                }
            </TouchableOpacity>

            {/* Results */}
            {gaps && (
                <>
                    {/* Summary chart */}
                    <View style={[s.chartCard, { marginTop: 24 }]}>
                        <Text style={s.chartTitle}>📊 Gap Overview</Text>
                        <AnimatedBar value={goodCount} maxValue={gaps.length} color="#10B981" label="On Track" />
                        <AnimatedBar value={weakCount} maxValue={gaps.length} color="#F59E0B" label="Needs Work" />
                        <AnimatedBar value={missingCount} maxValue={gaps.length} color="#EF4444" label="Missing" />
                    </View>

                    {/* Detailed cards */}
                    <Text style={[s.sectionTitle, { marginTop: 8 }]}>Skill-by-Skill Breakdown</Text>
                    {gaps.map((item, i) => (
                        <View key={i} style={[s.reviewCard, { borderLeftWidth: 4, borderLeftColor: levelColor(item.level) }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <Text style={{ color: '#E2E8F0', fontWeight: '700', fontSize: 15 }}>{item.skill}</Text>
                                <View style={[s.levelBadge, { backgroundColor: levelColor(item.level) + '22' }]}>
                                    <Text style={[s.levelBadgeText, { color: levelColor(item.level) }]}>{levelLabel(item.level)}</Text>
                                </View>
                            </View>
                            <Text style={{ color: '#94A3B8', fontSize: 13, lineHeight: 20 }}>{item.tips}</Text>
                        </View>
                    ))}

                    <TouchableOpacity style={[s.primaryBtn, { backgroundColor: '#D97706', marginTop: 8 }]} onPress={() => { setGaps(null); setRoleInput(''); setCurrentSkillsInput(''); }}>
                        <Ionicons name="refresh" size={18} color="#FFFFFF" />
                        <Text style={s.primaryBtnText}>Analyze Another Role</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
}

// ─── Mock Test Tab ────────────────────────────────────────────────────────────
function MockTestTab() {
    const [phase, setPhase] = useState<Phase>('intro');
    const [skillInput, setSkillInput] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [questionCount, setQuestionCount] = useState(5);
    const [questions, setQuestions] = useState<MCQQuestion[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [revealed, setRevealed] = useState(false);
    const [error, setError] = useState('');

    const correct = answers.filter((a, i) => questions[i] && a === questions[i].correctIndex).length;
    const incorrect = answers.filter((a, i) => questions[i] && a !== null && a !== questions[i].correctIndex).length;
    const skipped = questions.length - correct - incorrect;
    const percentage = questions.length ? Math.round((correct / questions.length) * 100) : 0;

    const addSkill = (sk: string) => {
        const t = sk.trim();
        if (!t || selectedSkills.includes(t)) { setSkillInput(''); return; }
        setSelectedSkills(p => [...p, t]);
        setSkillInput('');
    };
    const removeSkill = (sk: string) => setSelectedSkills(p => p.filter(x => x !== sk));

    const startTest = async () => {
        if (!selectedSkills.length) { setError('Please add at least one skill.'); return; }
        setError(''); setPhase('loading');
        try {
            const res = await fetch('/api/mock-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate', skills: selectedSkills, numberOfQuestions: questionCount }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setQuestions(data.questions ?? []);
            setAnswers(new Array(data.questions.length).fill(null));
            setCurrentQ(0); setRevealed(false); setPhase('quiz');
        } catch {
            setError('Failed to generate questions. Please try again.');
            setPhase('skill_input');
        }
    };

    const selectAnswer = (idx: number) => {
        if (revealed) return;
        setAnswers(p => { const n = [...p]; n[currentQ] = idx; return n; });
        setRevealed(true);
    };

    const nextQuestion = () => {
        if (currentQ < questions.length - 1) { setCurrentQ(p => p + 1); setRevealed(false); }
        else setPhase('results');
    };

    const resetTest = () => {
        setPhase('intro'); setSelectedSkills([]); setSkillInput('');
        setQuestions([]); setAnswers([]); setError(''); setCurrentQ(0); setRevealed(false);
    };

    if (phase === 'intro') return (
        <ScrollView contentContainerStyle={s.centered}>
            <View style={s.iconCircleLarge}><Ionicons name="stats-chart" size={48} color="#818CF8" /></View>
            <Text style={s.heroTitle}>AI Mock Test</Text>
            <Text style={s.heroSubtitle}>Pick your skills, get AI questions, and see your live performance chart!</Text>
            <View style={s.featureList}>
                {[
                    { icon: 'bulb-outline', text: 'AI-generated questions tailored to your skills' },
                    { icon: 'timer-outline', text: 'Multiple-choice with instant explanation' },
                    { icon: 'bar-chart-outline', text: 'Live animated results graph' },
                ].map(f => (
                    <View key={f.text} style={s.featureRow}>
                        <Ionicons name={f.icon as any} size={20} color="#818CF8" />
                        <Text style={s.featureText}>{f.text}</Text>
                    </View>
                ))}
            </View>
            <TouchableOpacity style={s.primaryBtn} onPress={() => setPhase('skill_input')}>
                <Ionicons name="play-circle" size={22} color="#FFFFFF" />
                <Text style={s.primaryBtnText}>Start Mock Test</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    if (phase === 'skill_input') return (
        <ScrollView contentContainerStyle={s.scrollPad} keyboardShouldPersistTaps="handled">
            <Text style={s.sectionTitle}>What skills should we test?</Text>
            <View style={s.inputRow}>
                <TextInput style={[s.input, { flex: 1 }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    placeholder="e.g. Data Structures" placeholderTextColor="#475569"
                    value={skillInput} onChangeText={setSkillInput} selectionColor="#818CF8"
                    onSubmitEditing={() => addSkill(skillInput)} returnKeyType="done" />
                <TouchableOpacity style={s.addBtn} onPress={() => addSkill(skillInput)}>
                    <Text style={s.addBtnText}>Add</Text>
                </TouchableOpacity>
            </View>
            <View style={s.chipWrap}>
                {COMMON_SKILLS.map(sk => (
                    <TouchableOpacity key={sk} style={selectedSkills.includes(sk) ? s.chipSelected : s.chip}
                        onPress={() => selectedSkills.includes(sk) ? removeSkill(sk) : addSkill(sk)}>
                        <Text style={selectedSkills.includes(sk) ? s.chipTextSelected : s.chipText}>{sk}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {selectedSkills.length > 0 && (
                <View style={s.selectedBox}>
                    <Text style={s.selectedLabel}>Selected:</Text>
                    <View style={s.chipWrap}>
                        {selectedSkills.map(sk => (
                            <TouchableOpacity key={sk} style={s.chipSelected} onPress={() => removeSkill(sk)}>
                                <Text style={s.chipTextSelected}>{sk} ×</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
            <Text style={s.sectionTitle}>Number of questions</Text>
            <View style={s.qCountRow}>
                {[5, 8, 10].map(n => (
                    <TouchableOpacity key={n} style={[s.qCountBtn, questionCount === n && s.qCountBtnActive]} onPress={() => setQuestionCount(n)}>
                        <Text style={[s.qCountText, questionCount === n && s.qCountTextActive]}>{n}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {error ? <Text style={s.errorText}>{error}</Text> : null}
            <TouchableOpacity style={s.primaryBtn} onPress={startTest}>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                <Text style={s.primaryBtnText}>Generate Test with AI</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    if (phase === 'loading') return (
        <View style={s.centered}>
            <ActivityIndicator size="large" color="#818CF8" />
            <Text style={[s.heroSubtitle, { marginTop: 24 }]}>AI is crafting your questions…</Text>
        </View>
    );

    if (phase === 'quiz' && questions.length > 0) {
        const q = questions[currentQ];
        const selected = answers[currentQ];
        return (
            <ScrollView contentContainerStyle={s.scrollPad}>
                <View style={s.progressWrap}>
                    <View style={[s.progressFill, { width: `${((currentQ + 1) / questions.length) * 100}%` as any }]} />
                </View>
                <Text style={s.progressLabel}>Question {currentQ + 1} / {questions.length}</Text>
                <View style={s.chipWrap}>
                    {selectedSkills.slice(0, 3).map(sk => <View key={sk} style={s.chipTiny}><Text style={s.chipTinyText}>{sk}</Text></View>)}
                </View>
                <View style={s.questionCard}><Text style={s.questionText}>{q.question}</Text></View>
                {q.options.map((opt, i) => {
                    let optStyle = s.optionBtn;
                    let optTextColor = '#CBD5E1';
                    if (revealed) {
                        if (i === q.correctIndex) { optStyle = { ...s.optionBtn, ...s.optionCorrect }; optTextColor = '#FFFFFF'; }
                        else if (i === selected && selected !== q.correctIndex) { optStyle = { ...s.optionBtn, ...s.optionWrong }; optTextColor = '#FFFFFF'; }
                    } else if (i === selected) { optStyle = { ...s.optionBtn, ...s.optionSelected }; }
                    return (
                        <TouchableOpacity key={i} style={optStyle} onPress={() => selectAnswer(i)} disabled={revealed}>
                            <View style={s.optionLetter}><Text style={s.letterText}>{String.fromCharCode(65 + i)}</Text></View>
                            <Text style={[s.optionText, { color: optTextColor }]}>{opt.replace(/^[A-D]\.\s*/, '')}</Text>
                            {revealed && i === q.correctIndex && <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: 'auto' }} />}
                            {revealed && i === selected && selected !== q.correctIndex && <Ionicons name="close-circle" size={20} color="#FFFFFF" style={{ marginLeft: 'auto' }} />}
                        </TouchableOpacity>
                    );
                })}
                {revealed && (
                    <View style={s.explanationBox}>
                        <Ionicons name="information-circle" size={18} color="#818CF8" />
                        <Text style={s.explanationText}>{q.explanation}</Text>
                    </View>
                )}
                <View style={s.quizActions}>
                    {!revealed && <TouchableOpacity style={s.skipBtn} onPress={nextQuestion}><Text style={s.skipBtnText}>Skip</Text></TouchableOpacity>}
                    {revealed && <TouchableOpacity style={s.primaryBtn} onPress={nextQuestion}><Text style={s.primaryBtnText}>{currentQ < questions.length - 1 ? 'Next Question →' : 'See Results'}</Text></TouchableOpacity>}
                </View>
            </ScrollView>
        );
    }

    if (phase === 'results') {
        const grade = percentage >= 80 ? { emoji: '🏆', label: 'Excellent!', color: '#10B981' }
            : percentage >= 60 ? { emoji: '👍', label: 'Good Job!', color: '#F59E0B' }
                : { emoji: '💪', label: 'Keep Practicing!', color: '#EF4444' };
        return (
            <ScrollView contentContainerStyle={s.scrollPad}>
                <Text style={s.heroTitle}>Test Complete!</Text>
                <View style={[s.scoreBubble, { borderColor: grade.color }]}>
                    <Text style={s.gradeEmoji}>{grade.emoji}</Text>
                    <Text style={[s.scorePercent, { color: grade.color }]}>{percentage}%</Text>
                    <Text style={[s.gradeLabel, { color: grade.color }]}>{grade.label}</Text>
                </View>
                <View style={s.chartCard}>
                    <Text style={s.chartTitle}>📊 Performance Breakdown</Text>
                    <AnimatedBar value={correct} maxValue={questions.length} color="#10B981" label="Correct" />
                    <AnimatedBar value={incorrect} maxValue={questions.length} color="#EF4444" label="Wrong" />
                    <AnimatedBar value={skipped} maxValue={questions.length} color="#64748B" label="Skipped" />
                </View>
                <Text style={s.sectionTitle}>Question Review</Text>
                {questions.map((q, i) => {
                    const ans = answers[i];
                    const isCorrect = ans === q.correctIndex;
                    const isSkipped = ans === null;
                    return (
                        <View key={q.id} style={s.reviewCard}>
                            <View style={s.reviewHeader}>
                                <Text style={s.reviewNum}>Q{i + 1}</Text>
                                <Ionicons name={isSkipped ? 'ellipse-outline' : isCorrect ? 'checkmark-circle' : 'close-circle'} size={18}
                                    color={isSkipped ? '#64748B' : isCorrect ? '#10B981' : '#EF4444'} />
                            </View>
                            <Text style={s.reviewQ}>{q.question}</Text>
                            <Text style={s.reviewAnswer}>✅ {q.options[q.correctIndex]}</Text>
                            {!isCorrect && !isSkipped && ans !== null && <Text style={s.reviewWrong}>Your answer: {q.options[ans]}</Text>}
                        </View>
                    );
                })}
                <TouchableOpacity style={s.primaryBtn} onPress={resetTest}>
                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                    <Text style={s.primaryBtnText}>Try Another Test</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    return null;
}

// ─── Root Screen ──────────────────────────────────────────────────────────────
export default function StatusScreen() {
    const [activeTab, setActiveTab] = useState<ActiveTab>('mock');

    return (
        <SafeAreaView style={s.safe}>
            {/* Top Tab Bar */}
            <View style={s.tabBar}>
                <TouchableOpacity
                    style={[s.tabItem, activeTab === 'mock' && s.tabItemActive]}
                    onPress={() => setActiveTab('mock')}
                >
                    <Ionicons name="stats-chart-outline" size={18} color={activeTab === 'mock' ? '#818CF8' : '#64748B'} />
                    <Text style={[s.tabLabel, activeTab === 'mock' && s.tabLabelActive]}>AI Mock Test</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[s.tabItem, activeTab === 'gap' && s.tabItemActiveGap]}
                    onPress={() => setActiveTab('gap')}
                >
                    <Ionicons name="analytics-outline" size={18} color={activeTab === 'gap' ? '#F59E0B' : '#64748B'} />
                    <Text style={[s.tabLabel, activeTab === 'gap' && s.tabLabelGap]}>Skill Gap</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'mock' ? <MockTestTab /> : <SkillGapTab />}
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0F172A' },
    centered: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingBottom: 40 },
    scrollPad: { padding: 20, paddingBottom: 40 },

    // Tab bar
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
    },
    tabItem: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, gap: 6,
        borderBottomWidth: 3, borderBottomColor: 'transparent',
    },
    tabItemActive: { borderBottomColor: '#818CF8' },
    tabItemActiveGap: { borderBottomColor: '#F59E0B' },
    tabLabel: { color: '#64748B', fontWeight: '600', fontSize: 14 },
    tabLabelActive: { color: '#818CF8' },
    tabLabelGap: { color: '#F59E0B' },

    // Gap Indicator header
    gapHeader: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
    gapTitle: { color: '#F8FAFC', fontWeight: '700', fontSize: 17 },
    gapSub: { color: '#94A3B8', fontSize: 13, marginTop: 2, lineHeight: 18 },

    // Level badge
    levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    levelBadgeText: { fontSize: 11, fontWeight: '700' },

    // Hero
    iconCircleLarge: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(129,140,248,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    heroTitle: { fontSize: 26, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 12 },
    heroSubtitle: { fontSize: 15, color: '#94A3B8', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    featureList: { width: '100%', marginBottom: 32 },
    featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
    featureText: { color: '#CBD5E1', fontSize: 14, flex: 1 },

    // Buttons
    primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6C7FD8', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, gap: 8, marginTop: 8 },
    primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    skipBtn: { alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#334155', marginTop: 8 },
    skipBtnText: { color: '#94A3B8', fontWeight: '600', fontSize: 15 },
    addBtn: { backgroundColor: '#818CF8', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
    addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

    // Form
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#E2E8F0', marginTop: 20, marginBottom: 8 },
    inputRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    input: { backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, borderWidth: 1, borderColor: '#334155' },

    // Chips
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
    chipSelected: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#818CF8' },
    chipText: { color: '#94A3B8', fontSize: 13 },
    chipTextSelected: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
    chipTiny: { backgroundColor: 'rgba(129,140,248,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    chipTinyText: { color: '#818CF8', fontSize: 12, fontWeight: '600' },
    selectedBox: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 8 },
    selectedLabel: { color: '#94A3B8', fontSize: 13, marginBottom: 8 },

    qCountRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    qCountBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
    qCountBtnActive: { backgroundColor: '#818CF8', borderColor: '#818CF8' },
    qCountText: { color: '#94A3B8', fontWeight: '700', fontSize: 16 },
    qCountTextActive: { color: '#FFFFFF' },
    errorText: { color: '#EF4444', marginBottom: 8, textAlign: 'center', fontSize: 14 },

    // Progress
    progressWrap: { height: 4, backgroundColor: '#1E293B' },
    progressFill: { height: '100%', backgroundColor: '#818CF8', borderBottomRightRadius: 2 },
    progressLabel: { color: '#64748B', fontSize: 12, textAlign: 'right', paddingTop: 6, paddingBottom: 2 },

    // Quiz
    questionCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
    questionText: { color: '#F8FAFC', fontSize: 17, fontWeight: '600', lineHeight: 26 },
    optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1E293B', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
    optionSelected: { borderColor: '#818CF8' },
    optionCorrect: { backgroundColor: '#059669', borderColor: '#059669' },
    optionWrong: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
    optionLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    letterText: { color: '#E2E8F0', fontWeight: '700', fontSize: 14 },
    optionText: { fontSize: 15, flex: 1 },
    explanationBox: { flexDirection: 'row', gap: 10, backgroundColor: 'rgba(129,140,248,0.1)', borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: 'rgba(129,140,248,0.3)' },
    explanationText: { color: '#CBD5E1', fontSize: 14, lineHeight: 20, flex: 1 },
    quizActions: { marginTop: 8 },

    // Results
    scoreBubble: { alignSelf: 'center', width: 160, height: 160, borderRadius: 80, borderWidth: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E293B', marginVertical: 24 },
    gradeEmoji: { fontSize: 32, marginBottom: 4 },
    scorePercent: { fontSize: 36, fontWeight: '800' },
    gradeLabel: { fontSize: 14, fontWeight: '600', marginTop: 2 },
    chartCard: { backgroundColor: '#1E293B', borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
    chartTitle: { color: '#E2E8F0', fontWeight: '700', fontSize: 16, marginBottom: 20 },
    reviewCard: { backgroundColor: '#1E293B', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    reviewNum: { color: '#64748B', fontWeight: '700', fontSize: 13 },
    reviewQ: { color: '#CBD5E1', fontSize: 14, lineHeight: 20, marginBottom: 8 },
    reviewAnswer: { color: '#10B981', fontSize: 13, fontWeight: '600' },
    reviewWrong: { color: '#EF4444', fontSize: 13, marginTop: 4 },
});
