import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import Dashboard from '../screens/Dashboard';
import SmsImport from '../screens/SmsImport';

const Stack = createStackNavigator();

export default function AppNavigator() {
    const { token } = useAuth();

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#fff',
                },
                headerTitleStyle: {
                    fontWeight: '800',
                    color: '#1e1b4b',
                },
            }}
        >
            {token ? (
                <>
                    <Stack.Screen
                        name="Dashboard"
                        component={Dashboard}
                        options={{ title: 'Expenze' }}
                    />
                    <Stack.Screen
                        name="SmsImport"
                        component={SmsImport}
                        options={{ title: 'Smart Sync' }}
                    />
                </>
            ) : (
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />
            )}
        </Stack.Navigator>
    );
}
