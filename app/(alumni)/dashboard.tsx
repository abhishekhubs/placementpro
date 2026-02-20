import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar, TextInput, Image, ActivityIndicator, Alert, Linking, Modal, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Autolink from 'react-native-autolink';
import { useAuth } from '@/context/AuthContext';
import { useFeed } from '@/context/FeedContext';
import { useRouter } from 'expo-router';

export default function AlumniDashboard() {
    const { logout, user } = useAuth();
    const { addPost, posts, deletePost, addComment } = useFeed();
    const router = useRouter();

    const [postText, setPostText] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);

    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const pickImage = async () => {
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
                            setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
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
                            setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
                        }
                    }
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

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
            addPost({
                author: {
                    name: 'You (Alumni)',
                    role: 'Verified Alumni',
                    avatar: 'https://randomuser.me/api/portraits/men/4.jpg'
                },
                content: postText,
                image: selectedImage,
                link: linkUrl.trim() || null,
            });

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
            addComment(activePostId, commentText.trim());
            setCommentModalVisible(false);
            setCommentText('');
            Alert.alert("Success", "Your comment has been posted!");
        }
    };

    const myPosts = posts.filter(p => p.author.role === 'Verified Alumni');

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={['#1E293B', '#0F172A']} // Dark slate gradient for a premium look
                style={styles.headerGradient}
            >
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="school" size={24} color="#6C7FD8" />
                        </View>
                        <View>
                            <Text style={styles.greeting}>Alumni Portal</Text>
                            <Text style={styles.roleName}>Welcome back</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
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

                {/* Quick Stats/Actions */}
                <View style={styles.actionGrid}>
                    <TouchableOpacity style={styles.actionCard}>
                        <Ionicons name="people-circle" size={32} color="#10B981" />
                        <Text style={styles.actionCardTitle}>Mentorships</Text>
                        <Text style={styles.actionCardValue}>3 Active</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionCard}>
                        <Ionicons name="briefcase" size={32} color="#F59E0B" />
                        <Text style={styles.actionCardTitle}>Referrals</Text>
                        <Text style={styles.actionCardValue}>12 Provided</Text>
                    </TouchableOpacity>
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

            </ScrollView>

            <Modal visible={commentModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCommentModalVisible(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={styles.commentModal}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Reply on Post</Text>
                            <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={24} color="#94A3B8" />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.commentInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                            placeholder="Type your response..."
                            placeholderTextColor="#94A3B8"
                            value={commentText}
                            onChangeText={setCommentText}
                            multiline
                            autoFocus
                            selectionColor="#818CF8"
                        />
                        <TouchableOpacity
                            style={[styles.submitCommentBtn, !commentText.trim() && { opacity: 0.5 }]}
                            onPress={handleSubmitComment}
                            disabled={!commentText.trim()}
                        >
                            <Text style={styles.submitCommentText}>Post Comment</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
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
        paddingBottom: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    greeting: {
        fontSize: 14,
        color: '#94A3B8',
    },
    roleName: {
        fontSize: 20,
        fontWeight: '800',
        color: '#F8FAFC',
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
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#6C7FD8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F1F5F9',
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
        minHeight: 120, // Give it more breathing room
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
        padding: 16,
        borderRadius: 16,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    actionCardTitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 12,
    },
    actionCardValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
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
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    postPreviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    postPreviewTime: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    postPreviewContent: {
        fontSize: 15,
        color: '#334155',
        lineHeight: 22,
        marginBottom: 12,
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
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    postPreviewStatText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    commentsSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    commentRow: {
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    commentAuthorName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    commentText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
    },
    replyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        marginTop: 8,
    },
    replyButtonText: {
        color: '#6C7FD8',
        fontWeight: '600',
        marginLeft: 6,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
    },
    commentModal: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        minHeight: 300,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
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
});
