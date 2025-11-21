# Configuración de EmailJS y WhatsApp para Solare

## EmailJS Configuración

### 1. Crear cuenta en EmailJS
- Visita [https://www.emailjs.com/](https://www.emailjs.com/)
- Crea una cuenta gratuita
- Crea un nuevo servicio de email (Gmail, Outlook, etc.)

### 2. Configurar el servicio
- **Service ID**: `service_solare`
- **Template ID**: `template_order_confirmation`
- **Public Key**: Reemplaza `'YOUR_PUBLIC_KEY'` en `/js/emailjs.js`

### 3. Template de Email (Order Confirmation)
Crea un template con las siguientes variables:

```
Subject: ✅ Pedido Confirmado - {{order_number}} - Solare

Hola {{customer_name}},

¡Gracias por tu compra en Solare!

📋 Número de Pedido: {{order_number}}
📅 Fecha: {{order_date}}
📧 Email: {{customer_email}}
📞 Teléfono: {{customer_phone}}

📍 Dirección de envío:
{{customer_address}}

🛒 Detalle del pedido:
{{order_items}}

💰 Total: ${{order_total}}

📦 Método de entrega: Envío a domicilio
💳 Método de pago: Pago contra entrega

Nos contactaremos contigo pronto para coordinar la entrega.

¡Gracias por confiar en Solare!

---
Solare - Tienda de Moda
```

## WhatsApp Configuración

### Número del Proveedor
- Reemplaza `'5491112345678'` en `/js/carrito.js` (línea 516)
- Usa el formato: código de país sin + + número (ej: 5491112345678 para Argentina)

### Mensaje Automático
El sistema genera automáticamente un mensaje con:
- ✅ Número de pedido
- 👤 Datos completos del cliente
- 📍 Dirección de envío
- 🛒 Detalle completo del pedido
- 💰 Resumen de pagos
- 📝 Notas adicionales

## Instalación

1. **Configura EmailJS**:
   ```javascript
   // En /js/emailjs.js, reemplaza:
   window.emailjs.init('YOUR_PUBLIC_KEY');
   ```

2. **Configura WhatsApp**:
   ```javascript
   // En /js/carrito.js, reemplaza:
   const providerPhone = '5491112345678'; // Tu número real
   ```

3. **Prueba el sistema**:
   - Agrega productos al carrito
   - Haz clic en "Realizar Pedido"
   - Completa el formulario
   - Verifica que se abra WhatsApp con el mensaje
   - Verifica que llegue el email de confirmación

## Funcionalidades Implementadas

✅ **Botón "Realizar Pedido"** - Cambiado desde "Proceder al Pago"
✅ **Modal de Checkout** - Formulario completo con datos del cliente
✅ **Integración WhatsApp** - Envío automático del pedido al proveedor
✅ **EmailJS Integration** - Confirmación por email al cliente
✅ **Validación de Formulario** - Campos requeridos y validación HTML5
✅ **Responsive Design** - Funciona en móviles y desktop
✅ **Estados de Carga** - Indicadores visuales durante procesamiento
✅ **Confirmación Visual** - Modal de éxito con detalles del pedido

## Notas Importantes

- El sistema funciona sin backend inicialmente (WhatsApp + EmailJS)
- Para guardar pedidos en base de datos, descomenta el código en `saveOrderToDatabase()`
- El número de WhatsApp se abre automáticamente en una nueva pestaña
- EmailJS requiere configuración previa para funcionar
- Los emails se envían al cliente con todos los detalles del pedido
