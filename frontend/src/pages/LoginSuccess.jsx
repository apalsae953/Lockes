import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LoginSuccess() {
    const { checkUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleSuccess = async () => {
            // Capturar el token de la URL (tanto de search como de hash)
            const params = new URLSearchParams(window.location.search);
            let token = params.get('token');
            
            if (!token) {
                // Probar parseando desde el hash
                const hashParts = window.location.hash.split('?');
                if (hashParts.length > 1) {
                    const hashParams = new URLSearchParams(hashParts[1]);
                    token = hashParams.get('token');
                }
            }
            
            if (token) {
                localStorage.setItem('token', token);
            }

            // Refrescar el estado del usuario
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
