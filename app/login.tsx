import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useAuth } from '@/context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const { login, resetPassword } = useAuth();
    const [role, setRole] = useState<'Student' | 'Alumni'>('Student');
    const [username, setUsername] = useState('abhisheksit27@gmail.com');
    const [password, setPassword] = useState('1234');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Pre-fill fields for easy testing
    React.useEffect(() => {
        if (role === 'Student') {
            setUsername('abhisheksit27@gmail.com');
            setPassword('1234');
        } else if (role === 'Alumni') {
            setUsername('alumni@gmail.com');
            setPassword('1234');
        } else {
            setUsername('');
            setPassword('');
        }
    }, [role]);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setErrorMsg('Please enter your email and password.');
            return;
        }

        // Enforce strict credentials based on role
        if (role === 'Student' && (username.trim() !== 'abhisheksit27@gmail.com' || password !== '1234')) {
            setErrorMsg('Invalid Student credentials.');
            return;
        }
        if (role === 'Alumni' && (username.trim() !== 'alumni@gmail.com' || password !== '1234')) {
            setErrorMsg('Invalid Alumni credentials.');
            return;
        }

        setErrorMsg('');
        setIsLoading(true);
        try {
            await login(username.trim(), password, role);
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            // Navigation is handled automatically by the AuthContext listener in _layout.tsx
        } catch (error: any) {
            console.error('Login Error:', error);
            setErrorMsg('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!username.trim()) {
            Alert.alert('Reset Password', 'Please enter your email address in the field above first.');
            return;
        }
        try {
            await resetPassword(username.trim());
            Alert.alert('Email Sent!', `A password reset link has been sent to ${username.trim()}.`);
        } catch {
            Alert.alert('Error', 'Could not send reset email. Please check your email address.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Top Background Gradient - accurately matching the soft purple to blue */}
            <LinearGradient
                colors={['#D8B4E2', '#A3Bbf5', '#90Cbfb']} // Matching the soft purple to blue transition
                style={styles.topGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Complex overlapping SVG waves perfectly matching the design */}
            <View style={styles.curveContainer}>
                <Svg height="150" width={width} viewBox={`0 50 ${width} 150`} style={styles.svgCurve}>
                    <Defs>
                        <SvgGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor="#90Cbfb" stopOpacity="1" />
                            <Stop offset="1" stopColor="#D8B4E2" stopOpacity="1" />
                        </SvgGradient>
                    </Defs>
                    {/* Background colorful wave overlapping */}
                    <Path
                        d={`M0,60 C${width * 0.3},120 ${width * 0.6},0 ${width},60 L${width},150 L0,150 Z`}
                        fill="url(#waveGrad)"
                    />
                    {/* Foreground white solid wave */}
                    <Path
                        d={`M0,80 C${width * 0.4},140 ${width * 0.7},30 ${width},90 L${width},150 L0,150 Z`}
                        fill="#FFFFFF"
                    />
                </Svg>
            </View>

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                        <View style={styles.webContainer}>

                            {/* Header Logo */}
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('../assets/images/logo.png')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>

                            {/* Inputs Container */}
                            <View style={styles.formContainer}>

                                {/* Role Selector */}
                                <View style={styles.roleContainer}>
                                    {(['Student', 'Alumni'] as const).map((r) => (
                                        <TouchableOpacity
                                            key={r}
                                            style={[styles.roleButton, role === r && styles.roleButtonActive]}
                                            onPress={() => setRole(r)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.roleButtonText, role === r && styles.roleButtonTextActive]}>
                                                {r}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Username Input */}
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="person-outline" size={18} color="#B0B0B0" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Username / Email" // matching image placeholder
                                        placeholderTextColor="#C0C0C0"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                    {/* Logic to show a green check if username has text */}
                                    {username.length > 0 && (
                                        <View style={styles.checkCircle}>
                                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                        </View>
                                    )}
                                </View>

                                {/* Password Input */}
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={18} color="#B0B0B0" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        placeholderTextColor="#C0C0C0"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />
                                </View>

                                {/* Forgot Password - MOVED HERE */}
                                <TouchableOpacity style={styles.forgotPasswordButton} onPress={handleForgotPassword}>
                                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                </TouchableOpacity>

                                {/* Login Button */}
                                <TouchableOpacity
                                    style={styles.loginButton}
                                    onPress={handleLogin}
                                    activeOpacity={0.8}
                                    disabled={isLoading}
                                >
                                    <LinearGradient
                                        colors={['#7E8CE0', '#6C7FD8']}
                                        style={styles.loginButtonGradient}
                                        start={{ x: 3, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.loginButtonText}>Login</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Error Message */}
                                {errorMsg ? (
                                    <Text style={styles.errorText}>{errorMsg}</Text>
                                ) : null}

                            </View>

                            {/* Bottom Section (Social Logins + Signup) */}
                            <View style={styles.bottomSection}>

                                {/* Divider removed as requested */}

                                {/* Google Login Button */}
                                <View style={styles.singleSocialContainer}>
                                    <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#EF4444' }]} activeOpacity={0.8}>
                                        <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                                        <Text style={styles.socialButtonText}>Continue with Google</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Signup Prompt */}
                                <View style={styles.signupContainer}>
                                    <Text style={styles.signupText}>Dont have account? </Text>
                                    <TouchableOpacity onPress={() => router.push('/signup')}>
                                        <Text style={styles.signupLink}>Sign up</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            {/* End Web Container */}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    topGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.60, // Reduced further to ensure the sharp line is hidden beneath the SVG curve safely on all tall screens
    },
    curveContainer: {
        position: 'absolute',
        top: height * 0.55, // position matching the image's wave placement
        left: 0,
        right: 0,
        height: 150,
        width: '100%',
    },
    svgCurve: {
        width: '100%',
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 40,
    },
    webContainer: {
        width: '100%',
        maxWidth: 500, // Constrain width on Web
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 38,
        fontWeight: '900',
        color: '#000000',
        textAlign: 'center',
        marginTop: height * 0.12, // Pushed down slightly like in the image
        marginBottom: height * 0.04,
        letterSpacing: 0.5,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: height * 0.05, // Reduced space above logo
        marginBottom: 10, // Reduced space below logo
    },
    logoImage: {
        width: 250, // Increased size
        height: 250,
    },
    formContainer: {
        width: '100%',
        paddingHorizontal: 40,
        alignItems: 'center',
        marginTop: -35, // Negative margin to pull inputs up by ~1cm
    },
    roleContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        padding: 4,
        marginBottom: 20,
    },
    roleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 16,
    },
    roleButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    roleButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    roleButtonTextActive: {
        color: '#6C7FD8',
        fontWeight: '700',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        width: '100%',
        height: 52, // Slightly thinner than before
        borderRadius: 26,
        paddingHorizontal: 22,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 8,
    },
    inputIcon: {
        marginRight: 10,
        fontSize: 22, // Added to bump up the icon size
    },
    checkCircle: {
        marginLeft: 'auto',
        backgroundColor: '#6EE7B7', // Soft green matching the image
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 20, // Extra large input text
        color: '#000000',
        fontWeight: '500',
    },
    loginButton: {
        width: '100%',
        height: 52,
        marginTop: 60, // Increased to move down ~0.5 cm
        marginBottom: 20,
        shadowColor: '#6C7FD8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 10,
    },
    loginButtonGradient: {
        flex: 1,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 17, // Larger bolder button text
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    forgotPasswordButton: {
        alignSelf: 'center', // Aligns right, matching common placement under input
        paddingVertical: 5,
        paddingHorizontal: 0,
        marginTop: -13, // Tight right below the input box
        marginBottom: 5,
    },
    forgotPasswordText: {
        color: '#b70653ff',
        opacity: 0.9,
        fontSize: 18, // You already bumped this to 15, keeping it
        fontWeight: '600', // Making it a bit bolder for professionals
    },
    bottomSection: {
        width: '100%',
        paddingHorizontal: 40,
        paddingBottom: Platform.OS === 'ios' ? 10 : 20, // Reduced bottom padding
        alignItems: 'center',
        marginTop: 20, // Added some top margin to distance it from the top section slightly
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 25,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#F3F4F6', // Very subtle line
    },
    dividerText: {
        color: '#9CA3AF',
        paddingHorizontal: 15,
        fontSize: 14,
        fontWeight: '500',
    },
    singleSocialContainer: {
        width: '100%',
        marginBottom: 40,
        alignItems: 'center',
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%', // Take full width
        height: 52, // Match the height of the main Login button
        borderRadius: 26,
        shadowColor: '#EF4444', // Red shadow for Google
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    socialButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700', // Making text bolder since it's the primary alternative
        marginLeft: 12, // More gap for the bigger icon
    },
    signupContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    signupText: {
        color: '#9CA3AF',
        fontSize: 15, // Bumped
    },
    signupLink: {
        color: '#8B9DF0', // Matching purple-blue UI theme
        fontSize: 15, // Bumped
        fontWeight: '700', // Bolder link
    },
});
