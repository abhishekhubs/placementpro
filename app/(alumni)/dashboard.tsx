import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar, TextInput, Image, ActivityIndicator, Alert, Linking, Modal, KeyboardAvoidingView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Autolink from 'react-native-autolink';
import { useAuth } from '@/context/AuthContext';
import { useFeed } from '@/context/FeedContext';
import { useNotifications } from '@/context/NotificationContext';
import { useMentorship } from '@/context/MentorshipContext';
import { useRouter } from 'expo-router';

export default function AlumniDashboard() {
    const { logout, user, updateProfile } = useAuth();
    const { addPost, posts, deletePost, addComment } = useFeed();
    const { addNotification } = useNotifications();
    const { addSlot, removeSlot, getSlotsByAlumni } = useMentorship();
    const router = useRouter();

    const [postText, setPostText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);

    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    // Profile Editing State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editCompany, setEditCompany] = useState(user?.company || '');
    const [editPosition, setEditPosition] = useState(user?.position || '');
    const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Mentorship Slot State
    const [slotDay, setSlotDay] = useState('Monday');
    const [slotTime, setSlotTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isAddingSlot, setIsAddingSlot] = useState(false);
    const [showDaySelector, setShowDaySelector] = useState(false);

    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const alumniSlots = getSlotsByAlumni(user?.email || '');

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const handleUpdateProfile = async () => {
        setIsUpdatingProfile(true);
        try {
            await updateProfile({
                name: editName,
                company: editCompany,
                position: editPosition,
                avatar: editAvatar
            });
            setEditModalVisible(false);
            Alert.alert("Success", "Profile updated successfully!");
        } catch (error) {
            Alert.alert("Error", "Failed to update profile.");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const pickImageGeneric = async (onSelect: (uri: string) => void) => {
        Alert.alert(
            "Attach Image",
            "Choose an option",
            [
                {
                    text: "Camera",
                    onPress: async () => {
                        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
                        if (permissionResult.granted === false) {
                            Alert.alert(
                                "Permission Required",
                                "You need to allow camera access to take a picture.",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Open Settings", onPress: () => Linking.openSettings() }
                                ]
                            );
                            return;
                        }
                        const result = await ImagePicker.launchCameraAsync({
                            allowsEditing: true,
                            aspect: [4, 3],
                            quality: 0.2, // Extremely low quality to prevent memory crashes on weak devices/emulators
                            base64: true,
                        });
                        if (!result.canceled && result.assets && result.assets.length > 0) {
                            onSelect(`data:image/jpeg;base64,${result.assets[0].base64}`);
                        }
                    }
                },
                {
                    text: "Gallery",
                    onPress: async () => {
                        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (permissionResult.granted === false) {
                            Alert.alert(
                                "Permission Required",
                                "You need to allow photo gallery access to choose a picture.",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Open Settings", onPress: () => Linking.openSettings() }
                                ]
                            );
                            return;
                        }
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            aspect: [4, 3],
                            quality: 0.2,
                            base64: true,
                        });
                        if (!result.canceled && result.assets && result.assets.length > 0) {
                            onSelect(`data:image/jpeg;base64,${result.assets[0].base64}`);
                        }
                    }
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const pickImage = () => pickImageGeneric(setSelectedImage);
    const pickAvatar = () => pickImageGeneric(setEditAvatar);

    const handleAddLink = () => {
        if (linkUrl.trim()) {
            setShowLinkInput(false);
            // It just locks the link in state until publish
        }
    };

    const handlePostSubmit = () => {
        if (!postText.trim() && !selectedImage && !linkUrl.trim()) return;

        setIsPosting(true);

        setTimeout(() => {
            const postAuthor = {
                name: user?.name || 'Verified Alumni',
                role: user?.company ? `${user.position || 'Employee'} @ ${user.company}` : 'Verified Alumni',
                avatar: user?.avatar || 'https://randomuser.me/api/portraits/men/4.jpg',
                email: user?.email,
            };

            addPost({
                author: postAuthor,
                content: postText.trim(),
                image: selectedImage,
                link: linkUrl.trim() || null,
                likes: 0,
                comments: [],
                shares: 0,
                postType: 'general'
            } as any);

            // Fire a notification if the post looks like a job referral
            const jobKeywords = ['referral', 'hiring', 'opening', 'job', 'intern', 'opportunity', 'role', 'position', 'apply', 'recruit', 'vacancy'];
            const isJobReferral = jobKeywords.some(kw => postText.toLowerCase().includes(kw));
            if (isJobReferral) {
                addNotification({
                    type: 'job_referral',
                    title: `🔔 New Job Referral from ${postAuthor.name}!`,
                    body: postText.length > 100 ? postText.slice(0, 100) + '…' : postText,
                    avatarUrl: postAuthor.avatar,
                });
            }

            setPostText('');
            setSelectedImage(null);
            setLinkUrl('');
            setIsPosting(false);
        }, 500);
    };

    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [activePostId, setActivePostId] = useState<string | null>(null);
    const [commentText, setCommentText] = useState('');

    const handleOpenComment = (id: string) => {
        setActivePostId(id);
        setCommentText('');
        setCommentModalVisible(true);
    };

    const handleSubmitComment = () => {
        if (activePostId && commentText.trim()) {
            addComment(activePostId, commentText.trim(), user?.name || 'Verified Alumni');
            setCommentModalVisible(false);
            setCommentText('');
            Alert.alert("Success", "Your comment has been posted!");
        }
    };

    const myPosts = posts.filter(p => p.author.name === (user?.name || 'Verified Alumni'));

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={['#0F172A', '#1E293B', '#334155']} // Deeper, more sophisticated slate gradient
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.headerLeft}
                            onPress={() => {
                                setEditName(user?.name || '');
                                setEditCompany(user?.company || '');
                                setEditPosition(user?.position || '');
                                setEditAvatar(user?.avatar || '');
                                setEditModalVisible(true);
                            }}
                        >
                            <View style={styles.avatarContainer}>
                                <Image
                                    source={{ uri: user?.avatar || 'https://randomuser.me/api/portraits/men/4.jpg' }}
                                    style={styles.headerAvatar}
                                />
                                <View style={styles.onlineBadge} />
                            </View>
                            <View>
                                <Text style={styles.greetingText}>Welcome back,</Text>
                                <Text style={styles.roleName}>{user?.name || 'Verified Alumni'}</Text>
                            </View>
                        </TouchableOpacity>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.headerIconButton}
                                onPress={() => router.push('/resume-builder' as any)}
                            >
                                <Ionicons name="document-text-outline" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.headerIconButton} onPress={() => setEditModalVisible(true)}>
                                <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Post Creation Area */}
                <View style={styles.postCreatorPanel}>
                    <Text style={styles.sectionTitle}>Share a Job or Referral</Text>
                    <Text style={styles.sectionSubtitle}>Post directly to the Student feed.</Text>

                    <TextInput
                        style={[styles.postInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                        placeholder="I currently have an opening in my team at Microsoft... Paste links here!"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        value={postText}
                        onChangeText={setPostText}
                        selectionColor="#6C7FD8"
                    />

                    {/* Link Input Preview */}
                    {showLinkInput && (
                        <View style={styles.linkInputContainer}>
                            <Ionicons name="link" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
                            <TextInput
                                style={[styles.linkInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                                placeholder="https://..."
                                placeholderTextColor="#9CA3AF"
                                value={linkUrl}
                                onChangeText={setLinkUrl}
                                autoCapitalize="none"
                                keyboardType="url"
                                selectionColor="#6C7FD8"
                                autoFocus
                            />
                            <TouchableOpacity style={styles.addLinkBtn} onPress={handleAddLink}>
                                <Text style={styles.addLinkText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Image Preview */}
                    {selectedImage && (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
                                <Ionicons name="close-circle" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.postCreatorActions}>
                        <View style={styles.quickTools}>
                            <TouchableOpacity style={styles.toolIcon} onPress={() => setShowLinkInput(!showLinkInput)}>
                                <Ionicons name="link-outline" size={24} color="#10B981" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.toolIcon} onPress={pickImage}>
                                <Ionicons name="image-outline" size={24} color="#6C7FD8" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.postButton,
                                (!postText.trim() && !selectedImage) && styles.postButtonDisabled
                            ]}
                            onPress={handlePostSubmit}
                            disabled={isPosting || (!postText.trim() && !selectedImage)}
                        >
                            {isPosting ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <>
                                    <Text style={styles.postButtonText}>Publish</Text>
                                    <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Mentorship Slots Management */}
                <View style={styles.mentorshipSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Mentorship Slots</Text>
                        <TouchableOpacity style={styles.addSlotBtn} onPress={() => setIsAddingSlot(true)}>
                            <Ionicons name="add-circle" size={24} color="#6C7FD8" />
                            <Text style={styles.addSlotBtnText}>Add Slot</Text>
                        </TouchableOpacity>
                    </View>

                    {isAddingSlot && (
                        <View style={styles.addSlotForm}>
                            <View style={styles.formRow}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <Text style={styles.label}>Day</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownTrigger}
                                        onPress={() => setShowDaySelector(true)}
                                    >
                                        <Text style={styles.dropdownValue}>{slotDay}</Text>
                                        <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Time</Text>
                                    <TouchableOpacity
                                        style={styles.dropdownTrigger}
                                        onPress={() => setShowTimePicker(true)}
                                    >
                                        <Text style={styles.dropdownValue}>
                                            {slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                        <Ionicons name="time-outline" size={18} color="#94A3B8" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {showTimePicker && (
                                <DateTimePicker
                                    value={slotTime}
                                    mode="time"
                                    is24Hour={false}
                                    display="spinner"
                                    textColor="#1E293B"
                                    onChange={(event, selectedDate) => {
                                        if (Platform.OS === 'android') {
                                            setShowTimePicker(false);
                                        }
                                        if (selectedDate) setSlotTime(selectedDate);
                                    }}
                                />
                            )}
                            {Platform.OS === 'ios' && showTimePicker && (
                                <TouchableOpacity
                                    style={styles.doneBtn}
                                    onPress={() => setShowTimePicker(false)}
                                >
                                    <Text style={styles.doneBtnText}>Done</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.formActions}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddingSlot(false)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.saveSlotBtn}
                                    onPress={async () => {
                                        const timeString = slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        await addSlot(slotDay, timeString);
                                        setIsAddingSlot(false);
                                    }}
                                >
                                    <Text style={styles.saveSlotBtnText}>Save Slot</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Day Selector Modal */}
                    <Modal
                        visible={showDaySelector}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowDaySelector(false)}
                    >
                        <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setShowDaySelector(false)}
                        >
                            <View style={styles.dropdownModal}>
                                <Text style={styles.modalTitleSmall}>Select Day</Text>
                                {DAYS.map((day) => (
                                    <TouchableOpacity
                                        key={day}
                                        style={styles.dayOption}
                                        onPress={() => {
                                            setSlotDay(day);
                                            setShowDaySelector(false);
                                        }}
                                    >
                                        <Text style={[styles.dayText, slotDay === day && styles.activeDayText]}>{day}</Text>
                                        {slotDay === day && <Ionicons name="checkmark" size={20} color="#6C7FD8" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    <View style={styles.slotsList}>
                        {alumniSlots.length === 0 ? (
                            <Text style={styles.emptySlotsText}>No availability set yet.</Text>
                        ) : (
                            alumniSlots.map(slot => (
                                <View key={slot.id} style={styles.slotItem}>
                                    <View style={styles.slotInfo}>
                                        <Ionicons name="calendar-outline" size={20} color="#6C7FD8" />
                                        <View style={styles.slotMainDetails}>
                                            <Text style={styles.slotText}>{slot.day} at {slot.time}</Text>
                                            {slot.bookedBy && (
                                                <View style={styles.bookedBadge}>
                                                    <Text style={styles.bookedText}>Booked by {slot.bookedBy}</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => removeSlot(slot.id)} style={styles.removeSlotBtn}>
                                        <Ionicons name="close-circle" size={22} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                {/* Quick Stats/Actions */}
                <View style={styles.actionGrid}>
                    <View style={styles.actionCard}>
                        <Ionicons name="people-circle" size={32} color="#10B981" />
                        <Text style={styles.actionCardTitle}>Mentorships</Text>
                        <Text style={styles.actionCardValue}>{alumniSlots.filter(s => s.bookedBy).length} Active</Text>
                    </View>
                    <View style={styles.actionCard}>
                        <Ionicons name="briefcase" size={32} color="#F59E0B" />
                        <Text style={styles.actionCardTitle}>Referrals</Text>
                        <Text style={styles.actionCardValue}>{myPosts.length} Provided</Text>
                    </View>
                </View>

                {/* Your Impact (Feed restricted to own posts for context) */}
                <View style={styles.feedHeader}>
                    <Text style={styles.sectionTitle}>Your Impact</Text>
                </View>

                {myPosts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>You haven't shared any jobs or referrals yet.</Text>
                    </View>
                ) : (
                    myPosts.map(post => (
                        <View key={post.id} style={styles.postPreview}>
                            <View style={styles.postPreviewHeader}>
                                <Text style={styles.postPreviewTime}>{post.timeAgo}</Text>
                                <TouchableOpacity onPress={() => {
                                    Alert.alert(
                                        "Delete Post",
                                        "Are you sure you want to remove this post?",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Delete", style: "destructive", onPress: () => deletePost(post.id) }
                                        ]
                                    );
                                }}>
                                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                            <Autolink
                                text={post.content}
                                style={styles.postPreviewContent}
                                linkStyle={{ color: '#6C7FD8', textDecorationLine: 'none' }}
                            />
                            {post.image && (
                                <Image source={{ uri: post.image }} style={styles.postPreviewImage} />
                            )}
                            {post.link && (
                                <View style={styles.attachedLinkContainer}>
                                    <Ionicons name="link" size={16} color="#4F46E5" style={{ marginRight: 6 }} />
                                    <Autolink
                                        text={post.link}
                                        style={styles.attachedLinkText}
                                        linkStyle={{ color: '#4F46E5' }}
                                    />
                                </View>
                            )}
                            <View style={styles.postPreviewStats}>
                                <Text style={styles.postPreviewStatText}>{post.likes} Likes</Text>
                                <Text style={styles.postPreviewStatText}>{post.comments.length} Comments</Text>
                            </View>

                            {/* Render Comments within Alumni Dashboard too */}
                            {post.comments.length > 0 && (
                                <View style={styles.commentsSection}>
                                    {post.comments.map(comment => (
                                        <View key={comment.id} style={styles.commentRow}>
                                            <Text style={styles.commentAuthorName}>{comment.authorName}</Text>
                                            <Text style={styles.commentText}>{comment.text}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Quick Comment Action */}
                            <TouchableOpacity style={styles.replyButton} onPress={() => handleOpenComment(post.id)}>
                                <Ionicons name="chatbubble-outline" size={18} color="#6C7FD8" />
                                <Text style={styles.replyButtonText}>Reply to Student</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}

                <TouchableOpacity style={styles.bottomLogoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color="#EF4444" style={{ marginRight: 10 }} />
                    <Text style={styles.bottomLogoutText}>Sign Out from PlacementPro</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal visible={editModalVisible} animationType="fade" transparent={true} onRequestClose={() => setEditModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.editModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ marginBottom: 20 }}>
                            <View style={styles.modalAvatarContainer}>
                                <TouchableOpacity onPress={pickAvatar} style={styles.modalAvatarWrapper}>
                                    <Image
                                        source={{ uri: editAvatar || 'https://randomuser.me/api/portraits/men/4.jpg' }}
                                        style={styles.modalAvatar}
                                    />
                                    <View style={styles.avatarEditBadge}>
                                        <Ionicons name="camera" size={16} color="#FFFFFF" />
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.avatarHint}>Tap to change picture</Text>
                            </View>

                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter your full name"
                                placeholderTextColor="#94A3B8"
                                value={editName}
                                onChangeText={setEditName}
                            />

                            <Text style={styles.inputLabel}>Company Name</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Currently working at..."
                                placeholderTextColor="#94A3B8"
                                value={editCompany}
                                onChangeText={setEditCompany}
                            />

                            <Text style={styles.inputLabel}>Position / Role</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="e.g. Senior Software Engineer"
                                placeholderTextColor="#94A3B8"
                                value={editPosition}
                                onChangeText={setEditPosition}
                            />
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.saveButton, !editName.trim() && { opacity: 0.5 }]}
                            onPress={handleUpdateProfile}
                            disabled={isUpdatingProfile || !editName.trim()}
                        >
                            {isUpdatingProfile ? (
                                <ActivityIndicator color="#FFFFFF" size="small" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Slate 50
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    headerGradient: {
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    headerAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#0F172A',
    },
    greetingText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500',
    },
    roleName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    headerIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        padding: 10,
        backgroundColor: 'rgba(108, 127, 216, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(108, 127, 216, 0.3)',
    },
    logoutButton: {
        padding: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    scrollContent: {
        padding: 16,
    },
    postCreatorPanel: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginTop: -32, // Floating effect over header
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    postInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        fontSize: 15,
        color: '#0F172A',
        minHeight: 120,
        textAlignVertical: 'top',
    },
    linkInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    linkInput: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
    },
    addLinkBtn: {
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 8,
    },
    addLinkText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
    },
    imagePreviewContainer: {
        marginTop: 12,
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        resizeMode: 'cover',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 2,
    },
    postCreatorActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    quickTools: {
        flexDirection: 'row',
        gap: 16,
        paddingLeft: 4,
    },
    toolIcon: {
        padding: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
    },
    postButton: {
        flexDirection: 'row',
        backgroundColor: '#6C7FD8',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    postButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    postButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 15,
    },
    actionGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 24,
        alignItems: 'flex-start',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    actionCardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        marginTop: 12,
        marginBottom: 4,
    },
    actionCardValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        marginTop: 2,
    },
    feedHeader: {
        marginBottom: 12,
    },
    emptyState: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    emptyStateText: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    postPreview: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    postPreviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    postPreviewTime: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    postPreviewContent: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 24,
        marginBottom: 16,
    },
    postPreviewImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 12,
        resizeMode: 'cover',
    },
    attachedLinkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    attachedLinkText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4F46E5',
        flex: 1,
    },
    postPreviewStats: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        marginTop: 4,
    },
    postPreviewStatText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '600',
    },
    commentsSection: {
        marginTop: 16,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 16,
        gap: 12,
    },
    commentRow: {
        marginBottom: 4,
    },
    commentAuthorName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    commentText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
    },
    replyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        marginTop: 12,
        gap: 8,
    },
    replyButtonText: {
        fontSize: 14,
        color: '#6C7FD8',
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        padding: 20,
    },
    commentModal: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        width: '100%',
        maxHeight: '80%',
    },
    editModal: {
        backgroundColor: '#FFFFFF',
        width: '90%',
        maxHeight: '85%',
        borderRadius: 32,
        padding: 28,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 40,
        elevation: 15,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
        marginLeft: 4,
    },
    modalInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 14,
        color: '#0F172A',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    commentInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        color: '#0F172A',
        fontSize: 16,
        minHeight: 120,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    saveButton: {
        backgroundColor: '#6C7FD8',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    submitCommentBtn: {
        backgroundColor: '#6C7FD8',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    submitCommentText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    bottomLogoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        paddingVertical: 18,
        borderRadius: 24,
        marginTop: 8,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 2,
    },
    bottomLogoutText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    modalAvatarContainer: {
        alignItems: 'center',
        marginBottom: 28,
    },
    modalAvatarWrapper: {
        position: 'relative',
    },
    modalAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#F1F5F9',
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#6C7FD8',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },
    avatarHint: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 8,
        fontWeight: '500',
    },
    mentorshipSection: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 28,
        padding: 24,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    addSlotBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    addSlotBtnText: {
        color: '#6C7FD8',
        fontWeight: '700',
        fontSize: 14,
    },
    addSlotForm: {
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    formRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
    },
    slotInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        fontSize: 14,
        color: '#1E293B',
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
    },
    cancelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    cancelBtnText: {
        color: '#94A3B8',
        fontWeight: '600',
    },
    saveSlotBtn: {
        backgroundColor: '#6C7FD8',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        shadowColor: '#6C7FD8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveSlotBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    disabledBtn: {
        opacity: 0.5,
    },
    slotsList: {
        gap: 12,
    },
    emptySlotsText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontStyle: 'italic',
        marginTop: 10,
    },
    slotItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    slotInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        flex: 1,
    },
    slotMainDetails: {
        flex: 1,
        gap: 4,
    },
    slotText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    bookedBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    removeSlotBtn: {
        padding: 4,
        marginLeft: 8,
    },
    bookedText: {
        fontSize: 11,
        color: '#166534',
        fontWeight: '700',
    },
    dropdownTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 8,
        padding: 10,
        height: 48,
        marginTop: 4,
    },
    dropdownValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    dropdownModal: {
        backgroundColor: '#FFFFFF',
        width: '80%',
        borderRadius: 20,
        padding: 20,
        maxHeight: '60%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitleSmall: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 16,
        textAlign: 'center',
    },
    dayOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    dayText: {
        fontSize: 16,
        color: '#64748B',
    },
    activeDayText: {
        color: '#6C7FD8',
        fontWeight: '700',
    },
    doneBtn: {
        alignSelf: 'center',
        backgroundColor: '#F1F5F9',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        marginTop: 10,
    },
    doneBtnText: {
        color: '#6C7FD8',
        fontWeight: '700',
        fontSize: 14,
    },
});
