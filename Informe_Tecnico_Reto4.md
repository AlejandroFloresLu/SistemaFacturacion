# Informe Técnico: Evaluación Heurística y Cumplimiento WCAG 2.2 - Reto 4 (RDA1)

## 1. Análisis de las 10 Heurísticas de Nielsen en FACTU

| Heurística | Aplicación en el Prototipo |
|------------|----------------------------|
| 1. Visibilidad del estado del sistema | El menú lateral resalta la página actual. Al cargar archivos masivos se muestran barras de progreso reales indicando porcentaje. Botón verde y etiquetas rojas muestran el estado financiero. |
| 2. Relación entre el sistema y el mundo real | Se utiliza iconografía universal (disquete para guardar, avión para boletos, tacho de basura para eliminar) con lenguaje amigable de negocio ("Nueva Factura", "Inventario"). |
| 3. Control y libertad del usuario | Los usuarios pueden cancelar o abortar la selección de un cliente (tecla Escape o "x") o remover y quitar pagos individualmente fácilmente de la lista de transacciones. |
| 4. Consistencia y estándares | Los colores están institucionalizados (Factu Azul Cobalto y colores claros semánticos). Las tablas de facturas, clientes y productos tienen la misma estructura de diseño limpio. |
| 5. Prevención de errores | El saldo en factura se colorea rojo si hay faltante de pago y no permite "Aprobar" hasta que el balance cuadre en su totalidad. Formularios tienen ayudas visuales minimalistas. |
| 6. Reconocer antes que recordar | Al buscar un cliente se autocompleta con sus datos identificatorios reduciendo repetición de tareas. Interfaz "Spotlight" para productos, guiándose por atajos eficientes (Cmd+K). |
| 7. Flexibilidad y eficiencia de uso | Integración de accesos rápidos (F12 para cobrar, atajos de búsqueda) y un estado de favoritos planeado en la barra lateral pensado en los power-users/facturadores rápidos. |
| 8. Estética y diseño minimalista | Diseño "Clean" tipo SaaS/Dashboard de alto rendimiento. Retiro de cajas pesadas, texturas y elementos innecesarios. Padding alto para agilizar la lectura de tablas con avatares visuales. |
| 9. Ayudar a resolver errores | Si no se encuentra un producto en el spotlight automático, éste se autollena en la factura con modelo ad-hoc, permitiendo al empleado no bloquear el cobro y registrar la venta igual. |
| 10. Ayuda y documentación básica | En la pantalla de carga masiva se integra una caja a la derecha extra visible con instrucciones secuenciales en caso de duda sobre cómo manejar el CSV o las subidas. |

## 2. Evidencia Funcional de las Normas WCAG 2.2

La interfaz fue instrumentada y parchada con código y etiquetas para asegurar accesibilidad a nivel de UI:

- **Perceptibilidad:** Todas las imágenes o íconos (*Lucide SVG*) se configuraron con el rol \`aria-hidden="true"\` para evitar que un lector de pantalla exprese ruido inútil. El contraste en variables de CSS se calibró en tonos grises aptos para lectura en pantalla clara.
- **Operabilidad:** Todo el sistema se puede gestionar o explorar con teclado (Tab, Cmd+K, F12). Para ello se estableció un foco visible (\`outline: 3px solid #0b4182\`) mediante \`:focus-visible\` puro, que guía de forma contundente al usuario al saltar entre los controles. Además el bloque Drag & Drop de carga soporta eventos de tecla "Enter".
- **Comprensibilidad:** Se adjuntaron etiquetas lógicas \`aria-label\` a los botones de íconos solitarios (menú *hamburguesa*, botón "Eliminar", botón "Cerrar", etc.) y textos claros dentro de form con \`placeholder\`.
- **Robustez:** La página posee contenedores lógicos como \`<main role="main">\` y \`<div role="navigation">\`, siendo legible adecuadamente en diferentes computadoras de la agencia turística (indistintamente del zoom de pantalla utilizado) y soportados por tecnología de apoyo.

## 3. Explicación del Modelo Mental seguido por la Interfaz

Para esta interfaz se adoptó un modelo cognitivo de **Punto de Venta Ágil (POS)**. El usuario percibe su tarea diaria no como llenar largos y lentos formularios o moverse por infinitas páginas, sino desde un único panel dinámico unificado donde despacha clientes. 

### a) Flujo de Navegación (Diagrama de Estados)
\`\`\`mermaid
stateDiagram-v2
    [*] --> Dashboard
    Dashboard --> NuevaFactura : "Clic o Atajo"
    NuevaFactura --> BuscarCliente : "Prepara venta"
    BuscarCliente --> AgregarProductos : "Cliente hallado"
    BuscarCliente --> ModalNuevoCliente : "Alta Rápida"
    ModalNuevoCliente --> AgregarProductos
    AgregarProductos --> AreaPagos : "Listar Valores"
    AreaPagos --> AprobacionVenta : "Botón F12"
    AprobacionVenta --> [*]
\`\`\`

### b) Secuencia de tareas típicas (Objetivo: Facturar Vuelo)
1. **Identificar Al Comprador:** Se usa el cuadro superior usando autocompletado en tiempo real basado en RUC o el modal de Alta Rápida si es nuevo e inmediato.
2. **Armar la cuenta:** Usando \`Ctrl+K\` (Spotlight de búsqueda mágica), teclear "vuelo", y llenar con clic rápido sumando las unidades vendidas en la tabla izquierda de productos.
3. **Módulo de Pago Mixto:** Desplegable a la derecha donde asientan el efectivo pagado o la transacción recibida en el banco para llegar al estado *"Saldo Cero"*.
4. **Finalizar y Liberar:** Apretar un único botón "Aprobar (F12)" de color llamativo para culminar la tarea e imprimir PDF y saltar al siguiente cliente.

### c) Respuestas del Sistema (Microinteracciones en la app)
- **Feedback Semántico en Saldo:** Cuando la cantidad en balance no cuadra, la frase "Saldo Restante" resalta instintivamente en *Rojo*. Cuando la venta ha sido saldada en su totalidad, refleja color en verde de satisfacción (Success).
- **Animaciones Hover en Tablas:** Todo inventario y factura lista un tenue ensombrecimiento azul claro e ícono para el cursor para reflejar interactividad en todo renglón.
- **Upload dinámico:** En Carga Masiva `drag & drop`, cuando arrastran archivos la caja crece con la animación \`hover-grow\` (\`css drop-active\`) y simula barras de progreso visual en verde para demostrar al usuario que está avanzando un proceso delicado (Status System feedback).
