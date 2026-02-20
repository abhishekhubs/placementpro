import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, SafeAreaView, Dimensions, Modal, TextInput, Platform, Linking, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useFeed } from '@/context/FeedContext';
import { useRouter } from 'expo-router';

const PROFILE_STORAGE_KEY = '@placementpro_user_profile';

const { width } = Dimensions.get('window');

const COLORS = {
    background: '#101720',
    card: '#151E28',
    textPrimary: '#FFFFFF',
    textSecondary: '#8899A6',
    accent: '#1D9BF0',
    border: '#2F3336',
    buttonBg: '#FFFFFF',
    buttonText: '#000000',
};

// Define User Profile Data shape
interface UserProfileData {
    name: string;
    username: string;
    isVerified: boolean;
    bio: string;
    coverImage: string;
    avatarImage: string;
    jobTitle: string; // Used for "College name" as per requirement
    location: string;
    website: string;
    joinDate: string;
}

export default function ProfileScreen() {
    // Default profile - used only for first-time launch
    const DEFAULT_PROFILE: UserProfileData = {
        name: 'Stas Neprokin',
        username: 'sneprokin',
        isVerified: true,
        bio: 'Designing Products that Users Love',
        coverImage: 'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?q=80&w=2070&auto=format&fit=crop',
        avatarImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1974&auto=format&fit=crop',
        jobTitle: 'Entrepreneur',
        location: 'Earth',
        website: 'neprokin.com',
        joinDate: 'November 2010',
    };

    const [userData, setUserData] = useState<UserProfileData>(DEFAULT_PROFILE);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<UserProfileData>(userData);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    const { logout } = useAuth();
    const { posts } = useFeed();
    const router = useRouter();

    const handleLogout = async () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace('/login');
                    }
                }
            ]
        );
    };

    // Load profile from AsyncStorage on first mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const saved = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
                if (saved) {
                    const parsed: UserProfileData = JSON.parse(saved);
                    setUserData(parsed);
                    setEditForm(parsed);
                }
            } catch (e) {
                console.error('Failed to load profile from storage:', e);
            } finally {
                setIsLoadingProfile(false);
            }
        };
        loadProfile();
    }, []);

    const handleEditOpen = () => {
        setEditForm(userData); // Load current data into form
        setIsEditing(true);
    };

    const handleSaveProfile = async () => {
        try {
            // Persist the updated profile data (including Cloudinary URLs) to AsyncStorage
            await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(editForm));
        } catch (e) {
            console.error('Failed to save profile to storage:', e);
        }
        setUserData(editForm); // Update UI state
        setIsEditing(false);
    };

    const pickImage = async (field: 'avatarImage' | 'coverImage') => {
        // Launch the device's image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: field === 'avatarImage' ? [1, 1] : [16, 9],
            quality: 0.8,
            base64: true, // Request base64 data for Cloudinary upload
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];

            // Immediately show a local preview for a snappy UX
            setEditForm(prev => ({ ...prev, [field]: asset.uri }));

            if (!asset.base64) {
                Alert.alert('Upload Error', 'Could not read image data. Please try again.');
                return;
            }

            try {
                setIsUploading(true);
                setUploadingField(field);

                // Upload to Cloudinary via the secure API route
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        imageBase64: `data:image/jpeg;base64,${asset.base64}`,
                        folder: 'PlacementPro_Uploads',
                    }),
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const data = await response.json();

                if (data.url) {
                    // Replace local URI with the persisted Cloudinary URL
                    setEditForm(prev => ({ ...prev, [field]: data.url }));
                } else {
                    throw new Error('No URL returned from upload');
                }
            } catch (error) {
                console.error('Image upload error:', error);
                Alert.alert('Upload Failed', 'Could not upload image to cloud. The local image will be used.');
            } finally {
                setIsUploading(false);
                setUploadingField(null);
            }
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

                {/* Cover Image */}
                <View style={styles.coverContainer}>
                    <Image
                        source={{ uri: userData.coverImage }}
                        style={styles.coverImage}
                    />
                </View>

                {/* Profile Header (Avatar + Actions) */}
                <View style={styles.headerContainer}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: userData.avatarImage }}
                            style={styles.avatarImage}
                        />
                    </View>

                    {/* Edit Profile Button right-aligned */}
                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity style={styles.editButton} onPress={handleEditOpen}>
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Identity & Bio Information */}
                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <Text style={styles.nameText}>{userData.name}</Text>
                        {userData.isVerified && (
                            <Ionicons name="shield-checkmark" size={18} color="#0A66C2" style={styles.verifiedIcon} />
                        )}
                    </View>

                    <Text style={styles.bioText}>{userData.bio}</Text>

                    {/* Professional Details Map */}
                    <View style={styles.detailsRow}>
                        {userData.jobTitle ? (
                            <View style={styles.detailItem}>
                                <Ionicons name="briefcase-outline" size={16} color={COLORS.textSecondary} />
                                <Text style={styles.detailText}>{userData.jobTitle}</Text>
                            </View>
                        ) : null}

                        {userData.location ? (
                            <View style={styles.detailItem}>
                                <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
                                <Text style={styles.detailText}>{userData.location}</Text>
                            </View>
                        ) : null}

                        {userData.website ? (
                            <TouchableOpacity
                                style={styles.detailItem}
                                onPress={() => {
                                    let url = userData.website;
                                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                        url = 'https://' + url;
                                    }
                                    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
                                }}
                            >
                                <Ionicons name="link-outline" size={16} color={COLORS.textSecondary} />
                                <Text style={styles.linkText}>{userData.website}</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Followers/Following Section has been REMOVED as requested */}

                </View>

                {/* Sticky Horizontal Navigation Tabs */}
                <View style={styles.navTabsContainer}>
                    <TouchableOpacity style={styles.navTabActive}>
                        <Text style={styles.navTabTextActive}>Posts</Text>
                        <View style={styles.activeIndicator} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navTab}>
                        <Text style={styles.navTabText}>Replies</Text>
                    </TouchableOpacity>
                </View>

                {/* Feed Content Area */}
                <View style={styles.feedContainer}>
                    {
                        posts.filter(p => p.shares > 0).length === 0 ? (
                            <View style={{ padding: 32, alignItems: 'center' }}>
                                <Ionicons name="repeat" size={48} color={COLORS.border} />
                                <Text style={{ color: COLORS.textSecondary, marginTop: 16 }}>Posts you repost will appear here.</Text>
                            </View>
                        ) : (
                            posts.filter(p => p.shares > 0).map(post => (
                                <View key={`shared-${post.id}`} style={styles.postContainer}>
                                    <View style={styles.repostRow}>
                                        <Ionicons name="repeat" size={14} color={COLORS.textSecondary} />
                                        <Text style={styles.repostText}>You shared</Text>
                                    </View>

                                    <View style={styles.postContentRow}>
                                        <Image
                                            source={{ uri: post.author.avatar }}
                                            style={styles.postAvatar}
                                        />
                                        <View style={styles.postBody}>
                                            <View style={styles.postHeaderLine}>
                                                <Text style={styles.postAuthorName}>{post.author.name}</Text>
                                                {post.author.role.includes('Alumni') && (
                                                    <Ionicons name="school" size={14} color="#F59E0B" style={{ marginHorizontal: 4 }} />
                                                )}
                                                <Text style={styles.postAuthorUsername}>· {post.timeAgo}</Text>
                                            </View>
                                            <Text style={styles.postText}>{post.content}</Text>
                                            {post.image && (
                                                <View style={styles.postMediaContainer}>
                                                    <Image
                                                        source={{ uri: post.image }}
                                                        style={styles.postMediaImage}
                                                    />
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            ))
                        )
                    }

                    {/* Logout Section */}
                    <View style={styles.logoutContainer}>
                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal visible={isEditing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsEditing(false)}>
                <SafeAreaView style={styles.modalContainer}>

                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <TouchableOpacity
                            onPress={() => setIsEditing(false)}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                            style={{ padding: 4 }}
                        >
                            <Text style={styles.modalCancel}>Cancel</Text>
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Edit Profile</Text>

                        <TouchableOpacity
                            onPress={handleSaveProfile}
                            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                            style={{ padding: 4 }}
                        >
                            <Text style={styles.modalSave}>Save</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Modal Form */}
                    <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">

                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput
                            style={styles.textInput}
                            value={editForm.name}
                            onChangeText={t => setEditForm({ ...editForm, name: t })}
                            placeholderTextColor={COLORS.textSecondary}
                        />

                        <Text style={styles.inputLabel}>Bio</Text>
                        <TextInput
                            style={[styles.textInput, { height: 80 }]}
                            value={editForm.bio}
                            onChangeText={t => setEditForm({ ...editForm, bio: t })}
                            multiline
                            placeholderTextColor={COLORS.textSecondary}
                        />

                        <Text style={styles.inputLabel}>Company Name / Job Title</Text>
                        <TextInput
                            style={styles.textInput}
                            value={editForm.jobTitle}
                            onChangeText={t => setEditForm({ ...editForm, jobTitle: t })}
                            placeholderTextColor={COLORS.textSecondary}
                        />

                        <Text style={styles.inputLabel}>Location</Text>
                        <TextInput
                            style={styles.textInput}
                            value={editForm.location}
                            onChangeText={t => setEditForm({ ...editForm, location: t })}
                            placeholderTextColor={COLORS.textSecondary}
                        />

                        <Text style={styles.inputLabel}>Portfolio Link</Text>
                        <TextInput
                            style={styles.textInput}
                            value={editForm.website}
                            onChangeText={t => setEditForm({ ...editForm, website: t })}
                            placeholderTextColor={COLORS.textSecondary}
                            autoCapitalize="none"
                            keyboardType="url"
                        />

                        <Text style={styles.inputLabel}>Profile Image</Text>
                        <TouchableOpacity
                            style={styles.imagePickerButton}
                            onPress={() => pickImage('avatarImage')}
                            disabled={isUploading}
                        >
                            {isUploading && uploadingField === 'avatarImage' ? (
                                <ActivityIndicator size="small" color={COLORS.accent} />
                            ) : (
                                <Ionicons name="camera-outline" size={20} color={COLORS.textPrimary} />
                            )}
                            <Text style={styles.imagePickerText}>
                                {isUploading && uploadingField === 'avatarImage' ? 'Uploading...' : 'Choose Profile Picture'}
                            </Text>
                        </TouchableOpacity>
                        {editForm.avatarImage ? <Image source={{ uri: editForm.avatarImage }} style={styles.previewAvatar} /> : null}

                        <Text style={styles.inputLabel}>Cover Image</Text>
                        <TouchableOpacity
                            style={styles.imagePickerButton}
                            onPress={() => pickImage('coverImage')}
                            disabled={isUploading}
                        >
                            {isUploading && uploadingField === 'coverImage' ? (
                                <ActivityIndicator size="small" color={COLORS.accent} />
                            ) : (
                                <Ionicons name="image-outline" size={20} color={COLORS.textPrimary} />
                            )}
                            <Text style={styles.imagePickerText}>
                                {isUploading && uploadingField === 'coverImage' ? 'Uploading...' : 'Choose Cover Photo'}
                            </Text>
                        </TouchableOpacity>
                        {editForm.coverImage ? <Image source={{ uri: editForm.coverImage }} style={styles.previewCover} /> : null}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
    },
    coverContainer: {
        width: '100%',
        height: 140, // standard Twitter banner height ratio
        backgroundColor: '#333',
    },
    coverImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        position: 'relative',
    },
    avatarContainer: {
        marginTop: -35, // Push up into cover image
        borderWidth: 4,
        borderColor: COLORS.background, // Match dark background
        borderRadius: 40,
        backgroundColor: COLORS.background,
    },
    avatarImage: {
        width: 72,
        height: 72,
        borderRadius: 36,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 12, // Align with avatar vertical space
    },
    editButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 100,
    },
    editButtonText: {
        color: COLORS.textPrimary, // White text for Edit Profile
        fontWeight: 'bold',
        fontSize: 14,
    },
    infoContainer: {
        paddingHorizontal: 16,
        marginTop: 8,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nameText: {
        color: COLORS.textPrimary,
        fontSize: 22,
        fontWeight: 'bold',
    },
    verifiedIcon: {
        marginLeft: 4,
    },
    usernameText: {
        color: COLORS.textSecondary,
        fontSize: 15,
        marginTop: 2,
    },
    bioText: {
        color: COLORS.textPrimary,
        fontSize: 15,
        marginTop: 12,
        lineHeight: 20,
    },
    detailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
        rowGap: 8, // vertical gap if wraps
        columnGap: 16, // spacing between items horizontally
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginLeft: 4,
    },
    linkText: {
        color: COLORS.accent,
        fontSize: 14,
        marginLeft: 4,
    },
    navTabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginTop: 16,
    },
    navTab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    navTabActive: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        position: 'relative',
    },
    navTabText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
        fontSize: 15,
    },
    navTabTextActive: {
        color: COLORS.textPrimary,
        fontWeight: 'bold',
        fontSize: 15,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        width: 50,
        height: 3,
        backgroundColor: COLORS.accent,
        borderRadius: 2,
    },
    feedContainer: {
        flex: 1,
    },
    postContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    repostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginLeft: 32, // Indent to align with author's name next to avatar
        marginBottom: 6,
    },
    repostText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    postContentRow: {
        flexDirection: 'row',
        gap: 10,
    },
    postAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    postBody: {
        flex: 1,
    },
    postHeaderLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    postAuthorName: {
        color: COLORS.textPrimary,
        fontWeight: 'bold',
        fontSize: 15,
    },
    postAuthorUsername: {
        color: COLORS.textSecondary,
        fontSize: 15,
        flex: 1,
    },
    postMoreIcon: {
        paddingLeft: 4,
    },
    postText: {
        color: COLORS.textPrimary,
        fontSize: 15,
        lineHeight: 22,
    },
    postMediaContainer: {
        marginTop: 12,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    postMediaImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },

    // Edit Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 20 : 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalCancel: {
        color: COLORS.textPrimary,
        fontSize: 16,
    },
    modalSave: {
        color: COLORS.accent,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContent: {
        padding: 16,
        paddingBottom: 40,
    },
    inputLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 8,
        marginTop: 16,
    },
    textInput: {
        backgroundColor: COLORS.card,
        color: COLORS.textPrimary,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: 16,
    },
    imagePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 8,
    },
    imagePickerText: {
        color: COLORS.textPrimary,
        fontSize: 16,
    },
    previewAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginTop: 12,
        alignSelf: 'center',
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    previewCover: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginTop: 12,
        resizeMode: 'cover',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    logoutContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.card,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EF444430', // Very subtle red border
        gap: 8,
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
