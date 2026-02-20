import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    FlatList,
    TouchableOpacity,
    Image,
    Animated,
    SafeAreaView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Build Your Profile.',
        description: 'Create a professional profile that highlights your skills and achievements.Stand out and make a strong first impression.',
        image: require('../assets/images/teamwork.png'),
        color: '#0F172A', // Dark Slate
        accent: '#38BDF8', // Light Blue
    },
    {
        id: '2',
        title: 'Discover Opportunities',
        description: 'Explore jobs and internships tailored to your interests.Find the right opportunity to launch your career.',
        image: require('../assets/images/coworking.png'),
        color: '#0F172A',
        accent: '#A78BFA', // Purple
    },
    {
        id: '3',
        title: 'Recruit.',
        description: 'Source top talent instantly. Streamline your hiring process with AI-driven applicant tracking.',
        image: require('../assets/images/recruiting.png'),
        color: '#0F172A',
        accent: '#34D399', // Emerald
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

    // Subtle background color animation
    const backgroundColor = scrollX.interpolate({
        inputRange: [0, width, width * 2],
        outputRange: ['#F8FAFC', '#F8FAFC', '#F8FAFC'],
    });

    const viewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems[0]?.index !== null && viewableItems[0]?.index !== undefined) {
            setCurrentIndex(viewableItems[0].index);
            if (Platform.OS !== 'web') {
                Haptics.selectionAsync();
            }
        }
    }).current;

    const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const scrollToNext = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            router.replace('/(tabs)/home');
        }
    };

    const skip = () => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.replace('/(tabs)/home');
    };

    const renderItem = ({ item, index }: any) => {
        const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width
        ];

        const imageScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp'
        });

        const imageTranslateY = scrollX.interpolate({
            inputRange,
            outputRange: [40, 0, 40],
            extrapolate: 'clamp'
        });

        const textTranslateY = scrollX.interpolate({
            inputRange,
            outputRange: [50, 0, 50],
            extrapolate: 'clamp'
        });

        const textOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp'
        });

        return (
            <View style={styles.slide}>
                <Animated.View style={[styles.imageContainer, { transform: [{ scale: imageScale }, { translateY: imageTranslateY }] }]}>
                    <View style={styles.imageBackgroundCircle}>
                        <Image
                            source={item.image}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>
                </Animated.View>

                <Animated.View style={[styles.textContainer, { opacity: textOpacity, transform: [{ translateY: textTranslateY }] }]}>
                    <View style={styles.badgeContainer}>
                        <View style={[styles.badgeDot, { backgroundColor: item.accent }]} />
                        <Text style={styles.badgeText}>Step {index + 1} of 3</Text>
                    </View>
                    <Text style={[styles.title, { color: item.color }]}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </Animated.View>
            </View>
        );
    };

    const Paginator = ({ data }: { data: any[] }) => {
        return (
            <View style={styles.paginatorContainer}>
                {data.map((_, i) => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [8, 32, 8],
                        extrapolate: 'clamp',
                    });

                    const backgroundColor = scrollX.interpolate({
                        inputRange,
                        outputRange: ['#E2E8F0', '#0F172A', '#E2E8F0'],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={i.toString()}
                            style={[
                                styles.dot,
                                { width: dotWidth, backgroundColor },
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <Animated.View style={[styles.container, { backgroundColor }]}>
            <SafeAreaView style={{ flex: 1 }}>

                {/* Header Actions */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={skip}
                        style={styles.skipButton}
                        activeOpacity={0.6}
                    >
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Slider */}
                <View style={{ flex: 1 }}>
                    <Animated.FlatList
                        ref={slidesRef}
                        data={SLIDES}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        pagingEnabled
                        bounces={false}
                        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                            useNativeDriver: false,
                        })}
                        scrollEventThrottle={32}
                        onViewableItemsChanged={viewableItemsChanged}
                        viewabilityConfig={viewConfig}
                    />
                </View>

                {/* Footer Controls */}
                <View style={styles.footer}>
                    <View style={styles.paginationWrapper}>
                        <Paginator data={SLIDES} />
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.button, {
                            backgroundColor: currentIndex === SLIDES.length - 1 ? '#0F172A' : '#F1F5F9',
                        }]}
                        onPress={scrollToNext}
                    >
                        <Text style={[
                            styles.buttonText,
                            { color: currentIndex === SLIDES.length - 1 ? '#FFFFFF' : '#0F172A' }
                        ]}>
                            {currentIndex === SLIDES.length - 1 ? "Get Started" : "Continue"}
                        </Text>

                        <Ionicons
                            name={currentIndex === SLIDES.length - 1 ? "arrow-forward" : "arrow-forward"}
                            size={20}
                            color={currentIndex === SLIDES.length - 1 ? "#FFFFFF" : "#0F172A"}
                            style={styles.buttonIcon}
                        />
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
        zIndex: 10,
    },
    skipButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    skipText: {
        fontSize: 15,
        color: '#94A3B8',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    slide: {
        width,
        alignItems: 'center',
    },
    imageContainer: {
        flex: 0.55,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    imageBackgroundCircle: {
        width: width * 0.85,
        height: width * 0.85,
        borderRadius: (width * 0.85) / 2,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.08,
        shadowRadius: 40,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    image: {
        width: '75%',
        height: '75%',
    },
    textContainer: {
        flex: 0.45,
        width: '100%',
        alignItems: 'flex-start',
        paddingTop: 40,
        paddingHorizontal: 32,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginBottom: 20,
    },
    badgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 40,
        fontWeight: '900',
        marginBottom: 16,
        letterSpacing: -1,
        lineHeight: 48,
    },
    description: {
        fontSize: 17,
        color: '#64748B',
        lineHeight: 28,
        fontWeight: '400',
        letterSpacing: 0.2,
    },
    footer: {
        paddingHorizontal: 32,
        paddingBottom: Platform.OS === 'ios' ? 10 : 32,
        paddingTop: 16,
        width: '100%',
    },
    paginationWrapper: {
        marginBottom: 32,
        alignItems: 'flex-start',
    },
    paginatorContainer: {
        flexDirection: 'row',
        height: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    button: {
        width: '100%',
        height: 60,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    buttonIcon: {
        marginLeft: 8,
        marginTop: 2,
    }
});
