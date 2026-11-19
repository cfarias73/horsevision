# HorseVision · App Store iOS

Proyecto separado para la versión iOS empaquetada con Capacitor. La landing y la PWA existentes permanecen en `frontend/`; esta carpeta tiene una copia independiente de la experiencia, su propio build y su proyecto nativo.

El acceso inicia como invitado después del splash. Las acciones que crean o modifican datos, cargan videos o usan los asistentes solicitan registro/inicio de sesión y reanudan la acción al autenticar. La app utiliza la misma autenticación de Supabase y la misma API de Railway.

## Desarrollo web

```bash
npm install
npm run dev
```

El servidor de desarrollo usa el puerto `5174` y reenvía `/api` al backend local en `http://127.0.0.1:8000`. Para builds nativos, `VITE_API_BASE_URL` permite apuntar a la API de Railway (el valor por defecto es el servicio HorseVision actual).

## Proyecto iOS

```bash
npm run ios:add       # solo la primera vez
npm run cap:sync      # compila y sincroniza los cambios web
npm run ios:open      # abre el proyecto en Xcode
```

El identificador `app.horsevision.ios` es provisional y debe confirmarse antes de publicar en App Store Connect.
