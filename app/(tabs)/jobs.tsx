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
    StatusBar,
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

type Phase = 'intro' | 'skill_input' | 'loading' | 'quiz' | 'results';

// ─── Skill Chips ─────────────────────────────────────────────────────────────
const COMMON_SKILLS = ['JavaScript', 'Python', 'React', 'Data Structures', 'SQL', 'Java', 'Networking', 'OS', 'DBMS', 'Machine Learning'];

// ─── BAR CHART component ─────────────────────────────────────────────────────
function AnimatedBar({ value, maxValue, color, label }: { value: number; maxValue: number; color: string; label: string }) {
    const barWidth = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const targetWidth = maxValue === 0 ? 0 : (value / maxValue) * (SCREEN_WIDTH - 100);
        Animated.timing(barWidth, {
            toValue: targetWidth,
            duration: 800,
            useNativeDriver: false,
        }).start();
    }, [value, maxValue]);

    return (
        <View style={barStyles.row}>
            <Text style={barStyles.label}>{label}</Text>
            <View style={barStyles.track}>
                <Animated.View style={[barStyles.fill, { width: barWidth, backgroundColor: color }]} />
            </View>
            <Text style={barStyles.value}>{value}</Text>
        </View>
    );
}

const barStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    label: { width: 70, color: '#94A3B8', fontSize: 12, fontWeight: '600' },
    track: {
        flex: 1,
        height: 22,
        backgroundColor: '#1E293B',
        borderRadius: 11,
        overflow: 'hidden',
        marginHorizontal: 8,
    },
    fill: { height: '100%', borderRadius: 11 },
    value: { width: 28, color: '#FFFFFF', fontWeight: '700', textAlign: 'right', fontSize: 14 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MockTestScreen() {
    const [phase, setPhase] = useState<Phase>('intro');
    const [skillInput, setSkillInput] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [questionCount, setQuestionCount] = useState(5);

    const [questions, setQuestions] = useState<MCQQuestion[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [revealed, setRevealed] = useState(false);
    const [error, setError] = useState('');

    // ── Derived stats ──────────────────────────────────────────────────────
    const correct = answers.filter((a, i) => questions[i] && a === questions[i].correctIndex).length;
    const incorrect = answers.filter((a, i) => questions[i] && a !== null && a !== questions[i].correctIndex).length;
    const skipped = questions.length - correct - incorrect;
    const percentage = questions.length ? Math.round((correct / questions.length) * 100) : 0;

    // ── Skill chip helpers ──────────────────────────────────────────────────
    const addSkill = (s: string) => {
        const trimmed = s.trim();
        if (!trimmed) return;
        if (!selectedSkills.includes(trimmed)) setSelectedSkills(prev => [...prev, trimmed]);
        setSkillInput('');
    };

    const removeSkill = (s: string) => setSelectedSkills(prev => prev.filter(x => x !== s));

    // ── Generate questions via GROQ API ─────────────────────────────────────
    const startTest = async () => {
        if (selectedSkills.length === 0) { setError('Please add at least one skill.'); return; }
        setError('');
        setPhase('loading');
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
            setCurrentQ(0);
            setRevealed(false);
            setPhase('quiz');
        } catch (e: any) {
            setError('Failed to generate questions. Please try again.');
            setPhase('skill_input');
        }
    };

    // ── Answer selection ─────────────────────────────────────────────────────
    const selectAnswer = (idx: number) => {
        if (revealed) return; // already submitted
        setAnswers(prev => {
            const next = [...prev];
            next[currentQ] = idx;
            return next;
        });
        setRevealed(true);
    };

    const nextQuestion = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ(prev => prev + 1);
            setRevealed(false);
        } else {
            setPhase('results');
        }
    };

    const resetTest = () => {
        setPhase('intro');
        setSelectedSkills([]);
        setSkillInput('');
        setQuestions([]);
        setAnswers([]);
        setError('');
        setCurrentQ(0);
        setRevealed(false);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // INTRO PHASE
    // ─────────────────────────────────────────────────────────────────────────
    if (phase === 'intro') {
        return (
            <SafeAreaView style={s.safe}>
                <ScrollView contentContainerStyle={s.centered}>
                    <View style={s.iconCircleLarge}>
                        <Ionicons name="stats-chart" size={48} color="#818CF8" />
                    </View>
                    <Text style={s.heroTitle}>AI Mock Test</Text>
                    <Text style={s.heroSubtitle}>
                        Tell our AI what skills you want to be tested on.{'\n'}
                        Get instant questions, submit answers, and see your live performance chart!
                    </Text>

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
            </SafeAreaView>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SKILL INPUT PHASE
    // ─────────────────────────────────────────────────────────────────────────
    if (phase === 'skill_input') {
        return (
            <SafeAreaView style={s.safe}>
                <ScrollView contentContainerStyle={s.scrollPad} keyboardShouldPersistTaps="handled">
                    <Text style={s.sectionTitle}>What skills should we test?</Text>
                    <Text style={s.sectionSub}>Type a skill and press Add, or tap from the list below.</Text>

                    {/* Input row */}
                    <View style={s.inputRow}>
                        <TextInput
                            style={[s.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                            placeholder="e.g. Data Structures"
                            placeholderTextColor="#475569"
                            value={skillInput}
                            onChangeText={setSkillInput}
                            selectionColor="#818CF8"
                            onSubmitEditing={() => addSkill(skillInput)}
                            returnKeyType="done"
                        />
                        <TouchableOpacity style={s.addBtn} onPress={() => addSkill(skillInput)}>
                            <Text style={s.addBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Common skill chips */}
                    <View style={s.chipWrap}>
                        {COMMON_SKILLS.map(sk => (
                            <TouchableOpacity key={sk} style={[s.chip, selectedSkills.includes(sk) && s.chipSelected]} onPress={() => selectedSkills.includes(sk) ? removeSkill(sk) : addSkill(sk)}>
                                <Text style={[s.chipText, selectedSkills.includes(sk) && s.chipTextSelected]}>{sk}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Selected skills */}
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

                    {/* Number of questions */}
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
            </SafeAreaView>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOADING PHASE
    // ─────────────────────────────────────────────────────────────────────────
    if (phase === 'loading') {
        return (
            <SafeAreaView style={s.safe}>
                <View style={s.centered}>
                    <ActivityIndicator size="large" color="#818CF8" />
                    <Text style={[s.heroSubtitle, { marginTop: 24 }]}>AI is crafting your questions…</Text>
                    <Text style={{ color: '#475569', marginTop: 8 }}>Skills: {selectedSkills.join(', ')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUIZ PHASE
    // ─────────────────────────────────────────────────────────────────────────
    if (phase === 'quiz' && questions.length > 0) {
        const q = questions[currentQ];
        const selected = answers[currentQ];

        return (
            <SafeAreaView style={s.safe}>
                {/* Progress Bar */}
                <View style={s.progressWrap}>
                    <View style={[s.progressFill, { width: `${((currentQ + 1) / questions.length) * 100}%` as any }]} />
                </View>
                <Text style={s.progressLabel}>Question {currentQ + 1} / {questions.length}</Text>

                <ScrollView contentContainerStyle={s.scrollPad}>
                    {/* Skill badges */}
                    <View style={s.chipWrap}>
                        {selectedSkills.slice(0, 3).map(sk => (
                            <View key={sk} style={s.chipTiny}><Text style={s.chipTinyText}>{sk}</Text></View>
                        ))}
                    </View>

                    {/* Question */}
                    <View style={s.questionCard}>
                        <Text style={s.questionText}>{q.question}</Text>
                    </View>

                    {/* Options */}
                    {q.options.map((opt, i) => {
                        let optStyle = s.optionBtn;
                        let optTextStyle = s.optionText;
                        if (revealed) {
                            if (i === q.correctIndex) {
                                optStyle = { ...s.optionBtn, ...s.optionCorrect };
                                optTextStyle = { ...s.optionText, color: '#FFFFFF' };
                            } else if (i === selected && selected !== q.correctIndex) {
                                optStyle = { ...s.optionBtn, ...s.optionWrong };
                                optTextStyle = { ...s.optionText, color: '#FFFFFF' };
                            }
                        } else if (i === selected) {
                            optStyle = { ...s.optionBtn, ...s.optionSelected };
                        }

                        return (
                            <TouchableOpacity key={i} style={optStyle} onPress={() => selectAnswer(i)} disabled={revealed}>
                                <View style={s.optionLetter}>
                                    <Text style={s.letterText}>{String.fromCharCode(65 + i)}</Text>
                                </View>
                                <Text style={optTextStyle}>{opt.replace(/^[A-D]\.\s*/, '')}</Text>
                                {revealed && i === q.correctIndex && <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginLeft: 'auto' }} />}
                                {revealed && i === selected && selected !== q.correctIndex && <Ionicons name="close-circle" size={20} color="#FFFFFF" style={{ marginLeft: 'auto' }} />}
                            </TouchableOpacity>
                        );
                    })}

                    {/* Explanation */}
                    {revealed && (
                        <View style={s.explanationBox}>
                            <Ionicons name="information-circle" size={18} color="#818CF8" />
                            <Text style={s.explanationText}>{q.explanation}</Text>
                        </View>
                    )}

                    {/* Next / Skip */}
                    <View style={s.quizActions}>
                        {!revealed && (
                            <TouchableOpacity style={s.skipBtn} onPress={nextQuestion}>
                                <Text style={s.skipBtnText}>Skip</Text>
                            </TouchableOpacity>
                        )}
                        {revealed && (
                            <TouchableOpacity style={s.primaryBtn} onPress={nextQuestion}>
                                <Text style={s.primaryBtnText}>{currentQ < questions.length - 1 ? 'Next Question →' : 'See Results'}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESULTS PHASE
    // ─────────────────────────────────────────────────────────────────────────
    if (phase === 'results') {
        const grade = percentage >= 80 ? { emoji: '🏆', label: 'Excellent!', color: '#10B981' }
            : percentage >= 60 ? { emoji: '👍', label: 'Good Job!', color: '#F59E0B' }
                : { emoji: '💪', label: 'Keep Practicing!', color: '#EF4444' };

        return (
            <SafeAreaView style={s.safe}>
                <ScrollView contentContainerStyle={s.scrollPad}>
                    <Text style={s.heroTitle}>Test Complete!</Text>

                    {/* Score bubble */}
                    <View style={[s.scoreBubble, { borderColor: grade.color }]}>
                        <Text style={s.gradeEmoji}>{grade.emoji}</Text>
                        <Text style={[s.scorePercent, { color: grade.color }]}>{percentage}%</Text>
                        <Text style={[s.gradeLabel, { color: grade.color }]}>{grade.label}</Text>
                    </View>

                    {/* Live Chart */}
                    <View style={s.chartCard}>
                        <Text style={s.chartTitle}>📊 Performance Breakdown</Text>
                        <AnimatedBar value={correct} maxValue={questions.length} color="#10B981" label="Correct" />
                        <AnimatedBar value={incorrect} maxValue={questions.length} color="#EF4444" label="Wrong" />
                        <AnimatedBar value={skipped} maxValue={questions.length} color="#64748B" label="Skipped" />
                    </View>

                    {/* Per-question review */}
                    <Text style={s.sectionTitle}>Question Review</Text>
                    {questions.map((q, i) => {
                        const ans = answers[i];
                        const isCorrect = ans === q.correctIndex;
                        const isSkipped = ans === null;
                        return (
                            <View key={q.id} style={s.reviewCard}>
                                <View style={s.reviewHeader}>
                                    <Text style={s.reviewNum}>Q{i + 1}</Text>
                                    <Ionicons
                                        name={isSkipped ? 'ellipse-outline' : isCorrect ? 'checkmark-circle' : 'close-circle'}
                                        size={18}
                                        color={isSkipped ? '#64748B' : isCorrect ? '#10B981' : '#EF4444'}
                                    />
                                </View>
                                <Text style={s.reviewQ}>{q.question}</Text>
                                <Text style={s.reviewAnswer}>
                                    ✅ {q.options[q.correctIndex]}
                                </Text>
                                {!isCorrect && !isSkipped && ans !== null && (
                                    <Text style={s.reviewWrong}>Your answer: {q.options[ans]}</Text>
                                )}
                            </View>
                        );
                    })}

                    <TouchableOpacity style={s.primaryBtn} onPress={resetTest}>
                        <Ionicons name="refresh" size={20} color="#FFFFFF" />
                        <Text style={s.primaryBtnText}>Try Another Test</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return null;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0F172A' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    scrollPad: { padding: 20, paddingBottom: 20 },

    // Hero / Intro
    iconCircleLarge: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: 'rgba(129,140,248,0.15)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    },
    heroTitle: { fontSize: 28, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 12 },
    heroSubtitle: { fontSize: 15, color: '#94A3B8', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    featureList: { width: '100%', marginBottom: 32 },
    featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
    featureText: { color: '#CBD5E1', fontSize: 14, flex: 1 },

    // Buttons
    primaryBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#6C7FD8', borderRadius: 16, paddingVertical: 16,
        paddingHorizontal: 24, gap: 8, marginTop: 8,
    },
    primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    skipBtn: {
        alignItems: 'center', paddingVertical: 14,
        borderRadius: 16, borderWidth: 1, borderColor: '#334155',
        marginTop: 8,
    },
    skipBtnText: { color: '#94A3B8', fontWeight: '600', fontSize: 15 },
    addBtn: { backgroundColor: '#818CF8', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
    addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

    // Skill input
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#E2E8F0', marginTop: 24, marginBottom: 8 },
    sectionSub: { color: '#64748B', fontSize: 14, marginBottom: 16 },
    inputRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    input: {
        flex: 1, backgroundColor: '#1E293B', color: '#F8FAFC',
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
        fontSize: 15, borderWidth: 1, borderColor: '#334155',
    },

    // Chips
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
        borderWidth: 1, borderColor: '#334155', backgroundColor: 'transparent',
    },
    chipSelected: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#818CF8' },
    chipText: { color: '#94A3B8', fontSize: 13 },
    chipTextSelected: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
    chipTiny: { backgroundColor: 'rgba(129,140,248,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    chipTinyText: { color: '#818CF8', fontSize: 12, fontWeight: '600' },

    // Selected skills area
    selectedBox: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 8 },
    selectedLabel: { color: '#94A3B8', fontSize: 13, marginBottom: 8 },

    // Q count
    qCountRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    qCountBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 12,
        borderWidth: 1, borderColor: '#334155', alignItems: 'center',
    },
    qCountBtnActive: { backgroundColor: '#818CF8', borderColor: '#818CF8' },
    qCountText: { color: '#94A3B8', fontWeight: '700', fontSize: 16 },
    qCountTextActive: { color: '#FFFFFF' },

    errorText: { color: '#EF4444', marginBottom: 8, textAlign: 'center', fontSize: 14 },

    // Progress
    progressWrap: { height: 4, backgroundColor: '#1E293B', marginHorizontal: 0 },
    progressFill: { height: '100%', backgroundColor: '#818CF8', borderBottomRightRadius: 2 },
    progressLabel: { color: '#64748B', fontSize: 12, textAlign: 'right', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 2 },

    // Quiz
    questionCard: {
        backgroundColor: '#1E293B', borderRadius: 20, padding: 20,
        marginBottom: 20, borderWidth: 1, borderColor: '#334155',
    },
    questionText: { color: '#F8FAFC', fontSize: 17, fontWeight: '600', lineHeight: 26 },
    optionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#1E293B', borderRadius: 14, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: '#334155',
    },
    optionSelected: { borderColor: '#818CF8', backgroundColor: '#1E293B' },
    optionCorrect: { backgroundColor: '#059669', borderColor: '#059669' },
    optionWrong: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
    optionLetter: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center', alignItems: 'center',
    },
    letterText: { color: '#E2E8F0', fontWeight: '700', fontSize: 14 },
    optionText: { color: '#CBD5E1', fontSize: 15, flex: 1 },
    explanationBox: {
        flexDirection: 'row', gap: 10, backgroundColor: 'rgba(129,140,248,0.1)',
        borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: 'rgba(129,140,248,0.3)',
    },
    explanationText: { color: '#CBD5E1', fontSize: 14, lineHeight: 20, flex: 1 },
    quizActions: { marginTop: 8 },

    // Results
    scoreBubble: {
        alignSelf: 'center', width: 160, height: 160, borderRadius: 80,
        borderWidth: 4, justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#1E293B', marginVertical: 24,
    },
    gradeEmoji: { fontSize: 32, marginBottom: 4 },
    scorePercent: { fontSize: 36, fontWeight: '800' },
    gradeLabel: { fontSize: 14, fontWeight: '600', marginTop: 2 },
    chartCard: {
        backgroundColor: '#1E293B', borderRadius: 20, padding: 20,
        marginTop: 8, marginBottom: 24, borderWidth: 1, borderColor: '#334155',
    },
    chartTitle: { color: '#E2E8F0', fontWeight: '700', fontSize: 16, marginBottom: 20 },
    reviewCard: {
        backgroundColor: '#1E293B', borderRadius: 14, padding: 16, marginBottom: 10,
        borderWidth: 1, borderColor: '#334155',
    },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    reviewNum: { color: '#64748B', fontWeight: '700', fontSize: 13 },
    reviewQ: { color: '#CBD5E1', fontSize: 14, lineHeight: 20, marginBottom: 8 },
    reviewAnswer: { color: '#10B981', fontSize: 13, fontWeight: '600' },
    reviewWrong: { color: '#EF4444', fontSize: 13, marginTop: 4 },
});
