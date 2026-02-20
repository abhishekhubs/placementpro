import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    TextInput, ScrollView, Platform, Alert, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useFeed } from '@/context/FeedContext';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Post Type definitions ────────────────────────────────────────────────────
const POST_TYPES = [
    { id: 'internship', label: 'Internship', icon: 'briefcase', color: '#6C7FD8', emoji: '💼' },
    { id: 'certificate', label: 'Certificate', icon: 'ribbon', color: '#10B981', emoji: '🏅' },
    { id: 'skill', label: 'Skill', icon: 'code-slash', color: '#F59E0B', emoji: '⚡' },
    { id: 'achievement', label: 'Achievement', icon: 'trophy', color: '#EF4444', emoji: '🏆' },
    { id: 'general', label: 'General', icon: 'create-outline', color: '#8B5CF6', emoji: '📝' },
] as const;

type PostTypeId = (typeof POST_TYPES)[number]['id'];

// ─── Placeholder text per type ────────────────────────────────────────────────
const PLACEHOLDERS: Record<PostTypeId, string> = {
    internship: 'Share your internship experience! What company, role, and what did you learn?',
    certificate: 'Tell everyone about your new certification! Which one and why is it important?',
    skill: 'What new skill have you picked up? Share tips for learning it!',
    achievement: 'What achievement are you proud of? Share the story!',
    general: "What's on your mind?",
};

