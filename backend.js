function findMatchingParenthesis(subregex) {
    let balance = 1; // Initialize the balance to 1 since we know the first character is '('
    let length = 1; // We already count the first '('

    // Iterate through the string starting from the second character (index 1)
    for (let i = 1; i < subregex.length; i++) {
        const char = subregex[i];
        length += 1;

        if (char === '(') {
            balance += 1; // Increase balance if another '(' is found
        } else if (char === ')') {
            balance -= 1; // Decrease balance when a ')' is found
        }

        // When balance reaches 0, we've found the matching closing parenthesis
        if (balance === 0) {
            // Return the content between the first '(' and its matching ')', along with the length
            return [subregex.slice(1, i), length];
        }
    }

    // If no matching closing parenthesis is found, return '' and 0
    return ['', 0];
}

function isSimpleRegex(regex) {
    const noIn = ['*', '+', '?', ')', '|'];
    const noEnd = ['(', '|'];
    const noNextAlt = ['|', '+', '*', '?', ')'];

    // '' is not a regular expression
    if (regex === '') {
        return false;
    }

    // Cannot start with *, +, ?, ), |
    if (noIn.includes(regex[0])) {
        return false;
    }

    // Cannot end with (, |
    if (noEnd.includes(regex[regex.length - 1])) {
        return false;
    }

    let i = 0;
    while (i < regex.length) {
        const chart = regex[i];
        const next = i < regex.length - 1 ? regex[i + 1] : '';

        if (chart === '(') {
            // Find the regex inside ()
            const [subregex, mov] = findMatchingParenthesis(regex.slice(i));
            if (subregex === '') {
                return false;
            }

            // The regex inside () should be valid
            if (!isSimpleRegex(subregex)) {
                return false;
            }

            // Move to the )
            i += mov - 1;
        }

        if (chart === '*' || chart === '+') {
            // Two operator error
            if (next === '*' || next === '+') {
                return false;
            }

            // Must be a valid regex before + or *
            if (!isSimpleRegex(regex.slice(0, i))) {
                return false;
            }
        }

        if (chart === '?') {
            // Two ?? 
            if (next === '?') {
                return false;
            }

            // Must be a valid regex before ?
            if (!isSimpleRegex(regex.slice(0, i))) {
                return false;
            }
        }

        if (chart === '|') {
            // Next character cannot be |, ), +, *
            if (noNextAlt.includes(next)) {
                return false;
            }

            // Must be a valid regex before and after |
            if (!(isSimpleRegex(regex.slice(0, i)) && isSimpleRegex(regex.slice(i + 1)))) {
                return false;
            }

            // Move to the end of the expression
            i = regex.length - 1;
        }

        // No balanced parentheses
        if (chart === ')') {
            return false;
        }
        i += 1;
    }
    return true;
}

function Alphabet(regex) {
    const operators = ['+', '*', '|', '?', '(', ')', '&'];
    const alphabet = [];
    let i = 0;
    
    while (i < regex.length) {
        const chart = regex[i];
        if (!operators.includes(chart)) {
            if (!alphabet.includes(chart)) {
                alphabet.push(chart);
            }
        }
        i++;
    }
    
    return alphabet.sort();
}

class Node {
    constructor(tag, initial, final) {
        this.tag = tag;
        this.initial = initial;
        this.final = final;
        this.adj = []; // Array of tuples (Node, label)
    }

    addEdge(node, chart) { // Append to adj tuples
        this.adj.push([node, chart]);
    }
}

class Graph {
    constructor() {
        this.nodes = []; // List of nodes
    }

    element(chart) {
        // ->|0|--a-->||1|| Base case
        const node1 = new Node(0, true, false);
        const node2 = new Node(1, false, true);
        node1.addEdge(node2, chart);
        // Add nodes in graph
        this.nodes.push(node1);
        this.nodes.push(node2);
    }
}
//------------------------------------------------------------------------------------------------------------------
//AFN 

