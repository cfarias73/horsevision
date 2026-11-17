# HorseVision · Roadmap de Producto & Desarrollo

Documento maestro de seguimiento de características implementadas, en desarrollo y planificadas para **HorseVision** (Plataforma de Cinemática y Rendimiento Biomecánico Equino).

---

## 📌 Estado Actual del Proyecto (Hitos Completados)

- [x] **Motor Biomecánico Central (FastAPI + PyTorch/ONNX):**
  - Detección de ejemplar con YOLOv8 (*Quality Gate lateral 90°*).
  - Extracción de pose de 17 puntos anatómicos con RTMPose / AP-10K.
  - Filtrado polinomial Savitzky-Golay ($w=7, p=3$) para preservar picos de impacto sin atenuación.
  - Algoritmos cinemáticos de Keegan: impacto ($\Delta Y_{\min}$) y empuje ($\Delta Y_{\max}$) para nuca y grupa.
  - Secuencia de pisada y *Duty Factor* (%) con diagramas de Hildebrand.
- [x] **Interfaz Móvil (React + Tailwind CSS):**
  - Marco nativo móvil *bezel* de 430px con tarjetas elevadas 3D táctiles.
  - Tema ecuestre de lujo: **Modo Claro predeterminado** con acentos en **British Racing Green** (`#0D3F2E`) y selector de **Modo Oscuro** (☀️/🌙).
  - Reproductor cinemático con lienzo en negro puro para contraste de retículos neón, control de velocidad (0.25x, 0.5x, 1x) y scrubber sincronizado.
  - Auto-recorte (*Crop*) inteligente dinámico centrado en el ejemplar.
- [x] **Gestión de Cuadra & Registro de Ejemplares:**
  - Registro y edición completa de caballos con subida de foto, nombre, raza, disciplina, sexo, edad, alzada y notas de manejo.
  - Almacenamiento local persistente (`localStorage`).
  - Navegación nativa de 5 pestañas: Home, Análisis, Cuadra, Historial, Perfil.
  - Selección de ejemplar directamente desde la cuadra para evaluación de trote.
  - **Evolución Longitudinal Multi-Sesión por Ejemplar:** Gráfica interactiva de tendencia temporal integrada en la Cuadra (`Evolución`), en el Historial (`HistorialView`) y en el Informe (`ReportView`), con conmutador dinámico entre *Score Global (0-100)* y *Asimetría (mm)*, cálculo de deltas netos ganados/reducidos y acceso directo a cada sesión individual.
- [x] **Visor de Grabación Forzado 16:9 (Estilo RealHorse):**
  - Detección automática de orientación con pantalla de aviso para girar el teléfono a horizontal.
  - Nivelador de horizonte (giroscopio 0°) en verde esmeralda y retícula de tercios.
  - Selectores de patrón de trote en vivo (`Línea Recta`, `Círculo Izq`, `Círculo Der`).
  - Cronómetro de captura en pantalla con validación de duración óptima (8s a 12s para capturar 3 zancadas completas).
  - Botón obturador circular nativo con pulsación de grabación y acceso rápido a *Importar* desde galería.
- [x] **Splash Screen:**
  - Animación Lottie de caballo vector en línea única sobre fondo blanco (duración calibrada de 3.0s sin borrado).
- [x] **Tour de Inducción & Onboarding de 4 Pasos (Diseño Exacto Stitch):**
  - Implementación al pie de la letra del flujo `@stitch_equine_biomechanics_onboarding_flow`:
    1. *Paso 1: Precisión Cinemática en la Palma de tu Mano* (Keypoints IA, ±1mm, estándar FEI).
    2. *Paso 2: Captura Fácil en 10 Segundos* (Guía lateral 90°, 5-8m, 8-12s trote).
    3. *Paso 3: Sigue la Evolución de tu Ejemplar* (+15% empuje, telemetría y reportes).
    4. *Paso 4: Comienza tu Prueba Gratuita* (Registro inicial de caballo y disciplina, 14 días gratis).
  - Persistencia estricta en `localStorage` (`hv_onboarding_completed`) para mostrarse únicamente la primera vez que se abre la app (con acceso directo para revivirlo desde *Perfil*).
- [x] **Funcionalidades RealHorse & Validación Científica EVJ:**
  - **Barras de Asimetría EVJ:** Comparador visual de Impacto vs. Despegue (Anterior y Posterior) con umbrales clínicos (<6mm, 6-12mm, >12mm).
  - **Follow the Progress:** Seguimiento longitudinal contra línea base de referencia con porcentaje de mejora/retroceso.
  - **Informe Clínico Biomecánico con IA:** Integración de DeepSeek V3 para análisis funcional y prescripción de ejercicios correctivos.
  - **Certificado Oficial en PDF:** Generación y descarga directa en 2 páginas listas para imprimir o enviar.
  - **Vet Chat en Tiempo Real:** Asistente conversacional contextualizado con la cinemática del video analizado.
  - **Embudo Comercial SaaS:** Modal de planes (Basic Plus, Premium, Unlimited) con ciclo mensual/anual y prueba gratuita de 14 días.

