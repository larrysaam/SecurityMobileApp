import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';
import { useAuth } from '../store/AuthContext';
import ConnectionTest from '../components/ConnectionTest';

const SimpleLoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('agent@bahin.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    console.log('🔐 Login attempt with:', { email, password: password.substring(0, 3) + '***' });
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        // Navigate based on user role
        switch (result.user.role) {
          case 'admin':
            navigation.replace('AdminDashboardMain');
            break;
          case 'supervisor':
            navigation.replace('SupervisorDashboard');
            break;
          case 'agent':
            navigation.replace('AgentDashboard');
            break;
          case 'client':
            navigation.replace('ClientDashboard');
            break;
          default:
            Alert.alert('Error', 'Unknown user role');
        }
      } else {
        Alert.alert('Error', result.error || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="shield-checkmark" size={60} color={COLORS.WHITE} />
        </View>
        <Text style={styles.appName}>BahinLink</Text>
        <Text style={styles.tagline}>Security Management System</Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={COLORS.GRAY[400]} />
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.GRAY[400]} />
            <TextInput
              style={styles.input}
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={COLORS.GRAY[400]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        {/* Connection Status */}
        <ConnectionTest />

        {/* Demo Info */}
        <View style={styles.demoInfo}>
          <Text style={styles.demoTitle}>🚀 Demo Credentials</Text>
          <Text style={styles.demoText}>Admin: admin@bahin.com</Text>
          <Text style={styles.demoText}>Supervisor: supervisor@bahin.com</Text>
          <Text style={styles.demoText}>Agent: agent@bahin.com</Text>
          <Text style={styles.demoText}>Client: client@bahin.com</Text>
          <Text style={styles.demoText}>Password: password123</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Developed by BAHIN SARL</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  header: {
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.WHITE,
    opacity: 0.9,
  },
  formContainer: {
    flex: 1,
    padding: SIZES.PADDING * 2,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.GRAY[600],
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.DARK,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GRAY[300],
    borderRadius: SIZES.BORDER_RADIUS,
    paddingHorizontal: 12,
    backgroundColor: COLORS.WHITE,
  },
  input: {
    flex: 1,
    height: SIZES.INPUT_HEIGHT,
    fontSize: 16,
    color: COLORS.DARK,
    marginLeft: 8,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: COLORS.PRIMARY,
    height: SIZES.BUTTON_HEIGHT,
    borderRadius: SIZES.BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.GRAY[400],
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  demoInfo: {
    backgroundColor: COLORS.INFO,
    padding: 16,
    borderRadius: SIZES.BORDER_RADIUS,
    marginTop: 24,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 8,
    textAlign: 'center',
  },
  demoText: {
    fontSize: 14,
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  footer: {
    alignItems: 'center',
    padding: SIZES.PADDING,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.GRAY[500],
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: COLORS.GRAY[400],
  },
});

export default SimpleLoginScreen;
