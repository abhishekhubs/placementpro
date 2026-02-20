import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Dimensions,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

const COLORS = {
    background: '#F8FAFC',
    card: '#FFFFFF',
    primary: '#1E293B',
    accent: '#6C7FD8',
    textSecondary: '#64748B',
    border: '#E2E8F0',
};

export default function ResumeBuilderScreen() {
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<'personal' | 'experience' | 'education' | 'side' | 'preview'>('personal');
    const [isGenerating, setIsGenerating] = useState(false);

    // State for resume data
    const [resumeData, setResumeData] = useState({
        personal: {
            name: '',
            email: '',
            phone: '',
            linkedin: '',
            bio: '',
            address: '',
            roleTitle: '',
            profileImage: ''
        },
        education: {
            college: '',
            degree: '',
            year: '',
            gpa: '',
            coursework: ''
        },
        sections: {
            communication: '',
            leadership: '',
            references: 'Available upon request'
        },
        experience: [
            { id: 1, role: '', company: '', period: '', description: '' }
        ],
        skills: ''
    });

    const pickProfileImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0].uri) {
            setResumeData({
                ...resumeData,
                personal: { ...resumeData.personal, profileImage: result.assets[0].uri }
            });
        }
    };

    const generatePDF = async () => {
        if (!resumeData.personal.name || !resumeData.personal.email) {
            Alert.alert("Missing Information", "Please enter your name and email at minimum.");
            return;
        }

        try {
            setIsGenerating(true);
            const html = `
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;600;800&display=swap');
      
      body {
        font-family: 'Montserrat', sans-serif;
        margin: 0;
        padding: 0;
        color: #334155;
      }
      .container {
        display: flex;
        min-height: 100vh;
      }
      .sidebar {
        width: 32%;
        background-color: #DEE4E9;
        padding: 40px 30px;
        min-height: 100vh;
      }
      .main {
        width: 68%;
        padding: 60px 40px;
      }
      .photo-container {
        width: 100%;
        aspect-ratio: 1;
        background-color: #FFFFFF;
        border: 10px solid #BCC6D0;
        margin-bottom: 40px;
        overflow: hidden;
      }
      .photo {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .side-title {
        font-size: 14px;
        font-weight: 800;
        color: #1E293B;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-top: 30px;
        margin-bottom: 15px;
        border-bottom: 1px solid #BCC6D0;
        padding-bottom: 5px;
      }
      .side-text {
        font-size: 11px;
        color: #475569;
        line-height: 1.6;
        margin-bottom: 8px;
        white-space: pre-line;
      }
      .header {
        margin-bottom: 50px;
      }
      .name {
        font-family: 'Playfair Display', serif;
        font-size: 42px;
        font-weight: 400;
        color: #000000;
        text-transform: uppercase;
        letter-spacing: 6px;
        line-height: 1.2;
        margin: 0;
      }
      .role {
        font-size: 18px;
        font-weight: 600;
        color: #334155;
        text-transform: uppercase;
        letter-spacing: 3px;
        margin-top: 25px;
      }
      .main-title {
        font-size: 16px;
        font-weight: 800;
        color: #334155;
        text-transform: uppercase;
        letter-spacing: 3px;
        margin-top: 40px;
        margin-bottom: 25px;
      }
      .divider {
        height: 1px;
        background-color: #E2E8F0;
        margin: 30px 0;
      }
      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 5px;
      }
      .item-title {
        font-size: 15px;
        font-weight: 700;
        color: #1E293B;
      }
      .item-date {
        font-size: 12px;
        color: #64748B;
        font-weight: 600;
      }
      .item-subtitle {
        font-size: 13px;
        color: #475569;
        font-style: italic;
        margin-bottom: 8px;
      }
      .item-body {
        font-size: 13px;
        color: #475569;
        line-height: 1.6;
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="sidebar">
        <div class="photo-container">
          ${resumeData.personal.profileImage ? `<img src="${resumeData.personal.profileImage}" class="photo" />` : ''}
        </div>
        
        <div class="side-title">Contact</div>
        <div class="side-text">${resumeData.personal.address || ''}</div>
        <div class="side-text">${resumeData.personal.phone || ''}</div>
        <div class="side-text">${resumeData.personal.email || ''}</div>
        <div class="side-text">${resumeData.personal.linkedin || ''}</div>
        
        ${resumeData.sections.communication ? `
          <div class="side-title">Communication</div>
          <div class="side-text">${resumeData.sections.communication}</div>
        ` : ''}
        
        ${resumeData.sections.leadership ? `
          <div class="side-title">Leadership</div>
          <div class="side-text">${resumeData.sections.leadership}</div>
        ` : ''}
        
        ${resumeData.skills ? `
          <div class="side-title">Skills</div>
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">
            ${resumeData.skills.split(',').map(s => `<span style="background: #FFFFFF; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 600;">${s.trim()}</span>`).join('')}
          </div>
        ` : ''}
      </div>
      
      <div class="main">
        <div class="header">
          <h1 class="name">${resumeData.personal.name || 'YOUR NAME'}</h1>
          <div class="role">${resumeData.personal.roleTitle || 'PROFESSIONAL TITLE'}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="main-title">Education</div>
        <div class="item-header">
          <div class="item-title">${resumeData.education.college || ''}</div>
          <div class="item-date">${resumeData.education.year || ''}</div>
        </div>
        <div class="item-subtitle">${resumeData.education.degree || ''}</div>
        <div class="item-body">${resumeData.education.coursework || ''}</div>
        
        <div class="divider"></div>
        
        <div class="main-title">Experience</div>
        ${resumeData.experience.map(exp => `
          <div class="item-header">
            <div class="item-title">${exp.role || ''} | ${exp.company || ''}</div>
            <div class="item-date">${exp.period || ''}</div>
          </div>
          <div class="item-body">${exp.description || ''}</div>
        `).join('')}
        
        <div class="divider"></div>
        
        <div class="main-title">References</div>
        <div class="item-body">${resumeData.sections.references || 'Available upon request'}</div>
      </div>
    </div>
  </body>
</html>
            `;

            const { uri } = await Print.printToFileAsync({ html });
            console.log('File has been saved to:', uri);

            if (uri) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: 'Download Resume',
                    UTI: 'com.adobe.pdf'
                });
            }
        } catch (error) {
            console.error('PDF generation error:', error);
            Alert.alert("Error", "Failed to generate PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const renderSectionTab = (id: typeof activeSection, icon: string, label: string) => (
        <TouchableOpacity
            style={[styles.tab, activeSection === id && styles.activeTab]}
            onPress={() => setActiveSection(id)}
        >
            <Ionicons name={icon as any} size={20} color={activeSection === id ? COLORS.accent : COLORS.textSecondary} />
            {activeSection === id && <Text style={styles.tabLabel}>{label}</Text>}
        </TouchableOpacity>
    );

    const renderPersonalInfo = () => (
        <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Profile Photo</Text>
                <TouchableOpacity style={styles.imagePicker} onPress={pickProfileImage}>
                    {resumeData.personal.profileImage ? (
                        <View style={styles.profileImageContainer}>
                            <Ionicons name="camera" size={20} color="#FFFFFF" style={styles.imageEditIcon} />
                        </View>
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="person-add" size={32} color={COLORS.textSecondary} />
                            <Text style={styles.imagePlaceholderText}>Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.formRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. KRISTI LAAR"
                        value={resumeData.personal.name}
                        onChangeText={(t) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, name: t } })}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Current Role / Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. REGISTERED NURSE"
                        value={resumeData.personal.roleTitle}
                        onChangeText={(t) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, roleTitle: t } })}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 111 1st Avenue, Redmond, WA 65432"
                    value={resumeData.personal.address}
                    onChangeText={(t) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, address: t } })}
                />
            </View>

            <View style={styles.formRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="email@example.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={resumeData.personal.email}
                        onChangeText={(t) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, email: t } })}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Phone</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="+91 123..."
                        keyboardType="phone-pad"
                        value={resumeData.personal.phone}
                        onChangeText={(t) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, phone: t } })}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>LinkedIn Profile (URL)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="linkedin.com/in/..."
                    autoCapitalize="none"
                    value={resumeData.personal.linkedin}
                    onChangeText={(t) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, linkedin: t } })}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Professional Summary / Objective</Text>
                <TextInput
                    style={[styles.input, { height: 100 }]}
                    placeholder="Tell us about your professional journey..."
                    multiline
                    value={resumeData.personal.bio}
                    onChangeText={(t) => setResumeData({ ...resumeData, personal: { ...resumeData.personal, bio: t } })}
                />
            </View>
        </View>
    );

    const renderEducation = () => (
        <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Education</Text>
            <Text style={styles.sectionSubtitle}>Where did you study?</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>College / University</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. S.I.T College"
                    value={resumeData.education.college}
                    onChangeText={(t) => setResumeData({ ...resumeData, education: { ...resumeData.education, college: t } })}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Degree</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Bachelor of Technology"
                    value={resumeData.education.degree}
                    onChangeText={(t) => setResumeData({ ...resumeData, education: { ...resumeData.education, degree: t } })}
                />
            </View>

            <View style={styles.formRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                    <Text style={styles.label}>Passing Year</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="2025"
                        keyboardType="number-pad"
                        value={resumeData.education.year}
                        onChangeText={(t) => setResumeData({ ...resumeData, education: { ...resumeData.education, year: t } })}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>GPA / Percentage</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="8.5 / 10"
                        value={resumeData.education.gpa}
                        onChangeText={(t) => setResumeData({ ...resumeData, education: { ...resumeData.education, gpa: t } })}
                    />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Relevant Coursework</Text>
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="e.g. Anatomy and physiology, pharmacology..."
                    multiline
                    value={resumeData.education.coursework}
                    onChangeText={(t) => setResumeData({ ...resumeData, education: { ...resumeData.education, coursework: t } })}
                />
            </View>
        </View>
    );

    const renderExperience = () => (
        <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Experience & References</Text>
            <Text style={styles.sectionSubtitle}>Detail your professional work history.</Text>

            {resumeData.experience.map((exp, index) => (
                <View key={index} style={styles.expItem}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Company / Organization</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Wholeness Healthcare"
                            value={exp.company}
                            onChangeText={(t) => {
                                const newExp = [...resumeData.experience];
                                newExp[index].company = t;
                                setResumeData({ ...resumeData, experience: newExp });
                            }}
                        />
                    </View>
                    <View style={styles.formRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                            <Text style={styles.label}>Role / Position</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Registered Nurse"
                                value={exp.role}
                                onChangeText={(t) => {
                                    const newExp = [...resumeData.experience];
                                    newExp[index].role = t;
                                    setResumeData({ ...resumeData, experience: newExp });
                                }}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>Period</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Nov 20XX - Oct 20XX"
                                value={exp.period}
                                onChangeText={(t) => {
                                    const newExp = [...resumeData.experience];
                                    newExp[index].period = t;
                                    setResumeData({ ...resumeData, experience: newExp });
                                }}
                            />
                        </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Achievements / Description</Text>
                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="Describe your impact..."
                            multiline
                            value={exp.description}
                            onChangeText={(t) => {
                                const newExp = [...resumeData.experience];
                                newExp[index].description = t;
                                setResumeData({ ...resumeData, experience: newExp });
                            }}
                        />
                    </View>
                </View>
            ))}

            <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setResumeData({
                    ...resumeData,
                    experience: [...resumeData.experience, { id: Date.now(), company: '', role: '', period: '', description: '' }]
                })}
            >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.accent} />
                <Text style={styles.addBtnText}>Add Experience</Text>
            </TouchableOpacity>

            <View style={[styles.inputGroup, { marginTop: 24 }]}>
                <Text style={styles.label}>References</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Available upon request"
                    value={resumeData.sections.references}
                    onChangeText={(t) => setResumeData({ ...resumeData, sections: { ...resumeData.sections, references: t } })}
                />
            </View>
        </View>
    );

    const renderSideSections = () => (
        <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Extra Sections</Text>
            <Text style={styles.sectionSubtitle}>Communication and Leadership highlights.</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Communication Section</Text>
                <TextInput
                    style={[styles.input, { height: 100 }]}
                    placeholder="Highlight your communication skills or awards..."
                    multiline
                    value={resumeData.sections.communication}
                    onChangeText={(t) => setResumeData({ ...resumeData, sections: { ...resumeData.sections, communication: t } })}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Leadership Section</Text>
                <TextInput
                    style={[styles.input, { height: 100 }]}
                    placeholder="Describe your leadership roles or awards..."
                    multiline
                    value={resumeData.sections.leadership}
                    onChangeText={(t) => setResumeData({ ...resumeData, sections: { ...resumeData.sections, leadership: t } })}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Technical Skills</Text>
                <TextInput
                    style={[styles.input, { height: 100 }]}
                    placeholder="e.g. JavaScript, React, SQL..."
                    multiline
                    value={resumeData.skills}
                    onChangeText={(t) => setResumeData({ ...resumeData, skills: t })}
                />
                <Text style={styles.hint}>Separate with commas</Text>
            </View>
        </View>
    );

    const renderPreview = () => (
        <View style={styles.previewContainer}>
            <View style={styles.previewPaper}>
                {/* Left Sidebar */}
                <View style={styles.previewSidebar}>
                    <View style={styles.previewPhotoContainer}>
                        {resumeData.personal.profileImage ? (
                            <Image source={{ uri: resumeData.personal.profileImage }} style={styles.previewPhoto} />
                        ) : (
                            <View style={styles.previewPhotoPlaceholder} />
                        )}
                    </View>

                    <Text style={styles.sideSectionTitle}>CONTACT</Text>
                    <Text style={styles.sideText}>{resumeData.personal.address || 'Address line 1\nCity, State Zip'}</Text>
                    <Text style={styles.sideText}>{resumeData.personal.phone || '555.0100'}</Text>
                    <Text style={styles.sideText}>{resumeData.personal.email || 'email@example.com'}</Text>
                    <Text style={styles.sideText}>{resumeData.personal.linkedin || 'www.linkedin.com'}</Text>

                    <View style={styles.sideDivider} />

                    <Text style={styles.sideSectionTitle}>COMMUNICATION</Text>
                    <Text style={styles.sideText}>{resumeData.sections.communication || 'Communication highlights...'}</Text>

                    <View style={styles.sideDivider} />

                    <Text style={styles.sideSectionTitle}>LEADERSHIP</Text>
                    <Text style={styles.sideText}>{resumeData.sections.leadership || 'Leadership highlights...'}</Text>

                    <View style={styles.sideDivider} />

                    <Text style={styles.sideSectionTitle}>SKILLS</Text>
                    <View style={styles.previewSkillsContainer}>
                        {(resumeData.skills || '').split(',').map((skill, i) => skill.trim() ? (
                            <View key={i} style={styles.skillBadge}>
                                <Text style={styles.skillBadgeText}>{skill.trim()}</Text>
                            </View>
                        ) : null)}
                    </View>
                </View>

                {/* Right Content */}
                <View style={styles.previewMain}>
                    <View style={styles.previewHeader}>
                        <Text style={styles.mainName}>{resumeData.personal.name || 'KRISTI LAAR'}</Text>
                        <Text style={styles.mainRole}>{resumeData.personal.roleTitle || 'REGISTERED NURSE'}</Text>
                    </View>

                    <View style={styles.mainDivider} />

                    <Text style={styles.mainSectionTitle}>EDUCATION</Text>
                    <Text style={styles.itemTitle}>{resumeData.education.college || 'Bellows College'} | {resumeData.education.year || 'City, ST'}</Text>
                    <Text style={styles.itemSubtitle}>{resumeData.education.degree || 'Bachelors of Science'}</Text>
                    {resumeData.education.coursework && (
                        <Text style={styles.itemBody}>Relevant coursework: {resumeData.education.coursework}</Text>
                    )}

                    <View style={styles.mainDivider} />

                    <Text style={styles.mainSectionTitle}>EXPERIENCE</Text>
                    {resumeData.experience.map((exp, i) => (
                        <View key={i} style={styles.mainItem}>
                            <Text style={styles.itemDate}>{exp.period || 'Month 20XX - Month 20XX'}</Text>
                            <Text style={styles.itemTitle}>{exp.role || 'Role Title'} | {exp.company || 'Company Name'}</Text>
                            <Text style={styles.itemBody}>{exp.description || 'Job description highlights...'}</Text>
                        </View>
                    ))}

                    <View style={styles.mainDivider} />

                    <Text style={styles.mainSectionTitle}>REFERENCES</Text>
                    <Text style={styles.itemBody}>{resumeData.sections.references}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#1E293B', '#334155']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Resume Builder</Text>
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={generatePDF}
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Ionicons name="cloud-upload-outline" size={22} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </LinearGradient>

            <View style={styles.tabBar}>
                {renderSectionTab('personal', 'person-outline', 'Contact')}
                {renderSectionTab('experience', 'briefcase-outline', 'Work')}
                {renderSectionTab('education', 'school-outline', 'Study')}
                {renderSectionTab('side', 'star-outline', 'Extras')}
                {renderSectionTab('preview', 'eye-outline', 'View')}
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {activeSection === 'personal' && renderPersonalInfo()}
                    {activeSection === 'experience' && renderExperience()}
                    {activeSection === 'education' && renderEducation()}
                    {activeSection === 'side' && renderSideSections()}
                    {activeSection === 'preview' && renderPreview()}
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                {activeSection === 'preview' ? (
                    <TouchableOpacity
                        style={[styles.downloadBtn, isGenerating && { opacity: 0.7 }]}
                        onPress={generatePDF}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                        )}
                        <Text style={styles.downloadBtnText}>
                            {isGenerating ? 'Generating PDF...' : 'Generate Resume PDF'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.nextBtn}
                        onPress={() => {
                            if (activeSection === 'personal') setActiveSection('experience');
                            else if (activeSection === 'experience') setActiveSection('education');
                            else if (activeSection === 'education') setActiveSection('side');
                            else if (activeSection === 'side') setActiveSection('preview');
                        }}
                    >
                        <Text style={styles.nextBtnText}>Next Section</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    backBtn: {
        padding: 4,
    },
    saveBtn: {
        padding: 4,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        justifyContent: 'space-around',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        gap: 8,
    },
    activeTab: {
        backgroundColor: 'rgba(108, 127, 216, 0.15)',
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.accent,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    formSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        color: COLORS.primary,
    },
    formRow: {
        flexDirection: 'row',
    },
    hint: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 8,
        marginLeft: 4,
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    downloadBtn: {
        backgroundColor: COLORS.accent,
        flexDirection: 'row',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    downloadBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    nextBtn: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    nextBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    imagePicker: {
        height: 120,
        width: 120,
        borderRadius: 60,
        backgroundColor: '#F1F5F9',
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 10,
        overflow: 'hidden',
    },
    imagePlaceholder: {
        alignItems: 'center',
        gap: 4,
    },
    imagePlaceholderText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    profileImageContainer: {
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageEditIcon: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
        borderRadius: 12,
    },
    expItem: {
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.accent,
        borderStyle: 'dashed',
        gap: 8,
    },
    addBtnText: {
        color: COLORS.accent,
        fontSize: 14,
        fontWeight: '700',
    },
    previewContainer: {
        flex: 1,
    },
    previewPaper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        flexDirection: 'row',
        minHeight: 800,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        overflow: 'hidden',
    },
    previewSidebar: {
        width: '35%',
        backgroundColor: '#DEE4E9',
        padding: 20,
    },
    previewMain: {
        width: '65%',
        padding: 30,
    },
    previewPhotoContainer: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 8,
        borderColor: '#BCC6D0',
        marginBottom: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewPhoto: {
        width: '100%',
        height: '100%',
    },
    previewPhotoPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#CBD5E1',
    },
    sideSectionTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: 1.5,
        marginBottom: 15,
        marginTop: 5,
    },
    sideText: {
        fontSize: 11,
        color: '#334155',
        lineHeight: 18,
        marginBottom: 4,
    },
    sideDivider: {
        height: 1,
        backgroundColor: '#BCC6D0',
        marginVertical: 20,
    },
    previewHeader: {
        marginTop: 20,
        marginBottom: 40,
    },
    mainName: {
        fontSize: 32,
        fontWeight: '300',
        color: '#000000',
        letterSpacing: 4,
        lineHeight: 42,
    },
    mainRole: {
        fontSize: 16,
        fontWeight: '600',
        color: '#334155',
        letterSpacing: 2,
        marginTop: 20,
        textTransform: 'uppercase',
    },
    mainDivider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 25,
    },
    mainSectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#334155',
        letterSpacing: 2,
        marginBottom: 20,
    },
    itemTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    itemSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 10,
    },
    itemBody: {
        fontSize: 12,
        color: '#475569',
        lineHeight: 18,
        marginBottom: 15,
    },
    mainItem: {
        marginBottom: 20,
    },
    itemDate: {
        fontSize: 11,
        color: '#64748B',
        marginBottom: 5,
    },
    previewSkillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 10,
    },
    skillBadge: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#BCC6D0',
    },
    skillBadgeText: {
        fontSize: 10,
        color: '#1E293B',
        fontWeight: '700',
    },
});
