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
    Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignup = () => {
        if (!fullName || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match!');
            return;
        }

        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        router.replace('/(tabs)/home'); // For now, routes to home. Update with real registration later.
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

                                {/* Full Name Input */}
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="person-outline" size={18} color="#B0B0B0" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Full Name"
                                        placeholderTextColor="#C0C0C0"
                                        value={fullName}
                                        onChangeText={setFullName}
                                        autoCapitalize="words"
                                    />
                                </View>

                                {/* Email Input */}
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="mail-outline" size={18} color="#B0B0B0" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email Address"
                                        placeholderTextColor="#C0C0C0"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                    {email.includes('@') && (
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

                                {/* Confirm Password Input */}
                                <View style={styles.inputWrapper}>
                                    <Ionicons name="lock-closed-outline" size={18} color="#B0B0B0" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#C0C0C0"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                    />
                                </View>

                                {/* Registration Button */}
                                <TouchableOpacity style={styles.loginButton} onPress={handleSignup} activeOpacity={0.8}>
                                    <LinearGradient
                                        colors={['#7E8CE0', '#6C7FD8']} // matching the soft blue-purple button color
                                        style={styles.loginButtonGradient}
                                        start={{ x: 3, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.loginButtonText}>Sign Up</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                            </View>

                            {/* Bottom Section (Login Prompt) */}
                            <View style={styles.bottomSection}>
                                <View style={styles.signupContainer}>
                                    <Text style={styles.signupText}>Already have an account? </Text>
                                    <TouchableOpacity onPress={() => router.replace('/login')}>
                                        <Text style={styles.signupLink}>Login</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

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
        height: height * 0.60,
    },
    curveContainer: {
        position: 'absolute',
        top: height * 0.55,
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
        maxWidth: 500,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 38,
        fontWeight: '900',
        color: '#000000',
        textAlign: 'center',
        marginTop: height * 0.12,
        marginBottom: height * 0.04,
        letterSpacing: 0.5,
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: height * 0.05,
        marginBottom: 10,
    },
    logoImage: {
        width: 250,
        height: 250,
    },
    formContainer: {
        width: '100%',
        paddingHorizontal: 40,
        alignItems: 'center',
        marginTop: -35,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        width: '100%',
        height: 52,
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
        fontSize: 22,
    },
    checkCircle: {
        marginLeft: 'auto',
        backgroundColor: '#6EE7B7',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 20,
        color: '#000000',
        fontWeight: '500',
    },
    loginButton: {
        width: '100%',
        height: 52,
        marginTop: 30, // Slightly less margin than login to fit more inputs
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
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    bottomSection: {
        width: '100%',
        paddingHorizontal: 40,
        paddingBottom: Platform.OS === 'ios' ? 10 : 20,
        alignItems: 'center',
        marginTop: 20,
    },
    signupContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    signupText: {
        color: '#9CA3AF',
        fontSize: 15,
    },
    signupLink: {
        color: '#8B9DF0',
        fontSize: 15,
        fontWeight: '700',
    },
});
