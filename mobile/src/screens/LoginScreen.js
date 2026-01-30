import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Wallet } from 'lucide-react-native';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!username || !password) {
            setError('Please fill in all fields');
            return;
        }
        setLoading(true);
        setError('');
        const result = await login(username, password);
        if (!result.success) {
            setError(result.message);
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.card}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                        <Wallet color="#0d9488" size={40} />
                    </View>
                    <Text style={styles.title}>Expenze</Text>
                    <Text style={styles.subtitle}>Track your finances, simplified.</Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter username"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter password"
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: '#f0fdfa',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1e1b4b',
    },
    subtitle: {
        fontSize: 14,
        color: '#64748b',
        marginTop: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8,
    },
    input: {
        height: 50,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#1e293b',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    button: {
        height: 55,
        backgroundColor: '#0d9488',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 15,
        fontWeight: '600',
    }
});
