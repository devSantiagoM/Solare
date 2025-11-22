
const { createClient } = require('@supabase/supabase-js');

// Configuración (Usando las mismas credenciales que en js/supabase.js)
const SUPABASE_URL = 'https://pdufdbynsbhznnvvzujm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdWZkYnluc2Joem5udnZ6dWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NjU3MDIsImV4cCI6MjA3MjM0MTcwMn0.8AdR-DD2EPeBVPbSjkBNkGaENM97Hn1uzDc5tl9Ognw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runVerification() {
    console.log('🚀 Iniciando verificación de backend...');

    try {
        // 1. Autenticación (Crear usuario de prueba)
        const randomId = Math.floor(Math.random() * 1000000);
        const email = `test.solare.${randomId}@gmail.com`;
        const password = 'Password123!';
        console.log(`\n👤 Creando usuario de prueba: ${email}`);

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            console.error('❌ Error detallado en registro:', JSON.stringify(authError, null, 2));
            throw new Error(`Error en registro: ${authError.message}`);
        }

        if (!authData.user) {
            throw new Error('No se recibió usuario en la respuesta de registro');
        }

        console.log('✅ Usuario creado exitosamente. ID:', authData.user.id);
        const userId = authData.user.id;

        // 2. Verificar Tabla de Cupones (Lectura pública o autenticada según RLS)
        console.log('\n🎫 Verificando tabla de cupones...');
        const { data: coupons, error: couponsError } = await supabase
            .from('discount_codes')
            .select('*')
            .limit(1);

        if (couponsError) {
            console.log('ℹ️ Acceso a cupones restringido (Esperado si RLS está activo para usuarios no admin):', couponsError.message);
        } else {
            console.log('✅ Tabla de cupones accesible (Lectura)');
        }

        // 3. Crear una Reseña (Simulando usuario)
        console.log('\n⭐ Verificando creación de reseñas...');
        const { data: products } = await supabase.from('products').select('id').limit(1);

        if (products && products.length > 0) {
            const productId = products[0].id;
            console.log(`   Producto encontrado: ${productId}`);

            const reviewData = {
                product_id: productId,
                user_id: userId,
                rating: 5,
                comment: 'Reseña de prueba backend',
                is_approved: false
            };

            const { data: review, error: reviewError } = await supabase
                .from('product_reviews')
                .insert([reviewData])
                .select();

            if (reviewError) {
                console.error('❌ Error creando reseña:', reviewError.message);
            } else {
                console.log('✅ Reseña creada exitosamente');
                if (review && review.length > 0) {
                    console.log('   ID:', review[0].id);
                }
            }
        } else {
            console.log('⚠️ No hay productos para probar reseñas');
        }

        console.log('\n✨ Verificación de backend completada.');

    } catch (error) {
        console.error('\n❌ Error fatal en verificación:', error.message);
    }
}

runVerification();
