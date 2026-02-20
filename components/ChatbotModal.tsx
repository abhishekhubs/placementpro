import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface ChatbotModalProps {
    visible: boolean;
    onClose: () => void;
}

// Chatbot Modal component that connects to the Gemini API route.
export default function ChatbotModal({ visible, onClose }: ChatbotModalProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm your Placement Assistant. Feel free to ask me questions!",
            isUser: false,
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            isUser: true,
            timestamp: new Date()
        };

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputText('');
        setIsLoading(true);
        Keyboard.dismiss();

        try {
            // Send the entire conversation history to the API route
            // The API route handles formatting it for the Gemini SDK
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: newMessages
                }),
            });

            if (!response.ok) {
                throw new Error(`API returned status: ${response.status}`);
            }

            const data = await response.json();

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: data.text || "I'm sorry, I encountered an issue understanding that.",
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error('Chatbot API Error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm having trouble connecting to my servers right now. Please try again in a moment.",
                isUser: false,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerTitleContainer}>
                            <Ionicons name="chatbubbles" size={24} color="#1D9BF0" />
                            <Text style={styles.headerTitle}>PlacementBot</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close-circle-outline" size={28} color="#8899A6" />
                        </TouchableOpacity>
                    </View>

                    {/* Chat Messages Area */}
                    <ScrollView
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                        ref={scrollViewRef}
                    >
                        {messages.map((msg) => (
                            <View
                                key={msg.id}
                                style={[
                                    styles.messageBubble,
                                    msg.isUser ? styles.userBubble : styles.botBubble
                                ]}
                            >
                                <Text style={[styles.messageText, msg.isUser ? styles.userText : styles.botText]}>
                                    {msg.text}
                                </Text>
                                <Text style={styles.timestamp}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Loading Indicator */}
                    {isLoading && (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>The Assistant is typing...</Text>
                        </View>
                    )}

                    {/* Input Area */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Ask a question..."
                            placeholderTextColor="#8899A6"
                            multiline
                            maxLength={200}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                            onPress={handleSend}
                            disabled={!inputText.trim()}
                        >
                            <Ionicons name="send" size={20} color={isLoading ? "#8899A6" : "#FFFFFF"} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#101720', // Matching app dark theme
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2F3336',
        backgroundColor: '#151E28',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 32,
        gap: 12,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: '#1D9BF0', // Accent blue
        borderBottomRightRadius: 4,
    },
    botBubble: {
        alignSelf: 'flex-start',
        backgroundColor: '#151E28', // Dark card background
        borderWidth: 1,
        borderColor: '#2F3336',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    userText: {
        color: '#FFFFFF',
    },
    botText: {
        color: '#E1E8ED',
    },
    timestamp: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.5)',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 50 : 40, // Increased padding to move the bar up
        borderTopWidth: 1,
        borderTopColor: '#2F3336',
        backgroundColor: '#151E28',
        gap: 8,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#101720',
        color: '#FFFFFF',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        minHeight: 44,
        maxHeight: 120,
        borderWidth: 1,
        borderColor: '#2F3336',
        fontSize: 16,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1D9BF0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#2F3336',
    },
    loadingContainer: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    loadingText: {
        color: '#8899A6',
        fontSize: 12,
        fontStyle: 'italic',
    }
});
