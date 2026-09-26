# Constitución de GenFacturas

GenFacturas será un generador de proformas fácil de modificar desde formularios y con previsualización inmediata.

1. **Stack simple:** usar React, Vite, JavaScript y CSS plano; toda dependencia nueva requiere justificación.
2. **Spec y código:** ningún comportamiento contradice `docs/specs`; todo cambio funcional actualiza primero o junto con la spec.
3. **Capas separadas:** la lógica de negocio no importa React, DOM ni storage; la interfaz no recalcula reglas del dominio.
4. **Pruebas obligatorias:** todo cambio de reglas incluye tests y debe pasar `npm test` y `npm run build`.
5. **Datos persistentes:** borrador, emisor, logo, historial y clientes sobreviven recargas; datos corruptos nunca rompen la aplicación y datos guardados por versiones anteriores siguen cargando.
6. **Idioma consistente:** código y conceptos del dominio se nombran en español; todos los mensajes visibles están en español claro.
7. **Documentos inmutables:** una proforma guarda copia de los datos del cliente; cambios posteriores en el catálogo no alteran proformas emitidas.