---

## 🛠️ Infraestructura Operativa & Backend de Producción (Core Operations)

### 1. Base de Datos & Almacenamiento en la Nube
> *Migración del estado en memoria y localStorage a una arquitectura escalable y persistente.*
- [ ] **Base de Datos Relacional (PostgreSQL via Supabase / AWS RDS):**
  - Esquema `users` (credenciales, plan activo, fecha de expiración, rol).
  - Esquema `horses` (nombre, raza, disciplina, microchip/pasaporte, foto, fecha nacimiento).
  - Esquema `evaluations` (JSON completo de cinemática, métricas Keegan, timestamps, URL de video).
  - Esquema `baselines` (referencia elegida para cada caballo para el cálculo de deltas evolutivos).
- [ ] **Almacenamiento de Videos y Archivos (Cloudflare R2 / AWS S3):**
  - Bucket seguro con presigned URLs para subida directa de videos desde el móvil (sin saturar la memoria RAM de FastAPI).
  - Almacenamiento persistente de los informes PDF generados para acceso histórico y reenvío.

---

### 2. Sistema de Autenticación & Control de Acceso (Auth & Roles)
> *Seguridad de usuarios y cumplimiento estricto de directrices de Apple.*
- [ ] **Sign in with Apple (Mandatario por App Store):**
  - Requisito ineludible de la revisión de Apple para cualquier app con autenticación de terceros.
- [ ] **Google OAuth & Magic Link / Email + Password:**
  - Autenticación unificada mediante Supabase Auth o Firebase Auth con tokens JWT seguros.
- [ ] **Control de Roles y Permisos (RBAC):**
  - **Rol Jinete / Dueño:** Gestión de su propia cuadra (hasta 1 o 3 caballos según plan).
  - **Acceso Multiusuario (Feature RealHorse):** Posibilidad de vincular 2 usuarios a una misma cuenta (ej. dueño + jinete/entrenador) en planes Premium.
  - **Rol Clínica / Veterinario Pro:** Gestión de múltiples propietarios, personalización con logo de la clínica y caballos ilimitados.

---

### 3. Sistema de Pagos & Monetización de Suscripciones (IAP & Stripe)
> *Infraestructura para monetizar los planes Basic Plus ($9.99), Premium ($24.99) y Unlimited ($79.99).*
- [ ] **Apple In-App Purchases (IAP) via RevenueCat:**
  - RevenueCat SDK integrado en React Native / Capacitor o wrapper web.
  - Manejo automático de recibos de App Store, período de prueba gratuito de 14 días (*Free Trial*), cancelaciones y renovaciones automáticas.
- [ ] **Pasarela Web (Stripe Billing):**
  - Checkout de Stripe para usuarios que se suscriban desde la web o compras corporativas de clínicas.
  - Webhooks de sincronización automática de estado (`customer.subscription.updated`, `invoice.payment_succeeded`).
  - Portal de Facturación de autoservicio (*Stripe Customer Portal*) para gestionar tarjetas o cambiar de plan.

---

### 4. Pantalla de Perfil de Usuario & Gestión de la Cuadra (*Stable Management*)
> *Centro de control donde el usuario gestiona su cuenta y sus caballos.*
- [ ] **Pantalla de Perfil de Usuario:**
  - Datos de cuenta, email, avatar, insignia del plan activo (*Basic Plus, Premium, Unlimited*).
  - Estado del período de prueba (días restantes del trial).
  - Enlace directo a gestionar suscripción / cambio de plan.
  - Configuración de tema (Forzar Claro / Forzar Oscuro / Automático del Sistema).
- [ ] **Gestión de Caballos (*Stable / Horse Management*):**
  - Pantalla para listar todos los ejemplares registrados con su foto de avatar.
  - Control de cupo según plan: bloqueo amigable al intentar superar el límite de caballos contratados.
  - Formulario de alta/edición de caballo (nombre, disciplina, fecha de nacimiento, notas).
  - Selector de "Caballo Activo" en la cabecera antes de iniciar una captura o análisis.
  - Historial de evaluaciones filtrable por caballo.

---

