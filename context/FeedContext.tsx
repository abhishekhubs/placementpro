import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the shape of a Post
export interface Post {
    id: string;
    author: {
        name: string;
        role: string;
        avatar: string;
        email?: string; // Added to link mentorship slots
    };
    timeAgo: string;
    content: string;
    image: string | null;
    link?: string | null;
    likes: number;
    comments: { id: string; text: string; authorName: string }[];
    shares: number;
    repostedBy?: string[]; // Array of names who reposted this
    postType?: 'achievement' | 'internship' | 'certificate' | 'skill' | 'general';
    isStudentPost?: boolean;
}

// Initial Mock Data (moved from home.tsx)
const INITIAL_POSTS: Post[] = [
    {
        id: '1',
        author: {
            name: 'Sarah Jenkins',
            role: 'Senior Recruiter at TechCorp',
            avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        },
        timeAgo: '2 hours ago',
        content: 'We are urgently hiring for React Native developers! 🚀 If you have 2+ years of experience and love building beautiful mobile apps, drop a comment or DM me. #hiring #reactnative #jobs',
        image: null,
        link: 'https://careers.techcorp.com',
        likes: 124,
        comments: [
            { id: 'c1', text: 'Interested! Sent you a DM.', authorName: 'Alex Rivera' }
        ],
        shares: 12,
    },
    {
        id: '2',
        author: {
            name: 'Alex Rivera',
            role: 'Recent CS Graduate',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        },
        timeAgo: '5 hours ago',
        content: 'Just finished my final round interview with Google! The preparation finally paid off. Thank you to everyone who helped me with mock interviews on this platform. 🙏',
        image: 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80&w=800',
        link: null,
        likes: 543,
        comments: [],
        shares: 4,
    },
    {
        id: '3',
        author: {
            name: 'PlacementPro Admin',
            role: 'System Updates',
            avatar: 'https://ui-avatars.com/api/?name=Placement+Pro&background=6C7FD8&color=fff',
        },
        timeAgo: '1 day ago',
        content: '📢 Important update for all upcoming campus drives! Make sure your resume is updated to the latest format within the next 48 hours to be automatically shortlisted.',
        image: null,
        link: null,
        likes: 89,
        comments: [],
        shares: 34,
    }
];

interface FeedContextType {
    posts: Post[];
    addPost: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'shares' | 'timeAgo'>) => void;
    deletePost: (id: string) => void;
    toggleLike: (id: string) => void;
    addComment: (id: string, text: string, authorName?: string) => void;
    sharePost: (id: string, userName?: string) => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

const FEED_STORAGE_KEY = 'placementpro_posts';

export function useFeed() {
    const context = useContext(FeedContext);
    if (context === undefined) {
        throw new Error('useFeed must be used within a FeedProvider');
    }
    return context;
}

export function FeedProvider({ children }: { children: React.ReactNode }) {
    const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);

    // Load posts from AsyncStorage
    useEffect(() => {
        const loadPosts = async () => {
            try {
                const savedPosts = await AsyncStorage.getItem(FEED_STORAGE_KEY);
                if (savedPosts) {
                    setPosts(JSON.parse(savedPosts));
                }
            } catch (e) {
                console.error('Failed to load posts', e);
            }
        };
        loadPosts();
    }, []);

    // Save posts whenever they change
    useEffect(() => {
        const savePosts = async () => {
            try {
                await AsyncStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(posts));
            } catch (e) {
                console.error('Failed to save posts', e);
            }
        };
        if (posts !== INITIAL_POSTS) {
            savePosts();
        }
    }, [posts]);

    const addPost = (postData: Omit<Post, 'id' | 'likes' | 'comments' | 'shares' | 'timeAgo'>) => {
        const newPost: Post = {
            ...postData,
            id: Date.now().toString(),
            timeAgo: 'Just now',
            likes: 0,
            comments: [],
            shares: 0,
        };
        // Add new post to the top of the feed
        setPosts((currentPosts) => [newPost, ...currentPosts]);
    };

    const deletePost = (id: string) => {
        setPosts((currentPosts) => currentPosts.filter(post => post.id !== id));
    };

    const toggleLike = (id: string) => {
        setPosts((currentPosts) =>
            currentPosts.map(post =>
                post.id === id ? { ...post, likes: post.likes + 1 } : post
            )
        );
    };

    const addComment = (id: string, text: string, authorName: string = 'Anonymous') => {
        setPosts((currentPosts) =>
            currentPosts.map(post => {
                if (post.id === id) {
                    const newComment = {
                        id: Date.now().toString(),
                        text: text,
                        authorName: authorName
                    };
                    return { ...post, comments: [...post.comments, newComment] };
                }
                return post;
            })
        );
    };

    const sharePost = (id: string, userName: string = 'Anonymous') => {
        setPosts((currentPosts) =>
            currentPosts.map(post => {
                if (post.id === id) {
                    const currentReposts = post.repostedBy || [];
                    if (!currentReposts.includes(userName)) {
                        return {
                            ...post,
                            shares: post.shares + 1,
                            repostedBy: [...currentReposts, userName]
                        };
                    }
                }
                return post;
            })
        );
    };

    return (
        <FeedContext.Provider value={{ posts, addPost, deletePost, toggleLike, addComment, sharePost }}>
            {children}
        </FeedContext.Provider>
    );
}
