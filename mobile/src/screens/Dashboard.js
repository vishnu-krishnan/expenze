import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/apiConfig';
import axios from 'axios';
import {
    Wallet,
    TrendingUp,
    ArrowUpCircle,
    ArrowDownCircle,
    Smartphone,
    Calendar,
    ChevronRight
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Dashboard({ navigation }) {
    const { token, logout } = useAuth();
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [monthKey] = useState(new Date().toISOString().slice(0, 7));

    const loadData = async () => {
        try {
            const res = await axios.get(getApiUrl(`/api/v1/month/${monthKey}`), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setData(res.data);
        } catch (error) {
            console.error('Dashboard load error', error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const stats = [
        { label: 'Planned', value: data?.plannedBudget || 0, icon: Calendar, color: '#6366f1' },
        { label: 'Spent', value: data?.actualSpent || 0, icon: TrendingUp, color: '#0d9488' },
        { label: 'Remaining', value: (data?.plannedBudget || 0) - (data?.actualSpent || 0), icon: Wallet, color: '#f59e0b' },
    ];

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.welcome}>Welcome back</Text>
                    <Text style={styles.title}>Overview</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
                {stats.map((stat, i) => (
                    <View key={i} style={[styles.statCard, { borderLeftColor: stat.color }]}>
                        <stat.icon size={20} color={stat.color} />
                        <Text style={styles.statLabel}>{stat.label}</Text>
                        <Text style={styles.statValue}>₹{stat.value.toLocaleString()}</Text>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
            </View>

            <TouchableOpacity
                style={[styles.actionCard, { backgroundColor: '#1e1b4b' }]}
                onPress={() => navigation.navigate('SmsImport')}
            >
                <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>Smart SMS Import</Text>
                    <Text style={styles.actionSubtitle}>Auto-detect expenses from bank SMS</Text>
                </View>
                <View style={styles.actionIcon}>
                    <Smartphone color="#fff" size={24} />
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate('MonthPlan')}
            >
                <View style={styles.actionInfo}>
                    <Text style={[styles.actionTitle, { color: '#1e293b' }]}>Monthly Plan</Text>
                    <Text style={styles.actionSubtitle}>View detailed spending</Text>
                </View>
                <View style={[styles.actionIcon, { backgroundColor: '#f1f5f9' }]}>
                    <Calendar color="#0d9488" size={24} />
                </View>
            </TouchableOpacity>

            {/* Placeholder for Recent Transactions */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Syncs</Text>
            </View>
            <View style={styles.recentSyncs}>
                <Text style={styles.noneText}>No recent messages detected.</Text>
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
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcome: {
        fontSize: 14,
        color: '#64748b',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1e1b4b',
    },
    logoutBtn: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#fee2e2',
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '700',
    },
    statsScroll: {
        paddingLeft: 20,
        marginBottom: 25,
    },
    statCard: {
        backgroundColor: '#fff',
        width: width * 0.4,
        padding: 15,
        borderRadius: 16,
        marginRight: 15,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
        marginTop: 2,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e1b4b',
    },
    actionCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 15,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    actionInfo: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentSyncs: {
        marginHorizontal: 20,
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        alignItems: 'center',
    },
    noneText: {
        color: '#94a3b8',
        fontSize: 14,
    }
});