function concat(G1, G2) {
    // If we don't have a previous graph, return the actual graph
    if (G1.nodes.length === 0) {
        return G2.nodes;
    }

    // Find the final node from G1 and the initial node from G2
    const f = G1.nodes.find(node => node.final);
    const i = G2.nodes.find(node => node.initial);

    // Tag from the last node of G1
    let tag_f = f.tag;

    // Change all the tags from G2 (except the initial node) to f.tag + 1 ++
    for (const node of G2.nodes) {
        if (node !== i) {
            tag_f += 1;
            node.tag = tag_f;
        }
    }

    // Save the adjacencies of i because we replace it for f
    const res = [...i.adj];

    // Add the adjacencies in f
    f.adj.push(...res);

    // Remove the final flag from f
    f.final = false;

    // Join the two graphs
    const Gres = [...G1.nodes, ...G2.nodes];

    // If a Node has adj with i, replace it for f
    for (const node of Gres) {
        node.adj = node.adj.map(([n, chart]) => [n === i ? f : n, chart]);
    }

    // Remove i from the graph
    Gres.splice(Gres.indexOf(i), 1);

    return Gres;
}
// interogate function
function interogate(G) {
    // Create 2 nodes
    const nodei = new Node(0, true, false);
    const nodef = new Node(1, false, true);

    // Increment all the tags
    G.nodes.forEach(node => node.tag += 1);

    // Find the initial and final node
    const i = G.nodes.find(node => node.initial);
    const f = G.nodes.find(node => node.final);

    // Add the adjacencies
    nodei.addEdge(i, '&');
    f.adj.push([nodef, '&']);

    // Remove the initial and final flag from the graph
    i.initial = false;
    f.final = false;

    // Change the tag of the final node
    nodef.tag = f.tag + 1;

    // Add adjacencies and add new nodes to the graph
    nodei.addEdge(nodef, '&');
    G.nodes.push(nodei);
    G.nodes.push(nodef);

    return G.nodes;
}

// kleene_closure function
function kleeneClosure(G) {
    // Increment all the tags
    G.nodes.forEach(node => node.tag += 1);

    // Find the initial and final node
    const i = G.nodes.find(node => node.initial);
    const f = G.nodes.find(node => node.final);

    // Create 2 nodes and change the flags of the nodes in the graph
    const nodei = new Node(0, true, false);
    const nodef = new Node(f.tag + 1, false, true);
    i.initial = false;
    f.final = false;

    // Add all the adjacencies and append the nodes to the graph
    f.addEdge(i, '&');
    nodei.addEdge(i, '&');
    nodei.addEdge(nodef, '&');
    f.addEdge(nodef, '&');
    G.nodes.push(nodei);
    G.nodes.push(nodef);

    return G.nodes;
}

// positive_closure function
function positiveClosure(G) {
    // Increment all the tags
    G.nodes.forEach(node => node.tag += 1);

    // Find the initial and final node
    const i = G.nodes.find(node => node.initial);
    const f = G.nodes.find(node => node.final);

    // Create 2 nodes and change the flags of the nodes in the graph
    const nodei = new Node(0, true, false);
    const nodef = new Node(f.tag + 1, false, true);
    i.initial = false;
    f.final = false;

    // Add all the adjacencies and append the nodes to the graph
    f.addEdge(i, '&');
    nodei.addEdge(i, '&');
    f.addEdge(nodef, '&');
    G.nodes.push(nodei);
    G.nodes.push(nodef);

    return G.nodes;
}

// alt function
function alt(G1, G2) {
    // Increment all the tags of G1
    G1.nodes.forEach(node => node.tag += 1);

    // Find the initial and final node from G1 and G2
    const i1 = G1.nodes.find(node => node.initial);
    const f1 = G1.nodes.find(node => node.final);

    // Increment the tags from G2 according to the last tag from G1
    G2.nodes.forEach(node => node.tag += f1.tag + 1);

    const i2 = G2.nodes.find(node => node.initial);
    const f2 = G2.nodes.find(node => node.final);

    // Create 2 nodes and change the flags of the nodes in the graph
    i1.initial = false;
    f1.final = false;
    i2.initial = false;
    f2.final = false;
    
    const nodei = new Node(0, true, false);
    const nodef = new Node(f2.tag + 1, false, true);

    // Add all the adjacencies, join G1 and G2, and append the nodes to the graph
    nodei.addEdge(i1, '&');
    nodei.addEdge(i2, '&');
    f1.addEdge(nodef, '&');
    f2.addEdge(nodef, '&');

    const Gres = [...G1.nodes, ...G2.nodes];
    Gres.push(nodei);
    Gres.push(nodef);

    return Gres;
}

