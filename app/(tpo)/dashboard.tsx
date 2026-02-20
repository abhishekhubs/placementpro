import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function TPODashboard() {
    const { logout, user } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.roleName}>TPO Administrator</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="people" size={28} color="#6C7FD8" />
                        <Text style={styles.statNumber}>1,240</Text>
                        <Text style={styles.statLabel}>Total Students</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="business" size={28} color="#10B981" />
                        <Text style={styles.statNumber}>14</Text>
                        <Text style={styles.statLabel}>Active Drives</Text>
                    </View>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Ionicons name="document-text" size={28} color="#F59E0B" />
                        <Text style={styles.statNumber}>89</Text>
                        <Text style={styles.statLabel}>Pending Approvals</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Ionicons name="briefcase" size={28} color="#8B5CF6" />
                        <Text style={styles.statNumber}>452</Text>
                        <Text style={styles.statLabel}>Placed Students</Text>
                    </View>
                </View>

                {/* Recent Activity Section (Placeholder) */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.activityCard}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" style={styles.activityIcon} />
                    <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>TCS Ninja Drive Completed</Text>
                        <Text style={styles.activityTime}>2 hours ago</Text>
                    </View>
                </View>

                <View style={styles.activityCard}>
                    <Ionicons name="time" size={24} color="#F59E0B" style={styles.activityIcon} />
                    <View style={styles.activityContent}>
                        <Text style={styles.activityTitle}>New company registration: Infosys</Text>
                        <Text style={styles.activityTime}>5 hours ago</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    greeting: {
        fontSize: 14,
        color: '#6B7280',
    },
    roleName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    logoutButton: {
        padding: 8,
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
    },
    scrollContent: {
        padding: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    seeAllText: {
        fontSize: 14,
        color: '#6C7FD8',
        fontWeight: '600',
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    activityIcon: {
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1F2937',
    },
    activityTime: {
        fontSize: 13,
        color: '#9CA3AF',
        marginTop: 2,
    },
});
