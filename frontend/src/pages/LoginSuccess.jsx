import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LoginSuccess() {
    const { checkUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleSuccess = async () => {
            // Refrescar el estado del usuario después de la redirección de Google
            await checkUser();
            navigate('/mis-partidas');
        };
        handleSuccess();
    }, [checkUser, navigate]);

    return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="loader" size={48} color="var(--primary)" />
            <h2 style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>Finalizando inicio de sesión...</h2>
        </div>
    );
}