// extract_interior_and_operator function
function extractInteriorAndOperator(string) {
    const stack = [];
    let interior = '';
    let i = 0;
    let operator = null;

    // Iterate over the string to find the opening parentheses
    while (i < string.length) {
        const char = string[i];

        // If we find an opening parenthesis, we start extracting the inner content
        if (char === '(') {
            stack.push('(');
            i += 1;

            // Continue until all parentheses are properly closed
            while (stack.length > 0) {
                const char = string[i];

                if (char === '(') {
                    stack.push('(');
                } else if (char === ')') {
                    stack.pop();
                }

                if (stack.length > 0) {
                    interior += char;  // Only add to interior if we are not at the last closing parenthesis
                }
                i += 1;
            }

            // After closing the parentheses, check if the next character is '*' or '+'
            if (i < string.length && (string[i] === '*' || string[i] === '+')) {
                operator = string[i];
            } else {
                operator = '';
            }
            // Exit the loop as we have found the content inside the parentheses
            break;
        }
    }

    return { interior, operator, length: interior.length };
}
// printgraph function
function printGraph(resultado) {
    resultado.nodes.forEach(nodo => {
        const adj_tags = nodo.adj.map(([adjNodo, label]) => [adjNodo.tag, label]); // Extraer tag y label de cada tupla
        console.log(`Nodo: ${nodo.tag}, Initial: ${nodo.initial}, Final: ${nodo.final}, Adj: ${JSON.stringify(adj_tags)}`);
    });
}

// Sort_by_tag function
function sortByTag(grafo) {
    grafo.nodes.sort((a, b) => a.tag - b.tag);
    return grafo;
}

// thompson function
function thompson(regex) {
    let i = 0;
    // Create the graph
    let graph = new Graph();

    while (i < regex.length) {
        const chart = regex[i]; // Current character
        let next = ''; // Next character
        let graphAux = new Graph(); // Auxiliary graph for expressions

        if (i < (regex.length - 1)) next = regex[i + 1]; // Check if there's a next character

        // Handling different cases based on current and next character
        if (chart === '(') {
            // Find the expression inside (...) and the operator
            const { interior: subregex, operator: operador, length: movi } = extractInteriorAndOperator(regex.slice(i));

            // Build the graph for the subexpression
            graphAux = thompson(subregex);

            if (operador === '*') {
                // Case (...)* - Apply Kleene closure
                graphAux.nodes = kleeneClosure(graphAux);
                i += movi + 2;
            } else if (operador === '+') {
                // Case (...)+ - Apply Positive closure
                graphAux.nodes = positiveClosure(graphAux);
                i += movi + 2;
            } else {
                // Case (...) - No closure operator
                i += movi + 1;
            }

            // Concatenate the auxiliary graph to the main graph
            graph.nodes = concat(graph, graphAux);
        } else {
            // Handle cases where the character is not '('
            if (next === '?') {
                // Case 'a?'
                graphAux.element(chart);
                graphAux.nodes = interogate(graphAux);
                graph.nodes = concat(graph, graphAux);
                i += 1;
            } else if (next === '*') {
                // Case 'a*'
                graphAux.element(chart);
                graphAux.nodes = kleeneClosure(graphAux);
                graph.nodes = concat(graph, graphAux);
                i += 1;
            } else if (next === '+') {
                // Case 'a+'
                graphAux.element(chart);
                graphAux.nodes = positiveClosure(graphAux);
                graph.nodes = concat(graph, graphAux);
                i += 1;
            } else if (chart === '|') {
                // Case '|' for alternation
                const subregex = regex.slice(i + 1); // Find the expression after '|'
                i = regex.length - 1; // Move to the last element

                // Create the graph for the subregex
                graphAux = thompson(subregex);

                // Apply alternation (|)
                graph.nodes = alt(graph, graphAux);
            } else {
                // Any other character (regular alphabet character)
                graphAux.element(chart);
                graph.nodes = concat(graph, graphAux);
            }
        }

        // Sort the graph by tags
        graph = sortByTag(graph);
        i += 1;
    }

    return graph;
}
function transitionTable(G, alphabet) {
    // Agregar el símbolo vacío al alfabeto
    alphabet.push('&'); 
    const data = {}; // Inicializamos un objeto para almacenar las transiciones

    // Inicializar el objeto para la tabla de transiciones
    const transitionTable = {};

    // Iteramos sobre los elementos del alfabeto
    for (const element of alphabet) {
        transitionTable[element] = {}; // Inicializamos el objeto para cada símbolo

        // Iteramos sobre los nodos del grafo
        for (const node of G.nodes) {
            const adjacencies = [];
            // Verificamos las adyacencias para el nodo y el elemento del alfabeto
            for (const adj of node.adj) {
                if (adj[1] === element) {
                    adjacencies.push(adj[0].tag); // Agregamos el tag del nodo adyacente si coincide
                }
            }
            transitionTable[element][node.tag] = adjacencies.length > 0 ? adjacencies : []; // Asignamos la lista de adyacencias
        }
    }

    return transitionTable; // Retornamos la tabla de transiciones
}

