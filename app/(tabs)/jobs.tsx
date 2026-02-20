import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

export default function JobsScreen() {
    return (
        <View style={styles.container}>
            <Text>Jobs Screen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
