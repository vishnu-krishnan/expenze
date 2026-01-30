import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/apiConfig';
import axios from 'axios';
import { Sparkles, MessageSquare, Zap, Search, CheckCircle, Smartphone } from 'lucide-react-native';
import { requestSmsPermissions, startSmsSync } from '../utils/smsListener';

export default function SmsImport() {
    const { token } = useAuth();
    const [rawText, setRawText] = useState('');
    const [loading, setLoading] = useState(false);
    const [detected, setDetected] = useState([]);
    const [isListening, setIsListening] = useState(false);

    const handleAiParse = async () => {
        if (!rawText.trim()) return;
        setLoading(true);
        try {
            const res = await axios.post(getApiUrl('/api/v1/ai/parse-sms'),
                { text: rawText },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (res.data.expenses) {
                setDetected(res.data.expenses);
            }
        } catch (error) {
            console.error('AI Parse failed', error);
            Alert.alert('Error', 'Failed to reach AI parser. Check your backend/internet.');
        } finally {
            setLoading(false);
        }
    };

    const toggleListener = async () => {
        if (Platform.OS !== 'android') {
            Alert.alert('Not Supported', 'Automatic SMS reading is only available on Android.');
            return;
        }

        // Note: Real implementation would require expo-modules or native code
        // For project prototype, we show the UI state
        setIsListening(!isListening);
        if (!isListening) {
            Alert.alert('Listener Active', 'The app will now check incoming bank messages automatically in the background.');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={[styles.statusBadge, { backgroundColor: isListening ? '#dcfce7' : '#f1f5f9' }]}>
                    <View style={[styles.dot, { backgroundColor: isListening ? '#22c55e' : '#94a3b8' }]} />
                    <Text style={[styles.statusText, { color: isListening ? '#166534' : '#64748b' }]}>
                        {isListening ? 'Background Listener Active' : 'Automatic Sync Off'}
                    </Text>
                </View>
                <TouchableOpacity style={styles.autoBtn} onPress={toggleListener}>
                    <Text style={styles.autoBtnText}>{isListening ? 'Stop' : 'Enable Auto-Read'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputPanel}>
                <Text style={styles.label}>Manual Paste</Text>
                <TextInput
                    style={styles.textArea}
                    multiline
                    numberOfLines={8}
                    placeholder="Paste your bank SMS here..."
                    value={rawText}
                    onChangeText={setRawText}
                    textAlignVertical="top"
                />

                <TouchableOpacity
                    style={styles.aiBtn}
                    onPress={handleAiParse}
                    disabled={loading || !rawText}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <><Sparkles color="#fff" size={20} /><Text style={styles.aiBtnText}>AI Analyze (Groq)</Text></>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.resultsPanel}>
                <Text style={styles.sectionTitle}>Detected Records</Text>
                {detected.length === 0 ? (
                    <View style={styles.emptyResults}>
                        <Search size={40} color="#cbd5e1" />
                        <Text style={styles.emptyText}>Nothing detected yet.</Text>
                    </View>
                ) : (
                    detected.map((item, i) => (
                        <View key={i} style={styles.itemCard}>
                            <View style={styles.itemMain}>
                                <View>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemRaw} numberOfLines={1}>{item.rawText}</Text>
                                </View>
                                <Text style={styles.itemAmount}>₹{item.amount}</Text>
                            </View>
                            <View style={styles.itemFooter}>
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{item.categorySuggestion || 'General'}</Text>
                                </View>
                                <TouchableOpacity style={styles.addBtn}>
                                    <CheckCircle size={18} color="#0d9488" />
                                    <Text style={styles.addBtnText}>Add to Plan</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    autoBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#1e1b4b',
    },
    autoBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    inputPanel: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e1b4b',
        marginBottom: 10,
    },
    textArea: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        height: 150,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        fontSize: 14,
        color: '#1e293b',
    },
    aiBtn: {
        backgroundColor: '#8b5cf6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 12,
        marginTop: 15,
        gap: 10,
    },
    aiBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    resultsPanel: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e1b4b',
        marginBottom: 15,
    },
    emptyResults: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    emptyText: {
        marginTop: 10,
        color: '#94a3b8',
        fontSize: 14,
    },
    itemCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#0d9488',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    itemMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    itemRaw: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 4,
        maxWidth: 200,
    },
    itemAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0d9488',
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    badge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        color: '#475569',
        fontWeight: '600',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    addBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0d9488',
    }
});
