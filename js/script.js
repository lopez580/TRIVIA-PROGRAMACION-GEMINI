const API_KEY = 'AIzaSyA6KCxNYPxnMjhKNwpWAIrdWrVIfm0jjhc'
//const MODEL = "gemini-2.5-flash"; // o "gemini-1.5-pro"
const MODEL = "gemini-2.5-flash";
//const MODEL = "gemini-2.5-flash-lite";

let correctas=0;
let incorrectas=0;


let preguntaActual = null;
// Guarda los contadores actuales en localStorage
function saveCounters() {
    try {
        localStorage.setItem('trivia_correctas', String(correctas));
        localStorage.setItem('trivia_incorrectas', String(incorrectas));
    } catch (e) {
        console.warn('No se pudo guardar en localStorage:', e);
    }
}

// Carga los contadores desde localStorage (si existen)
function loadCounters() {
    try {
        const c = parseInt(localStorage.getItem('trivia_correctas'));
        const i = parseInt(localStorage.getItem('trivia_incorrectas'));
        if (!Number.isNaN(c)) correctas = c; else correctas = 0;
        if (!Number.isNaN(i)) incorrectas = i; else incorrectas = 0;
    } catch (e) {
        console.warn('No se pudo leer localStorage:', e);
        correctas = 0;
        incorrectas = 0;
    }
    desplegarContadores();
}

const temas = [
    "concepto de arreglo y operaciones sobre arreglos",
    "concepto de diccionarios y funciones básicas",
    "operadores lógicos, aritméticos, de comparación, ternario",
    "uso de la consola para debuggear",
    "funciones con parámetros por default",
    "manipulación del DOM",
    "eventos en JavaScript",
    "CSS selectores y especificidad",
    "flexbox y grid en CSS",
    "promesas y async/await"
];


function generarPrompt() {
    const temaAleatorio = temas[Math.floor(Math.random() * temas.length)];
    
    return `En el contexto de JavaScript, CSS y HTML. Genera una pregunta de opción múltiple sobre el siguiente tema: ${temaAleatorio}. 
    
Proporciona cuatro opciones de respuesta y señala cuál es la correcta.    

Genera la pregunta y sus posibles respuestas en formato JSON como el siguiente ejemplo, asegurándote de que el resultado SÓLO contenga el objeto JSON y no texto adicional:

Ejemplo:
{
  "question": "¿Cuál de los siguientes métodos agrega un elemento al final de un arreglo en JavaScript?",
  "options": [
    "a) shift()",
    "b) pop()",
    "c) push()",
    "d) unshift()"
  ],
  "correct_answer": "c) push()",
  "explanation": "El método push() agrega uno o más elementos al final de un arreglo y devuelve la nueva longitud del arreglo."
}`;
}




async function respuestaAPI() {
    const prompt = generarPrompt();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;


    try {
        const response = await fetch (url, {
            method: "POST",
            headers : {"Content-Type" : "application/json"},
            body: JSON.stringify({
                contents: [{
                    parts: [{text: prompt}]
                }],
                generationConfig: {
                    temperature: 0.25,
                    responseMimeType: "application/json"
                }
            }) 
        });

        if (!response.ok){
            const errorData = await response.json();
            throw new Error(`Error HTTP ${response.status}: ${JSON.stringify(errorData)}`); 

        }

        const data = await response.json();
        console.log("Respuesta de la api:",data);

        const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (textResult){
            //limpiar y extraer el json 
            const textResultTrimmed = textResult.trim();
            const firstBraceIndex = textResultTrimmed.indexOf('{');
            const lastBraceIndex = textResultTrimmed.lastIndexOf('}');
            const jsonString = textResultTrimmed.substring(firstBraceIndex, lastBraceIndex +1);

            const questionData = JSON.parse(jsonString);
            console.log("pregunta generada:", questionData);
            return questionData;
          
        }else {
            console.log("no se pudo extrawer el texto de la respuesta");
            return null;
        }
    }catch (error){
        console.error("error en la peticion:",error);
        document.getElementById('question').textContent = 'Error al cargar la pregunta, verrifca APIKEY ';
        return null;
    }
    
}



function desplegarPregunta(datosPregunta) {
    preguntaActual = datosPregunta;

    //show question
    document.getElementById('question').className = 'fs-5 fw-bold text-dark';
    document.getElementById('question').textContent = datosPregunta.question;


    //cledan
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML='';

    //crear botones

    datosPregunta.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-primary';
        button.textContent = option;
        button.onclick = () => verificarRespuesta(option);
        optionsContainer.appendChild(button);
    });


}

function verificarRespuesta(opcionSeleccionada) {
    const buttons = document.querySelectorAll('#options button');
    
    // Deshabilitar todos los botones
    buttons.forEach(btn => btn.disabled = true);
    
    if (opcionSeleccionada === preguntaActual.correct_answer) {
        // Respuesta correcta
        correctas++;
        saveCounters();
        buttons.forEach(btn => {
            if (btn.textContent === opcionSeleccionada) {
                btn.className = 'btn btn-success';
            }
        });
        
        // Mostrar explicación
        setTimeout(() => {
            alert(`¡Correcto! ✓\n\n${preguntaActual.explanation}`);
            desplegarContadores();
            cargarPregunta();
        }, 500);
        
    } else {
        // Respuesta incorrecta
        incorrectas++;
        saveCounters();
        buttons.forEach(btn => {
            if (btn.textContent === opcionSeleccionada) {
                btn.className = 'btn btn-danger';
            }
            if (btn.textContent === preguntaActual.correct_answer) {
                btn.className = 'btn btn-success';
            }
        });
        
        // Mostrar explicación
        setTimeout(() => {
            alert(`Incorrecto ✗\n\nLa respuesta correcta era: ${preguntaActual.correct_answer}\n\n${preguntaActual.explanation}`);
            desplegarContadores();
            cargarPregunta();
        }, 500);
    }
}


function desplegarContadores(){
    document.getElementById('correctas').textContent = correctas;
    document.getElementById('incorrectas').textContent = incorrectas;

}


async function cargarPregunta() {
    document.getElementById('question').className = 'text-warning fs-5';
    document.getElementById('question').textContent = 'cargando pregunta de gemini...';
    document.getElementById('options').innerHTML = '';

    const datosPregunta = await respuestaAPI();
    if (datosPregunta){
        desplegarPregunta(datosPregunta);

    }
    
    
}

window.onload = () => {
    console.log("Trivia iniciada correctamente");
    loadCounters();
    desplegarContadores();
    cargarPregunta();
};

