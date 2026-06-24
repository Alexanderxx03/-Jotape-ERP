"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export type Area = "master" | "sales" | "inventory" | "salida" | "cutting" | "sewing";

export interface UserProfile {
    uid: string;
    email: string | null;
    areas_acceso: Area[];
    displayName: string | null;
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    hasArea: (area: Area) => boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
    hasArea: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userDocSnap = await getDoc(userDocRef);

                    let areas_acceso: Area[] = [];

                    if (userDocSnap.exists()) {
                        const data = userDocSnap.data();
                        // Compatibilidad con datos antiguos: si tiene `role` string, migrar a `areas_acceso`
                        if (data.areas_acceso && Array.isArray(data.areas_acceso)) {
                            areas_acceso = data.areas_acceso as Area[];
                        } else if (data.role) {
                            // Usuario antiguo con role string → convertir a array
                            areas_acceso = [data.role as Area];
                        } else {
                            areas_acceso = ["sales"]; // Default
                        }
                    } else {
                        areas_acceso = ["sales"];
                    }

                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        areas_acceso: areas_acceso,
                    });
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        await firebaseSignOut(auth);
        setUser(null);
    };

    const hasArea = (area: Area): boolean => {
        if (!user) return false;
        // Si es master, tiene acceso a todo
        if (user.areas_acceso.includes("master")) return true;
        return user.areas_acceso.includes(area);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut, hasArea }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