//------------------------------------------------------------------------------------------------------------------
//AFD non optimal

function epsilonClosure(nodeTag, G) {
    // Encontrar el nodo inicial cuyo tag coincide con nodeTag
    const initialNode = G.nodes.find(n => n.tag === nodeTag);
    
    // Lista para almacenar los tags de los nodos en la clausura epsilon
    const closure = [initialNode.tag];
    
    // Cola para procesar nodos con transiciones '&'
    const queue = [initialNode];
    
    // Mientras haya nodos en la cola, busca sus adyacencias
    while (queue.length > 0) {
        const node = queue.shift(); // Obtener el primer nodo de la cola
        
        // Recorrer las adyacencias del nodo actual
        for (const [neighbor, symbol] of node.adj) {
            if (symbol === '&' && !closure.includes(neighbor.tag)) {
                closure.push(neighbor.tag);
                queue.push(neighbor);
            }
        }
    }
    
    // Ordenar la lista
    return closure.sort((a, b) => a - b);
}
function move(states, G, symbol) {
    const result = [];
    // Para cada nodo en la lista de estados, encontrar las adyacencias con el símbolo
    for (const state of states) {
        const node = G.nodes.find(n => n.tag === state);
        for (const [trans, label] of node.adj) {
            if (label === symbol && !result.includes(trans.tag)) {
                result.push(trans.tag);
            }
        }
    }
    return result.sort((a, b) => a - b);
}

function epsilonClosureT(T, G) {
    const result = [];
    // Para cada estado en T, encontrar la clausura epsilon del estado
    for (const state of T) {
        result.push(...epsilonClosure(state, G));
    }
    return Array.from(new Set(result)).sort((a, b) => a - b);
}

function generateT(T, setValues) {
    // Comprobar si T está vacío
    if (T.length === 0) {
        // Si está vacío, generar la primera tupla ('A', setValues) y agregarla a T
        T.push(['A', setValues]);
    } else {
        // Si T no está vacío, encontrar la última tupla y obtener su primer valor
        const lastLetter = T[T.length - 1][0];
        
        // Obtener la siguiente letra mayúscula
        const nextLetter = String.fromCharCode(lastLetter.charCodeAt(0) + 1);
        
        // Crear la nueva tupla con la siguiente letra y setValues, y agregarla a T
        T.push([nextLetter, setValues]);
    }

    // Devolver la lista modificada T
    return T;
}

function assignValues(df, T, tag) {
    // Crear una columna 'values' vacía en el DataFrame
    df.forEach(row => row.values = '');

    // Iterar sobre cada fila en el DataFrame
    for (const row of df) {
        const state = row[0]; // Suponiendo que el estado está en la primera columna
        
        // Buscar la tupla en T que coincide con el valor de 'states'
        for (const t of T) {
            const [string, intList] = t;
            
            if (state === string) {
                // Comprobar si el valor 0 y/o el valor de tag están en la lista
                const hasZero = intList.includes(0);
                const hasTag = intList.includes(tag);
                
                if (hasZero && hasTag) {
                    row.values = '->*';
                } else if (hasZero) {
                    row.values = '->';
                } else if (hasTag) {
                    row.values = '*';
                } else {
                    row.values = '';
                }
                break;
            }
        }
    }
    
    // Mover la columna 'values' para que sea la primera columna en el DataFrame
    const newDf = df.map(row => ({ values: row.values, ...row }));
    
    return newDf;
}