### 5. Notificaciones Push & Retención
- [ ] Recordatorio semanal automático: *"Han pasado 7 días desde la última evaluación de Dakota. Recomendamos registrar un trote para monitorear su simetría."*
- [ ] Notificación de procesamiento completado cuando un video termine de ser analizado en segundo plano.

---

### 6. DevOps, Despliegue & Monitoreo de Producción
- [ ] Contenedor Docker para backend FastAPI optimizado con ONNX Runtime (soporte CPU y GPU CUDA).
- [ ] Despliegue en nube (AWS ECS / Railway / GCP).
- [ ] Monitoreo de errores en tiempo real con Sentry y analíticas de retención (PostHog / Mixpanel).

---

## 🚀 Próximos Desarrollos Cinemáticos (Backlog Priorizado)

### 1. Comparador Dual de Videos (Side-by-Side & Ghost Overlay)
> *Capacidad para analizar y comparar dos videos del mismo caballo tomados en fechas o condiciones distintas.*
- [ ] **Sincronización de Fase (*Phase-Lock*):** Algoritmo que detecta el primer contacto de casco anterior izquierdo (LF) en ambos videos para emparejar el inicio de la zancada automáticamente.
- [ ] **Modo Split-Screen:** Reproducción simultánea arriba/abajo (o lado a lado) con scrubber unificado.
- [ ] **Modo Fantasma (*Ghost Overlay*):** Superposición translúcida de la silueta/esqueleto de la evaluación anterior sobre la actual.
- [ ] **Tarjeta de Comparación Delta:** Diferencial numérico inmediato de mejora ($\Delta$ Asimetría mm, $\Delta$ ROM dorsal, $\Delta$ Elevación de cascos).
- [ ] **Casos de uso preconfigurados:**
  - Pre vs. Post Bloqueo Anestésico / Infiltración.
  - Pre vs. Post Herraje y recorte podal.
  - Evolución mensual de rehabilitación.

---

### 2. Flujo de Onboarding Nativo (3 a 4 Pantallas)
> *Presentación inicial para nuevos usuarios que educa sobre la grabación y maximiza la conversión.*
- [ ] **Pantalla 1 (Hook & Trust):** *"Precisión Cinemática en tu Teléfono"* · Validación científica a 1 mm.
- [ ] **Pantalla 2 (Quality Gate):** *"Captura Perfecta en 10s"* · Guía de 90° lateral, distancia de 5-8 m y trote recto.
- [ ] **Pantalla 3 (Seguimiento Continuo):** *"Monitorea su Evolución"* · Valor de la línea base y prevención de lesiones.
- [ ] **Pantalla 4 (Activación):** Ficha inicial del ejemplar + botón de activación de los 14 días de prueba gratis.
- [ ] Transición fluida con indicador de progreso (`•••`) y botón *"Saltar"*.

---

### 3. Asistente Giroscópico de Grabación en 16:9
> *Garantizar que el usuario grabe en horizontal para obtener el doble de resolución óptica y cero paneo manual.*
- [ ] Detección del acelerómetro/giroscopio en la cámara nativa del navegador móvil.
- [ ] Modal o overlay animado que solicita girar el dispositivo si se detecta orientación vertical (9:16).
- [ ] Bloqueo o recomendación visual de orientación apaisada (*landscape*) antes de iniciar la captura.

---

### 4. Blindaje Regulatorio para App Store (Apple Review Guidelines 1.4.1)
> *Garantizar la aprobación directa de Apple clasificando la app en la categoría Sports / Health & Fitness.*
- [ ] Sustitución sistemática de términos clínicos por términos de rendimiento biomecánico:
  - *Diagnóstico Clínico* ➔ *Evaluación Cinemática de Simetría*.
  - *Cojera / Claudicación* ➔ *Asimetría de Movimiento / Desbalance de Carga*.
  - *Prescripción Médica* ➔ *Plan de Acondicionamiento y Ejercicios Correctivos*.
  - *Vet Chat* ➔ *Asistente en Biomecánica y Rendimiento Ecuestre*.
- [ ] Inclusión visible del descargo legal obligatorio (*Sports Biomechanics Disclaimer*).

---

### 5. Exportación de Video con Telemetría Integrada (*Burned-in Video*)
- [ ] Exportación de clip de video MP4 recortado con los retículos de colores y mediciones sobreimpresas en tiempo real para compartir en redes sociales o WhatsApp.

---

### 6. Análisis en Círculo / Cuerda (*Lungeing Kinematics*)
- [ ] Algoritmo de compensación para tomas en círculo (mano izquierda vs. mano derecha).
- [ ] Medición del ángulo de inclinación corporal (*body lean angle*) respecto a la vertical.

---

*Última actualización: Noviembre 2026*
