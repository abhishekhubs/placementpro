import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

export interface MentorshipSlot {
    id: string;
    day: string;
    time: string;
    alumniEmail: string;
    alumniName: string;
    bookedBy?: string; // Student Name
    bookedEmail?: string; // Student Email
}

interface MentorshipContextType {
    slots: MentorshipSlot[];
    addSlot: (day: string, time: string) => Promise<void>;
    removeSlot: (slotId: string) => Promise<void>;
    bookSlot: (slotId: string, studentName: string, studentEmail: string) => Promise<void>;
    getSlotsByAlumni: (email: string) => MentorshipSlot[];
    getAvailableSlots: () => MentorshipSlot[];
    getStudentBookings: (email: string) => MentorshipSlot[];
}

const MentorshipContext = createContext<MentorshipContextType | undefined>(undefined);

const STORAGE_KEY = 'placementpro_mentorship_slots';

export function useMentorship() {
    const context = useContext(MentorshipContext);
    if (context === undefined) {
        throw new Error('useMentorship must be used within a MentorshipProvider');
    }
    return context;
}

export function MentorshipProvider({ children }: { children: React.ReactNode }) {
    const [slots, setSlots] = useState<MentorshipSlot[]>([]);
    const { user } = useAuth();

    // Load slots on startup
    useEffect(() => {
        const loadSlots = async () => {
            try {
                const savedSlots = await AsyncStorage.getItem(STORAGE_KEY);
                if (savedSlots) {
                    setSlots(JSON.parse(savedSlots));
                }
            } catch (e) {
                console.error('Failed to load mentorship slots', e);
            }
        };
        loadSlots();
    }, []);

    // Save slots on change
    useEffect(() => {
        const saveSlots = async () => {
            try {
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
            } catch (e) {
                console.error('Failed to save mentorship slots', e);
            }
        };
        saveSlots();
    }, [slots]);

    const addSlot = async (day: string, time: string) => {
        if (!user || user.role !== 'Alumni') return;

        const newSlot: MentorshipSlot = {
            id: Date.now().toString(),
            day,
            time,
            alumniEmail: user.email,
            alumniName: user.name || user.email,
        };

        setSlots(prev => [...prev, newSlot]);
    };

    const removeSlot = async (slotId: string) => {
        setSlots(prev => prev.filter(s => s.id !== slotId));
    };

    const bookSlot = async (slotId: string, studentName: string, studentEmail: string) => {
        setSlots(prev => prev.map(s => {
            if (s.id === slotId && !s.bookedBy) {
                return { ...s, bookedBy: studentName, bookedEmail: studentEmail };
            }
            return s;
        }));
    };

    const getSlotsByAlumni = (email: string) => {
        return slots.filter(s => s.alumniEmail === email);
    };

    const getAvailableSlots = () => {
        return slots.filter(s => !s.bookedBy);
    };

    const getStudentBookings = (email: string) => {
        return slots.filter(s => s.bookedEmail === email);
    };

    return (
        <MentorshipContext.Provider value={{
            slots,
            addSlot,
            removeSlot,
            bookSlot,
            getSlotsByAlumni,
            getAvailableSlots,
            getStudentBookings
        }}>
            {children}
        </MentorshipContext.Provider>
    );
}