function subsetMethod(G, alphabet) {
    // Generar un DataFrame ['states', 'a1',...,'an']
    const col = ['states', ...alphabet];
    const df = [];
    
    // Encontrar el último nodo en el gráfico de Thompson
    const f = G.nodes.find(n => n.final);
    
    // Cerradura-E(0)
    const A = epsilonClosure(0, G);
    
    // Agregar a la lista de estados
    let T = generateT([], A);
    
    // Cola de estados no revisados
    const queue = [T[0]];
    
    while (queue.length > 0) {
        const row = [];
        // Revisar el estado
        const L = queue.shift();
        // Agregar el estado de etiqueta
        row.push(L[0]);
        
        for (const element of alphabet) {
            // Cerradura-E(mueve(Ax, ax))
            const x = epsilonClosureT(move(L[1], G, element), G);
            
            if (x.length > 0) {
                // Si existe, buscar x en la lista de estados
                let label = '';
                for (const [symbol, compare] of T) {
                    if (JSON.stringify(x) === JSON.stringify(compare)) {
                        label = symbol;
                        break;
                    }
                }
                
                // Si x no está en la lista de estados, agregar a la lista de estados y a la cola de estados no revisados
                if (label === '') {
                    T = generateT(T, x);
                    queue.push(T[T.length - 1]);
                    label = T[T.length - 1][0];
                }
                
                // Transición
                row.push(label);
            } else {
                // Si el estado no tiene transición con ax
                row.push('');
            }
        }
        
        // Agregar la fila en el DataFrame
        df.push(row);
    }
    
    // Al final, agregar los valores -> o * en los estados que tienen el nodo inicial y final en el gráfico de Thompson
    const resultDf = assignValues(df, T, f.tag);
    return [resultDf,  T ];
}

function SigStates(G) {
    // Encontrar los nodos que tienen transiciones diferentes de '&'
    const states = [];
    for (const node of G.nodes) {
        for (const ad of node.adj) {
            if (ad[1] !== '&') {
                states.push(node.tag);
                break; // Salir del bucle si ya se encontró una transición válida
            }
        }
    }
    // Asegurar que se añade el último estado
    states.push(G.nodes[G.nodes.length - 1].tag);
    return [...new Set(states)].sort(); // Eliminar duplicados y ordenar
}

function AFD(T, G, df) {
    const states = SigStates(G);
    const N = []; // Lista para almacenar los registros de estados simétricos

    // Filtrar los estados en T
    for (let i = 0; i < T.length; i++) {
        const [symbol, numbers] = T[i];
        T[i] = [symbol, numbers.filter(num => states.includes(num))];
    }
    
    const Tres = [...T]; // Crear una copia de T
    const dic = {};
    
    // Comparar estados en T
    for (const [lett, numbs] of T) {
        for (const [other_lett, other_numbs] of T) {
            if (lett !== other_lett && JSON.stringify(numbs) === JSON.stringify(other_numbs)) {
                // Determinar cuál es el estado lexicográficamente menor
                const stateToKeep = lett < other_lett ? lett : other_lett;
                const stateToRemove = lett < other_lett ? other_lett : lett;
                
                if (!dic[stateToKeep]) {
                    dic[stateToKeep] = [];
                }
                dic[stateToKeep].push(stateToRemove);
                
                // Agregar a la lista N el mensaje de simetría antes de eliminar
                N.push(`${stateToKeep} is identical to ${stateToRemove}`);
                
                // Eliminar el estado duplicado
                T.splice(T.indexOf([other_lett, other_numbs]), 1);
                df = df.filter(row => row[0] !== stateToRemove);
            }
        }
    }
    
    // Reemplazar los estados eliminados en el dataframe
    for (const [key, values] of Object.entries(dic)) {
        for (const col of Object.keys(df[0])) {
            if (col !== 'states') {
                for (const value of values) {
                    df.forEach(row => {
                        if (row[col] === value) {
                            row[col] = key;
                        }
                    });
                }
            }
        }
    }
    
    return [df, Tres, N]; // Devolver también la lista N
}

