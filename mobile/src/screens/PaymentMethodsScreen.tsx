import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ArrowLeft, CreditCard, Plus, Trash2 } from 'lucide-react-native';
import { Theme } from '../theme';
import { userAPI } from '../services/api';
import { RootStackParamList } from '../types/navigation';

const PaymentMethodsScreen = () => {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const [methods, setMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadMethods();
        });
        return unsubscribe;
    }, [navigation]);

    const loadMethods = async () => {
        try {
            const response = await userAPI.getPaymentMethods();
            setMethods(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        navigation.navigate('AddPaymentMethod');
    };

    const handleDelete = (id: string) => {
        Alert.alert('Delete', 'Remove this payment method?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        await userAPI.deletePaymentMethod(id);
                        loadMethods();
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete');
                    }
                }
            }
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment Methods</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* Cards Section */}
                <Text style={styles.sectionTitle}>Credit / Debit Cards</Text>

                {methods.filter(m => m.type === 'card').length === 0 && (
                    <Text style={{ color: '#A0AEC0', marginBottom: 20, fontStyle: 'italic' }}>No cards added.</Text>
                )}

                {methods.filter(m => m.type === 'card').map((item) => (
                    <View key={item.id} style={styles.cardItem}>
                        <View style={styles.cardIconBox}>
                            <Image
                                source={{ uri: item.label.toLowerCase().includes('visa') ? 'https://img.icons8.com/color/48/visa.png' : 'https://img.icons8.com/color/48/mastercard.png' }}
                                style={styles.cardBrandIcon}
                            />
                        </View>
                        <View style={styles.cardDetails}>
                            <Text style={styles.cardName}>{item.label}</Text>
                            <Text style={styles.cardNumber}>**** **** **** {item.detail}</Text>
                        </View>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                            <Trash2 size={18} color="#CBD5E0" />
                        </TouchableOpacity>
                    </View>
                ))}

                {/* UPI Section */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>UPI & Wallets</Text>

                {methods.filter(m => m.type !== 'card').length === 0 && (
                    <Text style={{ color: '#A0AEC0', marginBottom: 20, fontStyle: 'italic' }}>No UPI methods added.</Text>
                )}

                {methods.filter(m => m.type !== 'card').map((item) => (
                    <View key={item.id} style={styles.cardItem}>
                        <View style={[styles.cardIconBox, { backgroundColor: '#F0F9FF' }]}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0EA5E9' }}>UPI</Text>
                        </View>
                        <View style={styles.cardDetails}>
                            <Text style={styles.cardName}>{item.label}</Text>
                            <Text style={styles.cardNumber}>{item.detail}</Text>
                        </View>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                            <Trash2 size={18} color="#CBD5E0" />
                        </TouchableOpacity>
                    </View>
                ))}

                {/* Add New Button */}
                <TouchableOpacity style={styles.addNewButton} onPress={handleAdd}>
                    <Plus size={20} color={Theme.colors.brandOrange} />
                    <Text style={styles.addNewText}>Add New Payment Method</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: Theme.colors.textDark },
    content: { padding: 20 },

    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginBottom: 15, textTransform: 'uppercase', letterSpacing: 0.5 },

    cardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    cardIconBox: { width: 50, height: 35, backgroundColor: '#F8FAFC', borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
    cardBrandIcon: { width: 30, height: 30, resizeMode: 'contain' },
    cardDetails: { flex: 1 },
    cardName: { fontSize: 16, fontWeight: 'bold', color: Theme.colors.textDark },
    cardNumber: { fontSize: 14, color: '#94A3B8', marginTop: 2 },
    deleteButton: { padding: 10 },

    addNewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 15, marginTop: 10, borderWidth: 2, borderColor: Theme.colors.brandOrange, borderStyle: 'dashed', backgroundColor: '#FFF7ED' },
    addNewText: { color: Theme.colors.brandOrange, fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
});

export default PaymentMethodsScreen;
