# Plantillas de Correo para EmailJS

Copia y pega este código HTML en el editor de plantillas de tu panel de EmailJS.

## 1. Plantilla para el Cliente (Client Template)
**Asunto:** Confirmación de tu pedido #{{order_number}} - Solare

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
    <div style="background-color: #000; color: #fff; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">SOLARE</h1>
    </div>
    
    <div style="padding: 20px; border: 1px solid #eee;">
        <h2>¡Gracias por tu compra, {{to_name}}!</h2>
        <p>Hemos recibido tu pedido correctamente. A continuación encontrarás los detalles:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Número de Pedido:</strong> #{{order_number}}</p>
            <p><strong>Total:</strong> ${{order_total}}</p>
        </div>

        <h3>Resumen del Pedido:</h3>
        <pre style="background-color: #fff; padding: 10px; border: 1px solid #ddd; white-space: pre-wrap; font-family: inherit;">{{order_items}}</pre>
        
        <p style="margin-top: 20px;">Nos pondremos en contacto contigo pronto para coordinar el envío.</p>
    </div>
    
    <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
        <p>&copy; 2024 Solare. Todos los derechos reservados.</p>
    </div>
</div>
```

---

## 2. Plantilla para el Proveedor/Admin (Provider Template)
**Asunto:** Nuevo Pedido #{{order_number}} - {{client_name}}

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
    <div style="background-color: #2196F3; color: #fff; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Nuevo Pedido Recibido</h1>
    </div>
    
    <div style="padding: 20px; border: 1px solid #eee;">
        <h2>Detalles del Cliente</h2>
        <p><strong>Nombre:</strong> {{client_name}}</p>
        <p><strong>Email:</strong> {{client_email}}</p>
        <p><strong>Teléfono:</strong> {{client_phone}}</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <p><strong>Número de Pedido:</strong> #{{order_number}}</p>
            <p><strong>Total:</strong> ${{order_total}}</p>
        </div>

        <h3>Productos:</h3>
        <pre style="background-color: #fff; padding: 10px; border: 1px solid #ddd; white-space: pre-wrap; font-family: inherit;">{{order_items}}</pre>
    </div>
    
    <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
        <p>Sistema de Notificaciones Solare</p>
    </div>
</div>
```
