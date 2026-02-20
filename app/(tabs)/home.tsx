import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Autolink from 'react-native-autolink';
import { useFeed, Post } from '@/context/FeedContext';

export default function HomeScreen() {
  const { posts, toggleLike, addComment, sharePost } = useFeed();

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Ionicons name="briefcase" size={24} color="#818CF8" />
          <Text style={styles.appName}>PlacementPro</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color="#F8FAFC" />
          <View style={styles.badge} />
        </TouchableOpacity>
      </View>

      {/* Create Post Section */}
      <View style={styles.createPostContainer}>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }} // Mock current user
          style={styles.currentUserAvatar}
        />
        <View style={styles.createPostBox}>
          <TextInput
            placeholder="Share an update or job..."
            placeholderTextColor="#94A3B8"
            style={styles.createPostInput}
          />
          <TouchableOpacity style={styles.postButton}>
            <Ionicons name="send" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPost = ({ item }: { item: Post }) => {
    const isAlumniPost = item.author.role.includes('Alumni');

    return (
      <View style={styles.postContainer}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Image source={{ uri: item.author.avatar }} style={styles.avatar} />
          <View style={styles.authorInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.authorName}>{item.author.name}</Text>
              {isAlumniPost && <Ionicons name="school" size={14} color="#F59E0B" style={{ marginLeft: 6 }} />}
            </View>
            <Text style={styles.authorRole}>{item.author.role}</Text>
            <Text style={styles.timeAgo}>{item.timeAgo}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <Autolink
          text={item.content}
          style={styles.postText}
          linkStyle={{ color: '#60A5FA', textDecorationLine: 'none' }}
        />

        {item.image && (
          <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
        )}

        {item.link && (
          <View style={styles.attachedLinkContainer}>
            <Ionicons name="link" size={16} color="#4F46E5" style={{ marginRight: 6 }} />
            <Autolink
              text={item.link}
              style={styles.attachedLinkText}
              linkStyle={{ color: '#4F46E5' }}
            />
          </View>
        )}

        {/* Post Stats */}
        <View style={styles.postStats}>
          <Text style={styles.statsText}>{item.likes} Likes</Text>
          <View style={styles.statsRight}>
            <Text style={styles.statsText}>{item.comments.length} Comments</Text>
            <Text style={styles.statsText}> • {item.shares} Reposts</Text>
          </View>
        </View>

        {/* Render Comments */}
        {item.comments.length > 0 && (
          <View style={styles.commentsSection}>
            {item.comments.map(comment => (
              <View key={comment.id} style={styles.commentRow}>
                <Text style={styles.commentAuthorName}>{comment.authorName}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(item.id)}>
            <Ionicons name="thumbs-up-outline" size={20} color="#94A3B8" />
            <Text style={styles.actionText}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenComment(item.id)}>
            <Ionicons name="chatbubble-outline" size={20} color="#94A3B8" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => {
            sharePost(item.id);
            Alert.alert("Reposted!", "This post has been reposted to your Student Profile.");
          }}>
            <Ionicons name="repeat" size={20} color="#94A3B8" />
            <Text style={styles.actionText}>Repost</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const [commentModalVisible, setCommentModalVisible] = React.useState(false);
  const [activePostId, setActivePostId] = React.useState<string | null>(null);
  const [commentText, setCommentText] = React.useState('');

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        style={styles.container}
      />

      <Modal visible={commentModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCommentModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.commentModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a Comment</Text>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.commentInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Type your comment..."
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
    backgroundColor: '#0F172A', // Slate 900
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    backgroundColor: '#1E293B', // Slate 800
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155', // Slate 700
    marginBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC', // Slate 50
    marginLeft: 8,
    letterSpacing: -0.5,
  },
  iconButton: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    backgroundColor: '#EF4444',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  createPostContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  currentUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  createPostBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155', // Slate 700 input BG
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 46,
  },
  createPostInput: {
    flex: 1,
    fontSize: 15,
    color: '#F8FAFC',
  },
  postButton: {
    backgroundColor: '#818CF8', // Lighter Indigo
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  postContainer: {
    backgroundColor: '#1E293B',
    marginBottom: 8,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  alumniPostHighlight: {
    borderColor: '#F59E0B',
    borderLeftWidth: 4,
  },
  postHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  authorRole: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  postText: {
    fontSize: 15,
    color: '#E2E8F0',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#334155',
    marginBottom: 12,
  },
  attachedLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B', // Very dark indigo to match dark theme
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3730A3',
  },
  attachedLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#818CF8', // Lighter indigo for dark theme readability
    flex: 1,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  statsText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  statsRight: {
    flexDirection: 'row',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Dark slate transparent
  },
  commentModal: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 300,
    borderTopWidth: 1,
    borderColor: '#334155',
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
    color: '#F8FAFC',
  },
  commentInput: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    color: '#F8FAFC',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#334155',
  },
  submitCommentBtn: {
    backgroundColor: '#818CF8',
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
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 4,
  },
  commentRow: {
    backgroundColor: '#334155',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  commentAuthorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  }
});
