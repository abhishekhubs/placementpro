import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ChatbotModal from '@/components/ChatbotModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const EXPLORE_TOOLS = [
    {
        id: 'mock',
        title: 'AI Mock Test',
        description: 'Practice with AI-generated questions tailored to your skills.',
        icon: 'stats-chart',
        color: '#818CF8',
        route: '/jobs?tab=mock'
    },
    {
        id: 'gap',
        title: 'Skill Gaps Analyzer',
        description: 'See how your skills match up against your target job roles.',
        icon: 'analytics',
        color: '#F59E0B',
        route: '/jobs?tab=gap'
    },
    {
        id: 'chat',
        title: 'Placement Chatbot',
        description: 'Get instant answers for your placement & drive queries.',
        icon: 'chatbubbles',
        color: '#1D9BF0',
        isModal: true
    }
];

export default function SearchScreen() {
    const router = useRouter();
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handlePress = (tool: typeof EXPLORE_TOOLS[0]) => {
        if (tool.isModal) {
            setIsChatOpen(true);
        } else if (tool.route) {
            router.push(tool.route as any);
        }
    };

    const filteredTools = EXPLORE_TOOLS.filter(tool =>
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Explore AI Tools</Text>
                    <Text style={styles.headerSubtitle}>Supercharge your placement prep with our advanced AI suite.</Text>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search AI tools..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.grid}>
                    {filteredTools.length > 0 ? (
                        filteredTools.map((tool) => (
                            <TouchableOpacity
                                key={tool.id}
                                style={[styles.card, { borderLeftColor: tool.color }]}
                                onPress={() => handlePress(tool)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: tool.color + '22' }]}>
                                    <Ionicons name={tool.icon as any} size={28} color={tool.color} />
                                </View>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{tool.title}</Text>
                                    <Text style={styles.cardDescription}>{tool.description}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#475569" />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={48} color="#334155" />
                            <Text style={styles.emptyText}>No AI tools match your search.</Text>
                        </View>
                    )}
                </View>

                {/* Info Card */}
                {filteredTools.length > 0 && (
                    <View style={styles.infoCard}>
                        <Ionicons name="bulb-outline" size={24} color="#6C7FD8" />
                        <Text style={styles.infoText}>
                            Our AI tools use the latest language models to provide personalized feedback and job matching.
                        </Text>
                    </View>
                )}
            </ScrollView>

            <ChatbotModal visible={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
        marginTop: Platform.OS === 'ios' ? 0 : 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#F8FAFC',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#94A3B8',
        lineHeight: 24,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 14,
        paddingHorizontal: 16,
        height: 52,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#334155',
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        color: '#F8FAFC',
        fontSize: 16,
        ...Platform.select({
            web: { outlineStyle: 'none' }
        }) as any
    },
    grid: {
        gap: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 16,
        borderLeftWidth: 4,
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#E2E8F0',
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 14,
        color: '#94A3B8',
        lineHeight: 20,
    },
    infoCard: {
        marginTop: 40,
        flexDirection: 'row',
        backgroundColor: 'rgba(108, 127, 216, 0.1)',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(108, 127, 216, 0.2)',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#CBD5E1',
        lineHeight: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        gap: 16,
    },
    emptyText: {
        color: '#64748B',
        fontSize: 16,
        textAlign: 'center',
    },
});
