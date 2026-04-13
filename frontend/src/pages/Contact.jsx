import React, { useState } from 'react';
import { Mail, Send, CheckCircle, MessageSquare, AlertCircle, PlusCircle, Ghost } from 'lucide-react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de seguridad para el asunto
    if (!formData.subject) {
      return;
    }

    try {
      const response = await fetch("https://formspree.io/f/mdayondz", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setSubmitted(true);
        setFormData({ email: '', subject: '', message: '' });
      } else {
        alert("Hubo un error al enviar el mensaje. Inténtalo de nuevo.");
      }
    } catch (error) {
      alert("Error de conexión. Por favor, revisa tu conexión.");
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (submitted) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
        <div className="glass" style={{ padding: '4rem', textAlign: 'center', maxWidth: '500px' }}>
          <div style={{ color: '#22c55e', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle size={80} />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>¡Mensaje Enviado!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
            Gracias por contactar. Tu sugerencia o reporte ha sido recibido y lo revisaremos lo antes posible para seguir mejorando NuzTracker.
          </p>
          <button className="btn btn-primary" onClick={() => setSubmitted(false)}>
            Enviar otro mensaje
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '6rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="title-glow" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
          Centro de <span className="gradient-text">Ayuda</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          ¿Falta alguna ruta? ¿Has encontrado un bug? ¿Tienes una idea brillante? Cuéntanoslo todo.
        </p>
      </div>

      <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem' }}>
        {/* Información a la izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card glass">
            <h3 style={{ color: 'var(--primary)' }}><AlertCircle size={22} /> Reportar un Fallo</h3>
            <p>Si algo no funciona como debería, dinos qué ha pasado y en qué página estabas.</p>
          </div>
          <div className="card glass">
            <h3 style={{ color: 'var(--accent)' }}><PlusCircle size={22} /> Rutas y Datos</h3>
            <p>¿Falta o sobra alguna ruta de algún juego? Ayúdanos a mantener la base de datos perfecta.</p>
          </div>
          <div className="card glass">
            <h3 style={{ color: '#facc15' }}><MessageSquare size={22} /> Sugerencias</h3>
            <p>Cualquier idea para mejorar la interfaz o añadir nuevas funciones es bienvenida.</p>
          </div>
        </div>

        {/* Formulario a la derecha */}
        <div className="glass" style={{ padding: '3rem', gridColumn: 'span 2' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Tu Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  name="email"
                  className="input"
                  style={{ paddingLeft: '3rem' }}
                  placeholder="ejemplo@entrenador.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">¿En qué podemos ayudarte?</label>
              <select
                name="subject"
                className="input"
                value={formData.subject}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Elige una opción</option>
                <option value="Mejora para la web">Mejora para la web</option>
                <option value="Ruta que falta o sobra">Ruta que falta o sobra</option>
                <option value="Reportar un fallo (Bug)">Reportar un fallo (Bug)</option>
                <option value="Otro motivo">Otro motivo</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tu Mensaje</label>
              <textarea
                name="message"
                className="input"
                rows="6"
                style={{ resize: 'vertical', minHeight: '150px' }}
                placeholder="Escribe aquí los detalles..."
                required
                value={formData.message}
                onChange={handleChange}
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
              <Send size={20} /> Enviar Sugerencia
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
