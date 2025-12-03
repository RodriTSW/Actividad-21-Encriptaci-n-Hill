const mensaje = document.getElementById('mensaje');
const charCount = document.querySelector('.char-count');
const matrizMensaje = document.getElementById('matrizMensaje');
const k11 = document.getElementById('k11');
const k12 = document.getElementById('k12');
const k21 = document.getElementById('k21');
const k22 = document.getElementById('k22');
const btnEncriptar = document.getElementById('encriptar');
const btnDesencriptar = document.getElementById('desencriptar');
const resultado = document.getElementById('resultado');

// ---------------- ACTUALIZAR CONTADOR ----------------
mensaje.addEventListener('input', () => {
    const len = mensaje.value.length;
    charCount.textContent = `${len}/30`;
    mostrarMatrizMensaje();
});

// ---------------- MATRIZ DEL MENSAJE ----------------
function mostrarMatrizMensaje() {
    const texto = mensaje.value.toUpperCase().replace(/[^A-Z]/g, '');

    if (texto.length === 0) {
        matrizMensaje.textContent = 'Escribe un mensaje primero...';
        return;
    }

    const valores = texto.split('').map(char => char.charCodeAt(0) - 65);

    let matriz = '[';
    for (let i = 0; i < valores.length; i += 2) {
        if (i > 0) matriz += ' ';
        matriz += '[' + valores[i];

        if (i + 1 < valores.length) {
            matriz += ', ' + valores[i + 1];
        } else {
            matriz += ', 23'; // padding con 'X'
        }

        matriz += ']';
    }
    matriz += ']';

    matrizMensaje.textContent = matriz;
}

// ---------------- FUNCIONES MATEMÁTICAS ----------------

// mcd
function mcd(a, b) {
    return b === 0 ? a : mcd(b, a % b);
}

// inverso modular (para determinante)
function modInverse(a, m) {
    a = ((a % m) + m) % m;
    for (let x = 1; x < m; x++) {
        if ((a * x) % m === 1) return x;
    }
    return null;
}

// ---------------- ENCRIPTAR (HILL 2x2) ----------------

btnEncriptar.addEventListener('click', () => {
    const key = [
        [parseInt(k11.value) || 0, parseInt(k12.value) || 0],
        [parseInt(k21.value) || 0, parseInt(k22.value) || 0]
    ];

    if (key[0][0] === 0 && key[0][1] === 0 && key[1][0] === 0 && key[1][1] === 0) {
        resultado.textContent = 'Error: Ingresa una matriz clave válida';
        resultado.classList.add('error');
        return;
    }

    const texto = mensaje.value.toUpperCase().replace(/[^A-Z]/g, '');
    if (texto.length === 0) {
        resultado.textContent = 'Error: Ingresa un mensaje';
        resultado.classList.add('error');
        return;
    }

    const det = (key[0][0] * key[1][1] - key[0][1] * key[1][0]) % 26;

    if (det === 0) {
        resultado.textContent = 'Error: La matriz no es invertible (determinante = 0)';
        resultado.classList.add('error');
        return;
    }

    let numeros = texto.split('').map(char => char.charCodeAt(0) - 65);

    if (numeros.length % 2 !== 0) {
        numeros.push(23); // 'X'
    }

    let encriptado = '';
    for (let i = 0; i < numeros.length; i += 2) {
        const v1 = numeros[i];
        const v2 = numeros[i + 1];

        const c1 = (key[0][0] * v1 + key[0][1] * v2) % 26;
        const c2 = (key[1][0] * v1 + key[1][1] * v2) % 26;

        encriptado += String.fromCharCode(65 + c1);
        encriptado += String.fromCharCode(65 + c2);
    }

    resultado.classList.remove('error');
    resultado.textContent = encriptado;
});

// ---------------- DESENCRIPTAR (HILL 2x2) ----------------

btnDesencriptar.addEventListener('click', () => {
    // Leer texto cifrado preferentemente desde el cuadro "resultado",
    // si no hay nada, tomar lo escrito en el textarea "mensaje".
    let texto = resultado.textContent.trim();
    if (!texto) {
        texto = mensaje.value.toUpperCase().replace(/[^A-Z]/g, '');
    } else {
        texto = texto.toUpperCase().replace(/[^A-Z]/g, '');
    }

    if (texto.length === 0) {
        resultado.textContent = 'Error: Ingresa un mensaje cifrado';
        resultado.classList.add('error');
        return;
    }

    const key = [
        [parseInt(k11.value) || 0, parseInt(k12.value) || 0],
        [parseInt(k21.value) || 0, parseInt(k22.value) || 0]
    ];

    // Determinante (normalizado a 0..25)
    let det = (key[0][0] * key[1][1] - key[0][1] * key[1][0]) % 26;
    det = (det + 26) % 26;

    if (det === 0) {
        resultado.textContent = 'Error: La matriz no es invertible';
        resultado.classList.add('error');
        return;
    }

    const detInv = modInverse(det, 26);
    if (detInv === null) {
        resultado.textContent = 'Error: No existe inverso modular del determinante';
        resultado.classList.add('error');
        return;
    }

    // Construir la matriz inversa (adjunta multiplicada por detInv) y normalizar
    let invKey = [
        [ ( key[1][1] * detInv ) % 26, ( (26 - key[0][1]) * detInv ) % 26 ],
        [ ( (26 - key[1][0]) * detInv ) % 26, ( key[0][0] * detInv ) % 26 ]
    ];
    invKey = invKey.map(row => row.map(v => (v + 26) % 26));

    // Pasar texto a números
    const numeros = texto.split('').map(c => c.charCodeAt(0) - 65);

    // Si la longitud es impar y sobra un carácter, no es grave — el cifrado original siempre
    // debió haber puesto padding. Aquí asumimos que el ciphertext tiene pares completos.
    if (numeros.length % 2 !== 0) {
        // Si llegamos aquí, pad con 'X' para evitar error
        numeros.push(23);
    }

    // Multiplicar por la inversa para obtener el plano
    let desencriptado = '';
    for (let i = 0; i < numeros.length; i += 2) {
        const v1 = numeros[i];
        const v2 = numeros[i + 1];

        const p1 = (invKey[0][0] * v1 + invKey[0][1] * v2) % 26;
        const p2 = (invKey[1][0] * v1 + invKey[1][1] * v2) % 26;

        desencriptado += String.fromCharCode(65 + p1);
        desencriptado += String.fromCharCode(65 + p2);
    }

    resultado.classList.remove('error');
    resultado.textContent = desencriptado;
});