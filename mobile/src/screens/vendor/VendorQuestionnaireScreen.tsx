import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, CheckCircle, Upload, FileText, Image as ImageIcon, X } from 'lucide-react-native';
import { Theme } from '../../theme';
import { userAPI } from '../../services/api';
import { storageService } from '../../services/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { pick, types } from '@react-native-documents/picker';

const VendorQuestionnaireScreen = () => {
    const navigation = useNavigation();
    const [answers, setAnswers] = useState({
        experienceYears: '',
        teamSize: '',
        primaryService: '',
        availability: '',
        certifications: ''
    });
    const [documents, setDocuments] = useState<any[]>([]);
    const [uploadingDoc, setUploadingDoc] = useState(false);

    const [loading, setLoading] = useState(false);

    const uriToBase64 = async (uri: string): Promise<string> => {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleAddDocument = async () => {
        Alert.alert('Upload Document', 'Choose a format', [
            {
                text: 'Image (JPG/PNG)',
                onPress: async () => {
                    const result = await launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.9 });
                    if (!result.didCancel && result.assets?.[0]) {
                        uploadDocument(result.assets[0].uri!, result.assets[0].base64!, result.assets[0].type || 'image/jpeg', result.assets[0].fileName || 'certificate.jpg');
                    }
                }
            },
            {
                text: 'PDF Document',
                onPress: async () => {
                    try {
                        const [result] = await pick({ type: [types.pdf] });
                        if (result) {
                            const b64 = await uriToBase64(result.uri);
                            uploadDocument(result.uri, b64, 'application/pdf', result.name || 'document.pdf');
                        }
                    } catch (err) {
                        console.log('PDF Pick Cancelled');
                    }
                }
            },
            { text: 'Cancel', style: 'cancel' }
        ]);
    };

    const uploadDocument = async (uri: string, base64: string, type: string, name: string) => {
        setUploadingDoc(true);
        try {
            const fileName = `cert_${Date.now()}_${name}`;
            const result = await storageService.uploadFile('kyc-documents', `vendors/${fileName}`, base64, type);
            if (result.url) {
                setDocuments(prev => [...prev, { name, url: result.url, type }]);
            } else {
                Alert.alert('Upload Failed', result.error || 'Unknown error');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to upload document');
        } finally {
            setUploadingDoc(false);
        }
    };

    const removeDocument = (index: number) => {
        setDocuments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await userAPI.updateProfile({
                experienceYears: answers.experienceYears,
                teamSize: answers.teamSize,
                primaryService: answers.primaryService,
                availability: answers.availability,
                certifications: answers.certifications,
                // Combine existing text with document links or handle separately
                certification_docs: documents.map(d => d.url)
            });
            Alert.alert('Details Submitted', 'Thank you for providing your business details. Our team will review them shortly.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to submit details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color={Theme.colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Vendor Questionnaire</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>Please tell us more about your business to help us serve you better.</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Years of Experience</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 5"
                        placeholderTextColor="#CBD5E0"
                        keyboardType="numeric"
                        value={answers.experienceYears}
                        onChangeText={(t) => setAnswers({ ...answers, experienceYears: t })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Team Size</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 2-5 employees"
                        placeholderTextColor="#CBD5E0"
                        value={answers.teamSize}
                        onChangeText={(t) => setAnswers({ ...answers, teamSize: t })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Primary Service Specialization</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Residential Cleaning"
                        placeholderTextColor="#CBD5E0"
                        value={answers.primaryService}
                        onChangeText={(t) => setAnswers({ ...answers, primaryService: t })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Weekly Availability (Hours)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 40 hours"
                        placeholderTextColor="#CBD5E0"
                        value={answers.availability}
                        onChangeText={(t) => setAnswers({ ...answers, availability: t })}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Licenses & Certifications</Text>
                    <TextInput
                        style={[styles.input, { height: 80, paddingTop: 15, marginBottom: 15 }]}
                        placeholder="List your certificate names or IDs..."
                        placeholderTextColor="#CBD5E0"
                        multiline
                        textAlignVertical="top"
                        value={answers.certifications}
                        onChangeText={(t) => setAnswers({ ...answers, certifications: t })}
                    />

                    {/* Document Upload */}
                    <Text style={styles.smallLabel}>Upload Scanned Copies (PDF / Images)</Text>
                    <View style={styles.docsList}>
                        {documents.map((doc, idx) => (
                            <View key={idx} style={styles.docItem}>
                                {doc.type.includes('pdf') ? <FileText size={20} color={Theme.colors.brandOrange} /> : <ImageIcon size={20} color={Theme.colors.brandOrange} />}
                                <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                                <TouchableOpacity onPress={() => removeDocument(idx)}>
                                    <X size={18} color="#FF6B6B" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.uploadBtn, uploadingDoc && { opacity: 0.7 }]}
                        onPress={handleAddDocument}
                        disabled={uploadingDoc}
                    >
                        {uploadingDoc ? (
                            <ActivityIndicator size="small" color={Theme.colors.brandOrange} />
                        ) : (
                            <>
                                <Upload size={18} color={Theme.colors.brandOrange} />
                                <Text style={styles.uploadBtnText}>Add Document</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, loading && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitText}>{loading ? 'Submitting...' : 'Submit Details'}</Text>
                    {!loading && <CheckCircle size={20} color="white" style={{ marginLeft: 10 }} />}
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
    subtitle: { fontSize: 14, color: Theme.colors.textLight, marginBottom: 25, lineHeight: 20 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: Theme.colors.textDark, marginBottom: 10 },
    smallLabel: { fontSize: 13, fontWeight: '600', color: Theme.colors.textLight, marginBottom: 10 },
    input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: Theme.colors.textDark },
    
    docsList: { marginBottom: 10 },
    docItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    docName: { flex: 1, fontSize: 14, color: Theme.colors.textDark, marginLeft: 10 },
    
    uploadBtn: { borderStyle: 'dashed', borderWidth: 2, borderColor: Theme.colors.brandOrange, borderRadius: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#FFF7ED' },
    uploadBtnText: { color: Theme.colors.brandOrange, fontWeight: 'bold', fontSize: 14 },

    submitButton: { backgroundColor: Theme.colors.brandOrange, paddingVertical: 16, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: Theme.colors.brandOrange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    submitText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});

export default VendorQuestionnaireScreen;