export default function AddScreen() {
    const router = useRouter();
    const { addPost } = useFeed();
    const { user } = useAuth();

    const [selectedType, setSelectedType] = useState<PostTypeId>('internship');
    const [postText, setPostText] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [profileAvatar, setProfileAvatar] = useState<string>('https://i.pravatar.cc/100?u=student1');

    // Load the saved profile avatar from AsyncStorage
    useEffect(() => {
        AsyncStorage.getItem('@placementpro_user_profile').then(raw => {
            if (raw) {
                const profile = JSON.parse(raw);
                if (profile?.avatarImage) setProfileAvatar(profile.avatarImage);
                if (profile?.name) setProfileName(profile.name);
            }
        }).catch(() => { });
    }, []);

    const [profileName, setProfileName] = useState<string>('');

    const typeConfig = POST_TYPES.find(t => t.id === selectedType)!;

    // ── Image picker ──────────────────────────────────────────────────────────
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    // ── Submit post ───────────────────────────────────────────────────────────
    const handlePost = () => {
        if (!postText.trim()) {
            Alert.alert('Empty Post', 'Please write something before posting.');
            return;
        }
        setIsPosting(true);

        const userName = profileName || (user as any)?.name || (user as any)?.email || 'Student';
        const avatar = profileAvatar;

        // Prefix content with type emoji for visual flair in feed
        const fullContent = `${typeConfig.emoji} [${typeConfig.label.toUpperCase()}] ${postText.trim()}`;

        addPost({
            author: {
                name: userName,
                role: 'Student',
                avatar,
            },
            content: fullContent,
            image: imageUri,
            link: null,
            postType: selectedType,
            isStudentPost: true,
        } as any);

        setIsPosting(false);
        setPostText('');
        setImageUri(null);
        Alert.alert('Posted! 🎉', 'Your achievement has been shared to the feed!', [
            { text: 'View Feed', onPress: () => router.push('/(tabs)/home') },
            { text: 'Stay Here', style: 'cancel' },
        ]);
    };

    return (
        <SafeAreaView style={s.safe}>
            {/* Header */}
            <View style={s.header}>
                <Text style={s.headerTitle}>Share Achievement</Text>
                <TouchableOpacity
                    style={[s.postBtn, !postText.trim() && s.postBtnDisabled]}
                    onPress={handlePost}
                    disabled={!postText.trim() || isPosting}
                >
                    {isPosting
                        ? <ActivityIndicator color="#FFF" size="small" />
                        : <Text style={s.postBtnText}>Post</Text>
                    }
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

                {/* Type Selector */}
                <Text style={s.label}>What are you sharing?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.typeRow} contentContainerStyle={{ gap: 10, paddingRight: 20 }}>
                    {POST_TYPES.map(t => (
                        <TouchableOpacity
                            key={t.id}
                            style={[s.typeChip, selectedType === t.id && { backgroundColor: t.color + '22', borderColor: t.color }]}
                            onPress={() => setSelectedType(t.id)}
                        >
                            <Text style={s.typeEmoji}>{t.emoji}</Text>
                            <Text style={[s.typeLabel, selectedType === t.id && { color: t.color }]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Active type banner */}
                <View style={[s.typeBanner, { borderColor: typeConfig.color + '44', backgroundColor: typeConfig.color + '11' }]}>
                    <Ionicons name={typeConfig.icon as any} size={20} color={typeConfig.color} />
                    <Text style={[s.typeBannerText, { color: typeConfig.color }]}>
                        Posting as: <Text style={{ fontWeight: '800' }}>{typeConfig.label}</Text>
                    </Text>
                </View>

                {/* Text Input */}
                <TextInput
                    style={[s.textArea, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    placeholder={PLACEHOLDERS[selectedType]}
                    placeholderTextColor="#475569"
                    value={postText}
                    onChangeText={setPostText}
                    multiline
                    selectionColor={typeConfig.color}
                    textAlignVertical="top"
                    maxLength={1000}
                />
                <Text style={s.charCount}>{postText.length}/1000</Text>

                {/* Image preview */}
                {imageUri && (
                    <View style={s.imagePreviewWrap}>
                        <Image source={{ uri: imageUri }} style={s.imagePreview} />
                        <TouchableOpacity style={s.removeImg} onPress={() => setImageUri(null)}>
                            <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Toolbar */}
                <View style={s.toolbar}>
                    <TouchableOpacity style={s.toolBtn} onPress={pickImage}>
                        <Ionicons name="image-outline" size={22} color="#818CF8" />
                        <Text style={s.toolLabel}>Photo</Text>
                    </TouchableOpacity>
                </View>

                {/* Tips */}
                <View style={s.tipsCard}>
                    <Text style={s.tipsTitle}>💡 Tips for a great post</Text>
                    {[
                        'Name the company/institution',
                        'Mention dates and duration',
                        'Describe key takeaways or skills gained',
                        'Add a certificate image for credibility',
                    ].map(tip => (
                        <View key={tip} style={s.tipRow}>
                            <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                            <Text style={s.tipText}>{tip}</Text>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#0F172A' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#1E293B',
    },
    headerTitle: { color: '#F8FAFC', fontWeight: '800', fontSize: 20 },
    postBtn: { backgroundColor: '#6C7FD8', paddingHorizontal: 22, paddingVertical: 9, borderRadius: 20 },
    postBtnDisabled: { backgroundColor: '#334155', opacity: 0.6 },
    postBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

    scroll: { padding: 20, paddingBottom: 80 },

    label: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },

    typeRow: { marginBottom: 16 },
    typeChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 20, borderWidth: 1.5, borderColor: '#334155',
        backgroundColor: 'transparent',
    },
    typeEmoji: { fontSize: 16 },
    typeLabel: { color: '#64748B', fontWeight: '600', fontSize: 13 },

    typeBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16,
    },
    typeBannerText: { fontSize: 14 },

    textArea: {
        backgroundColor: '#1E293B', color: '#F8FAFC', borderRadius: 16,
        padding: 16, fontSize: 17, minHeight: 160, lineHeight: 26,
        borderWidth: 1, borderColor: '#334155',
    },
    charCount: { color: '#475569', fontSize: 12, textAlign: 'right', marginTop: 4, marginBottom: 12 },

    imagePreviewWrap: { position: 'relative', marginBottom: 12 },
    imagePreview: { width: '100%', height: 200, borderRadius: 14 },
    removeImg: { position: 'absolute', top: 8, right: 8 },

    toolbar: {
        flexDirection: 'row', paddingVertical: 12,
        borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1E293B',
        marginBottom: 20,
    },
    toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
    toolLabel: { color: '#818CF8', fontSize: 14, fontWeight: '600' },

    tipsCard: {
        backgroundColor: '#1E293B', borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: '#334155',
    },
    tipsTitle: { color: '#E2E8F0', fontWeight: '700', fontSize: 14, marginBottom: 10 },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
    tipText: { color: '#94A3B8', fontSize: 13, flex: 1 },
});