function Transform(df, alphabet) {
    const result = {
        values: {},
        states: {},
    };

    // Crear claves para cada letra del alfabeto
    for (const letter of alphabet) {
        result[letter] = {};
    }

    // Iterar sobre las filas de df para construir result
    for (let i = 0; i < df.length; i++) {
        // La última columna se convierte en values
        result.values[i] = df[i].values;

        // La primera columna se convierte en states
        result.states[i] = df[i][0];

        // Asignar valores para cada letra del alfabeto
        for (let j = 0; j < alphabet.length; j++) {
            const letter = alphabet[j];
            result[letter][i] = df[i][j + 1] && df[i][j + 1].length > 0 ? df[i][j + 1][0] : ""; // Asignar valor de la tabla o cadena vacía
        }
    }

    return result;
}

function generateAutomatonJSON(regex) {
    // Verificar si el regex es simple
    const isSimple = isSimpleRegex(regex);
    let alphabet = [];
    let graph;

    if (isSimple) {
        alphabet = Alphabet(regex);
        graph = thompson(regex);
        
        // Generar la tabla de transiciones
        const TT = transitionTable(graph, [...alphabet]);
        // Generar AFDnop y T
        const [ AFDnop, T ] = subsetMethod(graph, alphabet);
        const NewAFDnop = Transform(AFDnop, [...alphabet])
        // Generar AFDop
        const [AFDop, states, identical] = AFD([...T], graph, AFDnop);
        const newAFDop = Transform(AFDop, alphabet)

        // Crear la estructura del JSON
        const jsonOutput = {
            alphabet: alphabet,
            graph: {
                nodes: graph.nodes.map(node => ({
                    tag: node.tag,
                    initial: node.initial,
                    final: node.final,
                    adj: node.adj.map(adj => [adj[0].tag, adj[1]])
                }))
            },
            Transition_table: TT,
            AFDnop: NewAFDnop,
            T: T,
            AFDop: newAFDop,
            states: states,
            identical: identical
        };

        return jsonOutput;
    } else {
        return {};
    }
}
function test(table, regex) {
    console.log(table)
    console.log(regex)
    // Caso donde la expresión regular es vacía
    if (regex === '') {
        const row = table.states["0"] === 'A' ? table.values["0"] : null;
        if (row === '->*') {
            return {
                "sussefull": true,
                "transitions": [
                    {
                        "node1": "A",
                        "node2": "",
                        "chart": ""
                    }
                ]
            };
        } else {
            return {
                "sussefull": false,
                "transitions": [
                    {
                        "node1": "A",
                        "node2": "",
                        "chart": ""
                    }
                ]
            };
        }
    } else {
        let i = 0;
        const transitions = [];
        // Estado inicial
        let find = 'A';

        while (i < regex.length) {
            const chart = regex[i];
            // Verificar si el símbolo está en el alfabeto
            if (table.hasOwnProperty(chart)) {
                // Buscar el estado
                const row = Object.keys(table.states).find(key => table.states[key] === find);

                if (row !== undefined) {
                    // Encontrar la transición
                    const result = table[chart][row];

                    if (result !== '') {
                        // Cuando hay una transición
                        transitions.push({
                            "node1": find,
                            "node2": result,
                            "chart": chart
                        });
                        find = result;
                    } else {
                        // Cuando la transición es vacía
                        transitions.push({
                            "node1": find,
                            "node2": "",
                            "chart": chart
                        });
                        return {
                            "sussefull": false,
                            "transitions": transitions
                        };
                    }
                }
            } else {
                // Cuando el símbolo no está en el alfabeto
                transitions.push({
                    "node1": find,
                    "node2": "",
                    "chart": chart
                });
                return {
                    "sussefull": false,
                    "transitions": transitions
                };
            }

            if (i === regex.length - 1) {
                // Verificar si el estado final es un estado aceptado
                const finalState = Object.keys(table.states).find(key => table.states[key] === find);
                if (table.values[finalState] === '*' || table.values[finalState] === '->*') {
                    return {
                        "sussefull": true,
                        "transitions": transitions
                    };
                }
            }

            i++;
        }

        return {
            "sussefull": false,
            "transitions": transitions
        };
    }
}


export{generateAutomatonJSON, test};


















